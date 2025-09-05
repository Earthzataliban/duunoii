'use client';

import { AuthService } from './auth';
import { getUploadProgressService, ProgressUpdate } from './websocket';

export interface UploadOptions {
  onProgress?: (progress: ProgressUpdate) => void;
  onComplete?: (videoId: string) => void;
  onError?: (error: string) => void;
}

export interface UploadData {
  title: string;
  description: string;
  file: File;
}

export class EnhancedUploadService {
  private static generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private static calculateSpeed(
    uploadedBytes: number,
    startTime: number,
    currentTime: number
  ): number {
    const elapsedSeconds = (currentTime - startTime) / 1000;
    return elapsedSeconds > 0 ? uploadedBytes / elapsedSeconds : 0;
  }

  private static estimateTimeRemaining(
    totalBytes: number,
    uploadedBytes: number,
    speed: number
  ): number {
    if (speed <= 0) return 0;
    const remainingBytes = totalBytes - uploadedBytes;
    return remainingBytes / speed;
  }

  static async uploadWithProgress(
    uploadData: UploadData,
    options: UploadOptions = {}
  ): Promise<{ videoId: string; success: boolean }> {
    const uploadId = this.generateUploadId();
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const progressService = getUploadProgressService();
    
    // Get current user ID from token for WebSocket subscription
    let userId = '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch {
      console.warn('Could not parse user ID from token');
    }

    // Initialize WebSocket progress tracking
    if (userId) {
      progressService.startUpload(uploadId, userId, uploadData.file.size);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      const startTime = Date.now();
      
      let lastProgressUpdate = 0;
      const progressThrottle = 100; // Update progress every 100ms max

      formData.append('video', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const currentTime = Date.now();
          
          // Throttle progress updates
          if (currentTime - lastProgressUpdate < progressThrottle) {
            return;
          }
          lastProgressUpdate = currentTime;

          const uploadProgress = Math.round((e.loaded / e.total) * 100);
          const speed = this.calculateSpeed(e.loaded, startTime, currentTime);
          const eta = this.estimateTimeRemaining(e.total, e.loaded, speed);

          const progressData: ProgressUpdate = {
            videoId: uploadId,
            stage: 'uploading',
            uploadProgress,
            processingProgress: 0,
            overallProgress: Math.round(uploadProgress * 0.3), // Upload is 30% of total process
            currentTask: 'Uploading file to server...',
            speed,
            eta,
            fileSize: e.total,
            uploadedBytes: e.loaded,
          };

          // Call local callback
          options.onProgress?.(progressData);

          // Update via WebSocket
          if (userId) {
            progressService.updateUploadProgress(uploadId, progressData);
          }
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            // Check response structure - try different possible formats
            let videoId: string | null = null;
            
            if (response.data?.id) {
              videoId = response.data.id;
            } else if (response.id) {
              videoId = response.id;  
            } else {
              // Log response for debugging
              console.log('Full server response:', response);
              throw new Error('No video ID found in server response');
            }

            const progressData: ProgressUpdate = {
              videoId: videoId,
              stage: 'validating',
              uploadProgress: 100,
              processingProgress: 0,
              overallProgress: 35,
              currentTask: 'Validating uploaded file...',
            };

            options.onProgress?.(progressData);
            
            if (userId) {
              progressService.updateUploadProgress(videoId, progressData);
            }

            // Start polling for processing status
            this.pollProcessingStatus(videoId, options, userId);
            
            resolve({ videoId: videoId, success: true });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to parse server response';
            this.handleError(uploadId, errorMsg, options, userId);
            reject(new Error(errorMsg));
          }
        } else {
          const errorMsg = `Upload failed with status ${xhr.status}`;
          this.handleError(uploadId, errorMsg, options, userId);
          reject(new Error(errorMsg));
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        const errorMsg = 'Network error during upload';
        this.handleError(uploadId, errorMsg, options, userId);
        reject(new Error(errorMsg));
      });

      // Handle timeouts
      xhr.addEventListener('timeout', () => {
        const errorMsg = 'Upload timeout';
        this.handleError(uploadId, errorMsg, options, userId);
        reject(new Error(errorMsg));
      });

      // Configure and start the upload
      xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
      xhr.open('POST', `${API_URL}/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      // Start upload with initial progress
      const initialProgress: ProgressUpdate = {
        videoId: uploadId,
        stage: 'uploading',
        uploadProgress: 0,
        processingProgress: 0,
        overallProgress: 0,
        currentTask: 'Starting upload...',
        fileSize: uploadData.file.size,
        uploadedBytes: 0,
      };
      
      options.onProgress?.(initialProgress);
      xhr.send(formData);
    });
  }

  private static async pollProcessingStatus(
    videoId: string,
    options: UploadOptions,
    userId: string
  ): Promise<void> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const token = AuthService.getToken();
    const progressService = getUploadProgressService();
    
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(
          `${API_URL}/videos/${videoId}/processing-status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const status = result.data?.status;
        
        // Calculate processing progress based on status
        let stage: ProgressUpdate['stage'] = 'processing';
        let processingProgress = 0;
        let overallProgress = 40;
        let currentTask = 'Processing video...';

        switch (status) {
          case 'processing':
            stage = 'processing';
            processingProgress = Math.min(20 + (attempts * 2), 60);
            overallProgress = 40 + (processingProgress * 0.4);
            currentTask = 'Analyzing video file...';
            break;
          case 'encoding':
            stage = 'encoding';
            processingProgress = Math.min(60 + (attempts * 1.5), 90);
            overallProgress = 40 + (processingProgress * 0.5);
            currentTask = 'Encoding multiple resolutions...';
            break;
          case 'finalizing':
            stage = 'finalizing';
            processingProgress = 95;
            overallProgress = 95;
            currentTask = 'Finalizing upload...';
            break;
          case 'completed':
            stage = 'completed';
            processingProgress = 100;
            overallProgress = 100;
            currentTask = 'Upload completed successfully!';
            
            const completedProgress: ProgressUpdate = {
              videoId,
              stage,
              uploadProgress: 100,
              processingProgress,
              overallProgress,
              currentTask,
            };

            options.onProgress?.(completedProgress);
            
            if (userId) {
              progressService.updateUploadProgress(videoId, completedProgress);
            }
            
            options.onComplete?.(videoId);
            return;
          case 'failed':
            throw new Error('Video processing failed');
        }

        const progressData: ProgressUpdate = {
          videoId,
          stage,
          uploadProgress: 100,
          processingProgress,
          overallProgress,
          currentTask,
        };

        options.onProgress?.(progressData);
        
        if (userId) {
          progressService.updateUploadProgress(videoId, progressData);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Processing timeout');
        }

        // Continue polling
        setTimeout(poll, 5000);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Processing failed';
        this.handleError(videoId, `Processing error: ${errorMsg}`, options, userId);
      }
    };

    // Start polling
    setTimeout(poll, 2000); // Start after 2 seconds
  }

  private static handleError(
    videoId: string,
    error: string,
    options: UploadOptions,
    userId: string
  ): void {
    const errorProgress: ProgressUpdate = {
      videoId,
      stage: 'error',
      uploadProgress: 0,
      processingProgress: 0,
      overallProgress: 0,
      error,
    };

    options.onProgress?.(errorProgress);
    options.onError?.(error);

    if (userId) {
      const progressService = getUploadProgressService();
      progressService.updateUploadProgress(videoId, errorProgress);
    }
  }
}

// Convenience function for simple usage
export const uploadVideo = (
  uploadData: UploadData,
  options: UploadOptions = {}
) => {
  return EnhancedUploadService.uploadWithProgress(uploadData, options);
};