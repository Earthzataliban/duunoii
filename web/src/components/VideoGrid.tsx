'use client';

import { useState, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

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
  status: string;
}

interface VideoGridProps {
  className?: string;
  limit?: number;
  userId?: string;
  title?: string;
}

export function VideoGrid({ className, limit = 12, userId, title = 'Latest Videos' }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadVideos(1, true);
  }, [userId, limit]);

  const loadVideos = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos`);
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('limit', limit.toString());
      
      if (userId) {
        url.searchParams.append('userId', userId);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      
      if (reset) {
        setVideos(data.videos || []);
      } else {
        setVideos(prev => [...prev, ...(data.videos || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadVideos(page + 1, false);
    }
  };

  const retry = () => {
    loadVideos(1, true);
  };

  if (loading && videos.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-3" />
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load videos</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={retry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
            <p className="text-muted-foreground">
              {userId ? 'This user hasn\'t uploaded any videos yet.' : 'No videos have been uploaded yet.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            id={video.id}
            title={video.title}
            description={video.description}
            thumbnailUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${video.id}/thumbnail`}
            views={video.views}
            createdAt={video.createdAt}
            uploader={video.uploader}
            className="w-full"
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}