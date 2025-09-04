'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Eye, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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

interface VideoMetadataProps {
  video: Video;
}

export function VideoMetadata({ video }: VideoMetadataProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const loadVideoStats = useCallback(async () => {
    try {
      // Load like status (requires auth)
      const token = getAuthToken();
      if (token) {
        const likeResponse = await fetch(`http://localhost:8080/videos/${video.id}/like-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setLikeCount(likeData.likeCount);
          setDislikeCount(likeData.dislikeCount);
          setLiked(likeData.userLikeType === 'LIKE');
          setDisliked(likeData.userLikeType === 'DISLIKE');
        }

        // Load subscription status
        const subResponse = await fetch(`http://localhost:8080/users/${video.uploader.id}/subscription-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (subResponse.ok) {
          const subData = await subResponse.json();
          setSubscribed(subData.isSubscribed);
          setSubscriberCount(subData.subscriberCount);
        }
      }
    } catch (error) {
      console.error('Failed to load video stats:', error);
    }
  }, [video.id, video.uploader.id]);

  // Load like status and counts on component mount
  useEffect(() => {
    loadVideoStats();
  }, [loadVideoStats]);

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

  const handleLike = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to like videos');
      return;
    }

    setLoading(true);
    try {
      if (liked) {
        // Unlike
        const response = await fetch(`http://localhost:8080/videos/${video.id}/like`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setLiked(false);
          setLikeCount(data.likeCount);
          setDislikeCount(data.dislikeCount);
        }
      } else {
        // Like
        const response = await fetch(`http://localhost:8080/videos/${video.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'LIKE' }),
        });
        if (response.ok) {
          const data = await response.json();
          setLiked(true);
          setDisliked(false);
          setLikeCount(data.likeCount);
          setDislikeCount(data.dislikeCount);
        }
      }
    } catch (error) {
      console.error('Failed to like video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to dislike videos');
      return;
    }

    setLoading(true);
    try {
      if (disliked) {
        // Remove dislike
        const response = await fetch(`http://localhost:8080/videos/${video.id}/like`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDisliked(false);
          setLikeCount(data.likeCount);
          setDislikeCount(data.dislikeCount);
        }
      } else {
        // Dislike
        const response = await fetch(`http://localhost:8080/videos/${video.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'DISLIKE' }),
        });
        if (response.ok) {
          const data = await response.json();
          setDisliked(true);
          setLiked(false);
          setLikeCount(data.likeCount);
          setDislikeCount(data.dislikeCount);
        }
      }
    } catch (error) {
      console.error('Failed to dislike video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to subscribe');
      return;
    }

    setLoading(true);
    try {
      if (subscribed) {
        // Unsubscribe
        const response = await fetch(`http://localhost:8080/users/${video.uploader.id}/subscribe`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSubscribed(false);
          setSubscriberCount(data.subscriberCount);
        }
      } else {
        // Subscribe
        const response = await fetch(`http://localhost:8080/users/${video.uploader.id}/subscribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSubscribed(true);
          setSubscriberCount(data.subscription.subscriberCount || data.subscriberCount);
        }
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Video Title */}
      <h1 className="text-xl md:text-2xl font-bold text-foreground line-clamp-2">
        {video.title}
      </h1>

      {/* Video Stats and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Views and Date */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye size={16} />
            {formatViews(video.views)}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            {formatDate(video.createdAt)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors disabled:opacity-50 ${
              liked 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-secondary border-border'
            }`}
          >
            <ThumbsUp size={16} />
            <span className="text-sm font-medium">
              {likeCount > 0 ? likeCount : 'Like'}
            </span>
          </button>
          
          <button
            onClick={handleDislike}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors disabled:opacity-50 ${
              disliked 
                ? 'bg-destructive text-destructive-foreground border-destructive' 
                : 'hover:bg-secondary border-border'
            }`}
          >
            <ThumbsDown size={16} />
            {dislikeCount > 0 && (
              <span className="text-sm font-medium">{dislikeCount}</span>
            )}
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-border hover:bg-secondary transition-colors"
          >
            <Share2 size={16} />
            <span className="text-sm font-medium">Share</span>
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-border hover:bg-secondary transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Channel Info */}
      <div className="flex items-start justify-between gap-4 p-4 bg-secondary/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.uploader.username}`} />
            <AvatarFallback>{getUserInitials(video.uploader.username)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {video.uploader.username}
            </h3>
            <p className="text-sm text-muted-foreground">
              {subscriberCount > 0 ? `${subscriberCount} subscribers` : 'No subscribers yet'} • Published {formatDate(video.createdAt)}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`px-4 py-2 rounded-full font-medium text-sm transition-colors disabled:opacity-50 ${
            subscribed
              ? 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {loading ? 'Loading...' : (subscribed ? 'Subscribed' : 'Subscribe')}
        </button>
      </div>

      {/* Description */}
      {video.description && (
        <div className="p-4 bg-secondary/30 rounded-lg">
          <div className={`text-sm text-foreground ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {video.description}
          </div>
          {video.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}