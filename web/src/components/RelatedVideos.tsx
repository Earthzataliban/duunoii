'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Clock } from 'lucide-react';

interface RelatedVideo {
  id: string;
  title: string;
  views: number;
  createdAt: string;
  uploader: {
    username: string;
  };
  thumbnailUrl?: string;
  duration?: string;
}

interface RelatedVideosProps {
  currentVideoId: string;
}

export function RelatedVideos({ currentVideoId }: RelatedVideosProps) {
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      try {
        // Fetch all videos except current one
        const response = await fetch('http://localhost:8080/videos?limit=10');
        if (response.ok) {
          const data = await response.json();
          const filteredVideos = data.videos.filter(
            (video: RelatedVideo) => video.id !== currentVideoId
          );
          setRelatedVideos(filteredVideos);
        }
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedVideos();
  }, [currentVideoId]);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const generateThumbnailUrl = (videoId: string) => {
    // Use our API endpoint for thumbnail
    return `http://localhost:8080/videos/${videoId}/thumbnail`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">Related Videos</h2>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-40 h-24 bg-gray-300 rounded-md"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-1 w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Related Videos</h2>
      
      {relatedVideos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No related videos found
        </div>
      ) : (
        <div className="space-y-4">
          {relatedVideos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="block group"
            >
              <div className="flex gap-3 hover:bg-secondary/30 p-2 rounded-lg transition-colors">
                {/* Thumbnail */}
                <div className="relative w-40 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generateThumbnailUrl(video.id)}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      // Fallback to placeholder if thumbnail fails to load
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${video.id}&backgroundColor=1e293b&size=320`;
                    }}
                  />
                  
                  {/* Duration overlay */}
                  {video.duration && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                      {video.duration}
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {video.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-1">
                    {video.uploader.username}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatViews(video.views)}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(video.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}