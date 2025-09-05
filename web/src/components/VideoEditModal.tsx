'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { AuthService } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

type VideoPrivacy = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

interface VideoData {
  id: string;
  title: string;
  description: string;
  views: number;
  createdAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  privacy?: VideoPrivacy;
  _count: {
    likes: number;
    comments: number;
  };
}

interface VideoEditModalProps {
  video: VideoData | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoUpdated: (updatedVideo: VideoData) => void;
}

export function VideoEditModal({ video, isOpen, onClose, onVideoUpdated }: VideoEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<VideoPrivacy>('PUBLIC');
  const [saving, setSaving] = useState(false);

  // Update form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description);
      setPrivacy(video.privacy || 'PUBLIC');
    }
  }, [video]);

  const handleSave = async () => {
    if (!video || !title.trim()) {
      return;
    }

    try {
      setSaving(true);
      const token = AuthService.getToken();
      
      if (!token) {
        alert('Please log in to update your video.');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${video.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            privacy: privacy,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      const updatedVideo = await response.json();
      
      // Call the callback with updated data
      onVideoUpdated({
        ...video,
        title: title.trim(),
        description: description.trim(),
        privacy: privacy,
      });

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Failed to update video. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>
            Update your video details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-foreground">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="bg-background border-border text-foreground"
              maxLength={100}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/100 characters
            </p>
          </div>

          <div>
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              className="bg-background border-border text-foreground min-h-[100px] resize-none"
              maxLength={1000}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          <div>
            <Label htmlFor="privacy" className="text-foreground">
              Privacy
            </Label>
            <select
              id="privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as VideoPrivacy)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              disabled={saving}
            >
              <option value="PUBLIC">Public - Anyone can watch</option>
              <option value="UNLISTED">Unlisted - Only people with the link</option>
              <option value="PRIVATE">Private - Only you can watch</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Control who can see your video
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}