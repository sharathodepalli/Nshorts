import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../context/ToastContext';

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { comments, loading, addComment } = useComments(articleId);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Please sign in to comment', 'error');
      return;
    }

    if (newComment.trim().length < 3) {
      showToast('Comment must be at least 3 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayName = (comment: typeof comments[0]) => {
    if (!comment.user) return 'Anonymous';
    return comment.user.full_name || comment.user.username || comment.user.email.split('@')[0];
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'just now';
  };

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add a comment..." : "Please sign in to comment"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
            maxLength={500}
            disabled={isSubmitting || !user}
          />
          <button
            type="submit"
            disabled={isSubmitting || newComment.trim().length < 3 || !user}
            className="absolute bottom-2 right-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:hover:text-blue-600"
            title={user ? 'Post comment' : 'Sign in to comment'}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{500 - newComment.length} characters remaining</span>
          {isSubmitting && <span>Posting...</span>}
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">
                  {getDisplayName(comment)}
                </span>
                <span className="text-sm text-gray-500" title={new Date(comment.created_at).toLocaleString()}>
                  {getTimeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}