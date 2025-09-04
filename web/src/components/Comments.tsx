'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Reply, Edit3, Trash2, Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  replies?: Comment[];
  _count: {
    replies: number;
  };
}

interface CommentsProps {
  videoId: string;
}

export function Comments({ videoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const getCurrentUser = () => {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  };

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8080/videos/${videoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    
    if (!token) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment('');
        await loadComments(); // Reload comments
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    const token = getAuthToken();
    
    if (!token) {
      alert('Please login to reply');
      return;
    }

    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setReplyTo(null);
        await loadComments(); // Reload comments
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    const token = getAuthToken();
    
    if (!token) {
      alert('Please login to edit comments');
      return;
    }

    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/videos/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        setEditContent('');
        setEditingComment(null);
        await loadComments(); // Reload comments
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const token = getAuthToken();
    
    if (!token) {
      alert('Please login to delete comments');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/videos/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadComments(); // Reload comments
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.ceil(diffMinutes / 60)}h ago`;
    return `${Math.ceil(diffMinutes / 1440)}d ago`;
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentUser = getCurrentUser();

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-secondary/30 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded mb-2 w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} />
        <h2 className="text-lg font-semibold">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>
      </div>

      {/* Comment Input */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`} />
              <AvatarFallback>{getUserInitials(currentUser.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border rounded-lg resize-none bg-background text-foreground border-border focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewComment('')}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {submitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-secondary/30 rounded-lg text-center">
          <p className="text-muted-foreground">Please log in to add comments</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={setReplyTo}
              onEdit={(id, content) => {
                setEditingComment(id);
                setEditContent(content);
              }}
              onDelete={handleDeleteComment}
              replyTo={replyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={handleSubmitReply}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              onEditSubmit={handleEditComment}
              onEditCancel={() => {
                setEditingComment(null);
                setEditContent('');
              }}
              onReplyCancel={() => {
                setReplyTo(null);
                setReplyContent('');
              }}
              submitting={submitting}
              formatDate={formatDate}
              getUserInitials={getUserInitials}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUser: { id: string; email: string } | null;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  replyTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  editingComment: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  onEditSubmit: (commentId: string) => void;
  onEditCancel: () => void;
  onReplyCancel: () => void;
  submitting: boolean;
  formatDate: (date: string) => string;
  getUserInitials: (username: string) => string;
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  replyTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  editingComment,
  editContent,
  setEditContent,
  onEditSubmit,
  onEditCancel,
  onReplyCancel,
  submitting,
  formatDate,
  getUserInitials,
}: CommentItemProps) {
  const isOwner = currentUser?.id === comment.user.id;
  const isEditing = editingComment === comment.id;
  const isReplying = replyTo === comment.id;

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.username}`} />
          <AvatarFallback>{getUserInitials(comment.user.username)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user.displayName || comment.user.username}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground border-border focus:ring-2 focus:ring-primary"
                rows={3}
                disabled={submitting}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onEditSubmit(comment.id)}
                  disabled={!editContent.trim() || submitting}
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={onEditCancel}
                  disabled={submitting}
                  className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mb-2">{comment.content}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {currentUser && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Reply size={12} />
                    Reply
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={() => onEdit(comment.id, comment.content)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="flex items-center gap-1 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </>
                )}
                {comment._count.replies > 0 && (
                  <span>{comment._count.replies} replies</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="ml-11">
          <div className="flex gap-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} />
              <AvatarFallback>{currentUser ? getUserInitials(currentUser.email) : ''}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 border rounded text-sm bg-background text-foreground border-border focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={submitting}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </button>
                <button
                  onClick={onReplyCancel}
                  disabled={submitting}
                  className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replyTo={replyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              onEditSubmit={onEditSubmit}
              onEditCancel={onEditCancel}
              onReplyCancel={onReplyCancel}
              submitting={submitting}
              formatDate={formatDate}
              getUserInitials={getUserInitials}
            />
          ))}
        </div>
      )}
    </div>
  );
}