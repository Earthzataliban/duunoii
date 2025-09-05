'use client';

import { io, Socket } from 'socket.io-client';

export interface ProgressUpdate {
  videoId: string;
  stage: 'uploading' | 'validating' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  uploadProgress?: number;
  processingProgress?: number;
  overallProgress: number;
  currentTask?: string;
  error?: string;
  speed?: number;
  eta?: number;
  fileSize?: number;
  uploadedBytes?: number;
}

export class UploadProgressService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      this.socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      
      // Auto-reconnect if disconnect wasn't intentional
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached. Please refresh the page.');
    }
  }

  // Subscribe to progress updates for a specific upload
  subscribeToUpload(uploadId: string, callback: (progress: ProgressUpdate) => void) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return () => {}; // Return cleanup function
    }

    // Join the upload room
    this.socket.emit('join-upload', uploadId);

    // Listen for progress updates
    const progressHandler = (data: ProgressUpdate) => {
      if (data.videoId === uploadId) {
        callback(data);
      }
    };

    this.socket.on('upload-progress', progressHandler);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.emit('leave-upload', uploadId);
        this.socket.off('upload-progress', progressHandler);
      }
    };
  }

  // Subscribe to all uploads for a user (for dashboard)
  subscribeToUserUploads(userId: string, callback: (progress: ProgressUpdate) => void) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return () => {};
    }

    this.socket.emit('join-user-uploads', userId);

    const progressHandler = (data: ProgressUpdate) => {
      callback(data);
    };

    this.socket.on('user-upload-progress', progressHandler);

    return () => {
      if (this.socket) {
        this.socket.emit('leave-user-uploads', userId);
        this.socket.off('user-upload-progress', progressHandler);
      }
    };
  }

  // Notify server about upload start
  startUpload(uploadId: string, userId: string, fileSize: number) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('upload-start', {
      uploadId,
      userId,
      fileSize,
      timestamp: Date.now()
    });
  }

  // Send upload progress update
  updateUploadProgress(uploadId: string, progress: Partial<ProgressUpdate>) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('upload-progress-update', {
      uploadId,
      ...progress,
      timestamp: Date.now()
    });
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Manually reconnect
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
let progressService: UploadProgressService | null = null;

export const getUploadProgressService = (): UploadProgressService => {
  if (!progressService) {
    progressService = new UploadProgressService();
  }
  return progressService;
};

// Hook for React components
export function useUploadProgress() {
  const service = getUploadProgressService();
  
  return {
    subscribeToUpload: service.subscribeToUpload.bind(service),
    subscribeToUserUploads: service.subscribeToUserUploads.bind(service),
    startUpload: service.startUpload.bind(service),
    updateUploadProgress: service.updateUploadProgress.bind(service),
    isConnected: service.isConnected.bind(service),
    reconnect: service.reconnect.bind(service),
  };
}