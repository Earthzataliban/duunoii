'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  HardDrive,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadProgressData {
  stage: 'idle' | 'uploading' | 'validating' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  uploadProgress?: number; // 0-100 for file upload
  processingProgress?: number; // 0-100 for video processing
  overallProgress: number; // 0-100 overall
  speed?: number; // bytes per second
  eta?: number; // estimated time in seconds
  fileSize?: number;
  uploadedBytes?: number;
  currentTask?: string;
  error?: string;
}

interface UploadProgressProps {
  data: UploadProgressData;
  fileName?: string;
  className?: string;
}

export function UploadProgress({ data, fileName, className }: UploadProgressProps) {
  const [displaySpeed, setDisplaySpeed] = useState<string>('');
  const [displayETA, setDisplayETA] = useState<string>('');
  const [displaySize, setDisplaySize] = useState<string>('');

  useEffect(() => {
    if (data.speed) {
      setDisplaySpeed(formatSpeed(data.speed));
    }
    if (data.eta) {
      setDisplayETA(formatTime(data.eta));
    }
    if (data.fileSize) {
      setDisplaySize(formatFileSize(data.fileSize));
    }
  }, [data.speed, data.eta, data.fileSize]);

  const formatSpeed = (bytesPerSecond: number): string => {
    const mbps = bytesPerSecond / (1024 * 1024);
    if (mbps >= 1) {
      return `${mbps.toFixed(1)} MB/s`;
    }
    const kbps = bytesPerSecond / 1024;
    return `${kbps.toFixed(0)} KB/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.ceil(remainingSeconds)}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStageInfo = () => {
    switch (data.stage) {
      case 'idle':
        return { icon: Upload, label: 'Ready to upload', color: 'text-muted-foreground' };
      case 'uploading':
        return { icon: Upload, label: 'Uploading file...', color: 'text-blue-500' };
      case 'validating':
        return { icon: Loader2, label: 'Validating file...', color: 'text-yellow-500' };
      case 'processing':
        return { icon: Loader2, label: 'Processing video...', color: 'text-orange-500' };
      case 'encoding':
        return { icon: Zap, label: 'Encoding streams...', color: 'text-purple-500' };
      case 'finalizing':
        return { icon: Loader2, label: 'Finalizing...', color: 'text-green-400' };
      case 'completed':
        return { icon: CheckCircle, label: 'Upload completed!', color: 'text-green-500' };
      case 'error':
        return { icon: AlertCircle, label: 'Upload failed', color: 'text-destructive' };
      default:
        return { icon: Upload, label: 'Unknown status', color: 'text-muted-foreground' };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;
  const isAnimated = ['uploading', 'validating', 'processing', 'encoding', 'finalizing'].includes(data.stage);

  return (
    <div className={cn("bg-card rounded-lg p-6 border space-y-4", className)}>
      {/* Stage Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon 
            className={cn(
              "h-5 w-5",
              stageInfo.color,
              isAnimated && "animate-spin"
            )} 
          />
          <div>
            <h3 className="font-semibold text-foreground">{stageInfo.label}</h3>
            {fileName && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{fileName}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">{data.overallProgress}%</div>
          {data.currentTask && (
            <div className="text-xs text-muted-foreground">{data.currentTask}</div>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-secondary rounded-full h-3">
          <div 
            className={cn(
              "h-3 rounded-full transition-all duration-500 ease-out",
              data.stage === 'error' ? 'bg-destructive' :
              data.stage === 'completed' ? 'bg-green-500' :
              'bg-primary'
            )}
            style={{ width: `${data.overallProgress}%` }}
          />
        </div>
        
        {/* Detailed Progress for Upload Stage */}
        {data.stage === 'uploading' && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>Upload: {data.uploadProgress ?? 0}%</span>
            </div>
            {data.speed && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>{displaySpeed}</span>
              </div>
            )}
            {data.eta && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>ETA: {displayETA}</span>
              </div>
            )}
          </div>
        )}

        {/* Processing Progress */}
        {['processing', 'encoding', 'finalizing'].includes(data.stage) && (
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Processing: {data.processingProgress ?? 0}%</span>
              {data.currentTask && <span className="text-xs">{data.currentTask}</span>}
            </div>
          </div>
        )}

        {/* File Size Info */}
        {data.fileSize && data.uploadedBytes && data.stage === 'uploading' && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>{formatFileSize(data.uploadedBytes)} / {displaySize}</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {data.stage === 'error' && data.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm text-destructive">{data.error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {data.stage === 'completed' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-600 dark:text-green-400">
              Video uploaded and processed successfully! You will be redirected to the video page.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}