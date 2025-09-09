'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  duration?: number;
  views: number;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
    email: string;
  };
  className?: string;
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  duration,
  views,
  createdAt,
  uploader,
  className
}: VideoCardProps) {
  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on profile links
    const target = e.target as HTMLElement;
    if (target.closest('[data-profile-link]')) {
      return;
    }
    
    // Navigate to video
    window.location.href = `/watch/${id}`;
  };

  return (
    <div className={`group cursor-pointer ${className}`} onClick={handleVideoClick}>
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        
        {/* Duration Badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(duration)}
            </div>
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Video Info */}
      <div className="flex gap-3">
        {/* Channel Avatar */}
        <Link 
          href={`/profile/${uploader.username}`} 
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          data-profile-link
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="w-9 h-9">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${uploader.username}`} />
            <AvatarFallback className="text-xs">
              {getUserInitials(uploader.username)}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Video Details */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-foreground text-sm leading-5 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Channel Name */}
          <Link 
            href={`/profile/${uploader.username}`} 
            className="block w-fit"
            data-profile-link
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-muted-foreground text-xs mb-1 hover:text-foreground transition-colors">
              {uploader.username}
            </p>
          </Link>

          {/* View Count & Upload Time */}
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Eye size={10} />
              <span>{formatViews(views)} views</span>
            </div>
            <span>•</span>
            <span>{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}