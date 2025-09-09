'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Play, Trash2, Calendar, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface WatchHistoryItem {
  id: string;
  progress: number;
  watchedAt: string;
  video: {
    id: string;
    title: string;
    description: string;
    duration?: number;
    views: number;
    createdAt: string;
    uploader: {
      id: string;
      username: string;
    };
  };
}

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadWatchHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadWatchHistory = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      setLoading(pageNum === 1);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/me/watch-history?page=${pageNum}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load watch history');
      }

      const data = await response.json();
      
      if (reset) {
        setWatchHistory(data.history || []);
      } else {
        setWatchHistory(prev => [...prev, ...(data.history || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading watch history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load watch history');
    } finally {
      setLoading(false);
    }
  };

  const removeFromHistory = async (videoId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${videoId}/watch-progress`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setWatchHistory(prev => prev.filter(item => item.video.id !== videoId));
      }
    } catch (err) {
      console.error('Error removing from history:', err);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all watch history?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/me/watch-history`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setWatchHistory([]);
      }
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProgressPercentage = (progress: number, duration?: number) => {
    if (!duration || duration === 0) return 0;
    return Math.min((progress / duration) * 100, 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Watch History</h1>
        <p className="text-muted-foreground mb-6">Sign in to see your watch history</p>
        <Link href="/?auth=login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading && watchHistory.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-card rounded-lg animate-pulse">
              <div className="w-48 h-28 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Watch History</h1>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => loadWatchHistory()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Watch History</h1>
        <p className="text-muted-foreground mb-6">No videos in your watch history yet</p>
        <Link href="/">
          <Button>Discover Videos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Watch History</h1>
          <p className="text-muted-foreground">{watchHistory.length} videos watched</p>
        </div>
        <Button 
          onClick={clearAllHistory}
          variant="outline" 
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {watchHistory.map((item) => (
          <div key={`${item.video.id}-${item.watchedAt}`} className="bg-card border rounded-lg p-4 hover:bg-card/80 transition-colors">
            <div className="flex gap-4">
              {/* Video Thumbnail */}
              <Link href={`/watch/${item.video.id}`} className="flex-shrink-0 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${item.video.id}/thumbnail`}
                  alt={item.video.title}
                  className="w-48 h-28 object-cover rounded bg-muted"
                  loading="lazy"
                />
                {/* Progress bar overlay */}
                {item.video.duration && item.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                    <div className="w-full bg-white/30 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(item.progress, item.video.duration)}%` }}
                      />
                    </div>
                  </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/watch/${item.video.id}`}>
                      <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors mb-1">
                        {item.video.title}
                      </h3>
                    </Link>
                    
                    <Link href={`/profile/${item.video.uploader.username}`} className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.video.uploader.username}`} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(item.video.uploader.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{item.video.uploader.username}</span>
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{formatViews(item.video.views)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Watched {formatTimeAgo(item.watchedAt)}</span>
                      </div>
                      {item.video.duration && (
                        <span>
                          {formatDuration(item.progress)} / {formatDuration(item.video.duration)}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {item.video.duration && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{Math.round(getProgressPercentage(item.progress, item.video.duration))}% watched</span>
                          <span>{formatDuration(item.video.duration - item.progress)} left</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(item.progress, item.video.duration)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.video.description || 'No description available.'}
                    </p>
                  </div>

                  <Button
                    onClick={() => removeFromHistory(item.video.id)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => loadWatchHistory(page + 1, false)}
            disabled={loading}
            variant="outline"
            className="min-w-[120px]"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}