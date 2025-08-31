'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Video, 
  X, 
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });

  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    thumbnail: null as File | null,
  });

  // Show loading state while checking authentication
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Please login to upload videos</div>
          <Button onClick={() => router.push('/')} className="bg-red-600 hover:bg-red-700">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        if (!videoData.title) {
          setVideoData(prev => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, "")
          }));
        }
      } else {
        alert('Please select a video file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!videoData.title) {
        setVideoData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, "")
        }));
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Utility function for future use
  // const formatDuration = (seconds: number): string => {
  //   const hours = Math.floor(seconds / 3600);
  //   const minutes = Math.floor((seconds % 3600) / 60);
  //   const secs = Math.floor(seconds % 60);
  //   
  //   if (hours > 0) {
  //     return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  //   }
  //   return `${minutes}:${secs.toString().padStart(2, '0')}`;
  // };

  const uploadVideo = async () => {
    console.log('Upload button clicked!');
    console.log('Selected file:', selectedFile);
    console.log('Title:', videoData.title);
    console.log('User:', user);
    
    if (!selectedFile || !videoData.title.trim()) {
      console.log('Missing file or title');
      return;
    }

    setUploadProgress({ progress: 0, status: 'uploading', message: 'Uploading video...' });

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);

    try {
      const token = AuthService.getToken();
      console.log('Token from AuthService:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadProgress({ 
        progress: 100, 
        status: 'processing', 
        message: 'Processing video...' 
      });

      // Poll for processing status
      if (result.data && result.data.id) {
        pollProcessingStatus(result.data.id);
      } else {
        console.error('No video ID in response:', result);
        setUploadProgress({ 
          progress: 100, 
          status: 'completed', 
          message: 'Upload completed but processing status unavailable' 
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: 'Upload failed. Please try again.' 
      });
    }
  };

  const pollProcessingStatus = async (videoId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${videoId}/processing-status`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        const result = await response.json();
        
        if (result.data && result.data.status === 'completed') {
          setUploadProgress({ 
            progress: 100, 
            status: 'completed', 
            message: 'Video uploaded successfully!' 
          });
          clearInterval(poll);
          
          // Redirect to video page after 2 seconds
          setTimeout(() => {
            router.push(`/watch/${videoId}`);
          }, 2000);
        } else if (result.data && result.data.status === 'failed') {
          setUploadProgress({ 
            progress: 0, 
            status: 'error', 
            message: 'Video processing failed.' 
          });
          clearInterval(poll);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setUploadProgress({ 
            progress: 100, 
            status: 'error', 
            message: 'Processing timeout. Video may still be processing.' 
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const removeFile = () => {
    setSelectedFile(null);
    setVideoData({ title: '', description: '', thumbnail: null });
    setUploadProgress({ progress: 0, status: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
          <p className="text-gray-400">Share your content with the world</p>
          
          {/* Debug Info */}
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
            <p><strong>Debug Info:</strong></p>
            <p>• User authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>• User: {user ? user.email || user.username : 'None'}</p>
            <p>• Token: {typeof window !== 'undefined' ? localStorage.getItem('token') ? 'Found' : 'Not found' : 'SSR'}</p>
            <p>• AuthService Token: {AuthService.getToken() ? 'Found' : 'Not found'}</p>
            <p>• Selected file: {selectedFile ? selectedFile.name : 'None'}</p>
            <p>• Title: &quot;{videoData.title}&quot;</p>
            <p>• Button disabled: {(!selectedFile || !videoData.title.trim() || uploadProgress.status === 'uploading' || uploadProgress.status === 'processing').toString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* File Upload Area */}
            {!selectedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drop your video here
                </h3>
                <p className="text-gray-400 mb-4">
                  or click to browse files
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, AVI, MOV, WMV (Max 100MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Video className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-white font-medium">{selectedFile.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {uploadProgress.status !== 'idle' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{uploadProgress.message}</span>
                      <span className="text-sm text-gray-400">{uploadProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          uploadProgress.status === 'error' ? 'bg-red-500' :
                          uploadProgress.status === 'completed' ? 'bg-green-500' :
                          'bg-blue-500'
                        )}
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center mt-2">
                      {uploadProgress.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
                      )}
                      {uploadProgress.status === 'processing' && (
                        <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mr-2" />
                      )}
                      {uploadProgress.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      )}
                      {uploadProgress.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={cn(
                        "text-sm",
                        uploadProgress.status === 'error' ? 'text-red-500' :
                        uploadProgress.status === 'completed' ? 'text-green-500' :
                        'text-gray-400'
                      )}>
                        {uploadProgress.message}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Details Form */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Video Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title"
                    className="bg-gray-700 border-gray-600 text-white"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {videoData.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={videoData.description}
                    onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell viewers about your video"
                    className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {videoData.description.length}/1000 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={(e) => {
                console.log('Button clicked event:', e);
                uploadVideo();
              }}
              disabled={!selectedFile || !videoData.title.trim() || uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'}
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
              size="lg"
            >
              {uploadProgress.status === 'uploading' || uploadProgress.status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>

            {selectedFile && uploadProgress.status === 'idle' && (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Before you upload:</p>
                    <ul className="space-y-1 text-blue-300">
                      <li>• Make sure your video follows our community guidelines</li>
                      <li>• Video will be processed after upload (may take several minutes)</li>
                      <li>• You&apos;ll be redirected to your video once processing is complete</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}