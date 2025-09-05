'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UploadProgress, UploadProgressData } from '@/components/UploadProgress';
import { uploadVideo } from '@/lib/upload-service';
import { useUploadProgress } from '@/lib/websocket';
import { 
  Upload, 
  Video, 
  X, 
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressData>({
    stage: 'idle',
    overallProgress: 0
  });
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    thumbnail: null as File | null,
  });

  // Always call hooks before any early returns
  const { subscribeToUpload } = useUploadProgress();

  // Set up WebSocket subscription for real-time updates
  useEffect(() => {
    if (!uploadId) return;

    const unsubscribe = subscribeToUpload(uploadId, (progress) => {
      setUploadProgress(progress);
    });

    return unsubscribe;
  }, [uploadId, subscribeToUpload]);

  // Show loading state while checking authentication - moved after all hooks
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-4">Please login to upload videos</div>
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
        
        // Create video preview URL
        const previewUrl = URL.createObjectURL(file);
        setVideoPreviewUrl(previewUrl);
        
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
      
      // Create video preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
      
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

  const handleUpload = async () => {
    if (!selectedFile || !videoData.title.trim()) {
      return;
    }

    setUploading(true);
    
    try {
      const result = await uploadVideo(
        {
          file: selectedFile,
          title: videoData.title,
          description: videoData.description,
        },
        {
          onProgress: (progress) => {
            setUploadProgress(progress);
            setUploadId(progress.videoId);
          },
          onComplete: (videoId) => {
            console.log('Upload completed:', videoId);
            // Redirect to video page after 2 seconds
            setTimeout(() => {
              router.push(`/watch/${videoId}`);
            }, 2000);
          },
          onError: (error) => {
            console.error('Upload error:', error);
            setUploading(false);
          }
        }
      );

      console.log('Upload initiated:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress({
        stage: 'error',
        overallProgress: 0,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.'
      });
      setUploading(false);
    }
  };


  const removeFile = () => {
    setSelectedFile(null);
    
    // Cleanup video preview URL to free memory
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    
    setVideoData({ title: '', description: '', thumbnail: null });
    setUploadProgress({
      stage: 'idle',
      overallProgress: 0
    });
    setUploading(false);
    setUploadId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Video</h1>
          <p className="text-muted-foreground">Share your content with the world</p>
          
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
                    : "border-border hover:border-muted-foreground"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Drop your video here
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <p className="text-sm text-muted-foreground">
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
              <div className="bg-card rounded-lg p-6 border">
                {/* Video Preview */}
                {videoPreviewUrl && (
                  <div className="mb-4">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full max-h-64 rounded-lg bg-black"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Video className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="text-foreground font-medium">{selectedFile.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {uploadProgress.stage !== 'idle' && (
                  <UploadProgress 
                    data={uploadProgress} 
                    fileName={selectedFile.name}
                    className="mb-4"
                  />
                )}
              </div>
            )}
          </div>

          {/* Video Details Form */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-foreground mb-6">Video Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title"
                    className="bg-background border-border text-foreground"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {videoData.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={videoData.description}
                    onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell viewers about your video"
                    className="bg-background border-border text-foreground min-h-[120px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {videoData.description.length}/1000 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !videoData.title.trim() || uploading || uploadProgress.stage === 'completed'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadProgress.currentTask || 'Uploading...'}
                </>
              ) : uploadProgress.stage === 'completed' ? (
                <>
                  Upload Completed!
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>

            {selectedFile && uploadProgress.stage === 'idle' && !uploading && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Before you upload:</p>
                    <ul className="space-y-1 text-muted-foreground">
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