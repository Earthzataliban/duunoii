'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Music, Lock, Globe, Calendar, Video, Trash2, Edit, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    items: number;
  };
  items: Array<{
    id: string;
    position: number;
    video: {
      id: string;
      title: string;
      uploader: {
        username: string;
      };
    };
  }>;
}

export default function PlaylistsPage() {
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPlaylists();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/playlists`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load playlists');
      }

      const data = await response.json();
      setPlaylists(data || []);
    } catch (err) {
      console.error('Error loading playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const isEditing = editingPlaylist !== null;
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/playlists/${editingPlaylist}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/playlists`;

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} playlist`);
      }

      // Reset form and reload playlists
      setFormData({ title: '', description: '', isPublic: false });
      setShowCreateForm(false);
      setEditingPlaylist(null);
      loadPlaylists();
    } catch (err) {
      console.error('Error saving playlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to save playlist');
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setFormData({
      title: playlist.title,
      description: playlist.description || '',
      isPublic: playlist.isPublic
    });
    setEditingPlaylist(playlist.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/playlists/${playlistId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      loadPlaylists();
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete playlist');
    }
  };

  const cancelForm = () => {
    setFormData({ title: '', description: '', isPublic: false });
    setShowCreateForm(false);
    setEditingPlaylist(null);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getFirstVideoThumbnail = (playlist: Playlist) => {
    if (playlist.items.length > 0) {
      const firstVideo = playlist.items[0].video;
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${firstVideo.id}/thumbnail`;
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Playlists</h1>
        <p className="text-muted-foreground mb-6">Sign in to create and manage your playlists</p>
        <Link href="/?auth=login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
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
        <h1 className="text-2xl font-bold text-foreground mb-4">Playlists</h1>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadPlaylists} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Playlists</h1>
          <p className="text-muted-foreground">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Playlist
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                placeholder="Enter playlist title"
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                placeholder="Enter playlist description (optional)"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isPublic" className="text-sm">
                Make this playlist public
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit">
                {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No playlists yet</h2>
          <p className="text-muted-foreground mb-6">Create your first playlist to organize your favorite videos</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="group">
              <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Playlist Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {getFirstVideoThumbnail(playlist) ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFirstVideoThumbnail(playlist)!}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Video count badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Video size={12} />
                    {playlist._count.items}
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                      {playlist.title}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      {playlist.isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" title="Public" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" title="Private" />
                      )}
                    </div>
                  </div>

                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {playlist.description}
                    </p>
                  )}

                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Created {formatTimeAgo(playlist.createdAt)}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <Link href={`/playlists/${playlist.id}`}>
                      <Button variant="outline" size="sm">
                        View Playlist
                      </Button>
                    </Link>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(playlist)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(playlist.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}