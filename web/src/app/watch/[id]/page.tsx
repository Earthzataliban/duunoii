'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoMetadata } from '@/components/VideoMetadata';
import { RelatedVideos } from '@/components/RelatedVideos';
import { Comments } from '@/components/Comments';

interface Video {
  id: string;
  title: string;
  description: string;
  views: number;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
    email: string;
  };
  status: 'PROCESSING' | 'READY' | 'FAILED';
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      try {
        const response = await fetch(`http://localhost:8080/videos/${videoId}`);
        if (!response.ok) {
          throw new Error('Video not found');
        }
        const videoData = await response.json();
        setVideo(videoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const incrementView = async () => {
    try {
      await fetch(`http://localhost:8080/videos/${videoId}/view`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to increment view:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">{error || 'Video not found'}</div>
      </div>
    );
  }

  if (video.status.toLowerCase() !== 'ready') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {video.status.toLowerCase() === 'processing' 
            ? 'Video is still processing. Please try again later.' 
            : 'Video processing failed.'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video content */}
        <div className="lg:col-span-2">
          <VideoPlayer videoId={videoId} onPlay={incrementView} />
          <VideoMetadata video={video} />
          <Comments videoId={videoId} />
        </div>
        
        {/* Sidebar with related videos */}
        <div className="lg:col-span-1">
          <RelatedVideos currentVideoId={videoId} />
        </div>
      </div>
    </div>
  );
}