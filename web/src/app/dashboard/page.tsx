'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Play,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface VideoData {
  id: string;
  title: string;
  description: string;
  views: number;
  createdAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  _count: {
    likes: number;
    comments: number;
  };
}

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = AuthService.getToken();
      
      if (!token) {
        router.push('/');
        return;
      }

      // Load user's videos
      const videosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/my-videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        const userVideos = videosData.videos || [];
        setVideos(userVideos);
        
        // Calculate stats
        const stats: DashboardStats = {
          totalVideos: userVideos.length,
          totalViews: userVideos.reduce((sum: number, video: VideoData) => sum + video.views, 0),
          totalLikes: userVideos.reduce((sum: number, video: VideoData) => sum + video._count.likes, 0),
          totalComments: userVideos.reduce((sum: number, video: VideoData) => sum + video._count.comments, 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const token = AuthService.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove video from local state
        setVideos(prev => prev.filter(video => video.id !== videoId));
        // Recalculate stats
        loadDashboardData();
      } else {
        alert('Failed to delete video. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    }
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded-full">Ready</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded-full">Processing</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded-full">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">Unknown</span>;
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || video.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your videos and track performance</p>
          </div>
          
          <Link href="/upload">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalVideos}</p>
              </div>
              <Video className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold text-foreground">{formatViews(stats.totalViews)}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold text-foreground">{formatViews(stats.totalLikes)}</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold text-foreground">{formatViews(stats.totalComments)}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Videos List */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-foreground">My Videos ({filteredVideos.length})</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-32 h-20 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by uploading your first video.'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Link href="/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredVideos.map((video) => (
                <div key={video.id} className="p-6 flex gap-4 hover:bg-muted/5 transition-colors">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${video.id}/thumbnail`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {video.status.toLowerCase() === 'ready' && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {video.status.toLowerCase() === 'ready' ? (
                          <Link href={`/watch/${video.id}`} className="hover:text-primary">
                            {video.title}
                          </Link>
                        ) : (
                          video.title
                        )}
                      </h3>
                      {getStatusBadge(video.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {video.description || 'No description provided.'}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{formatViews(video.views)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{video._count.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{video._count.comments} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}