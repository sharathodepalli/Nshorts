import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { useLikes } from '../../hooks/useLikes';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../context/ToastContext';

interface LikeButtonProps {
  articleId: string;
}

export function LikeButton({ articleId }: LikeButtonProps) {
  const { likes, isLiked, loading, toggleLike } = useLikes(articleId);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to like articles', 'error');
      return;
    }

    try {
      await toggleLike();
    } catch (error) {
      showToast('Failed to update like', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <ThumbsUp className="w-5 h-5" />
        <span className="text-sm">...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 ${
        isLiked ? 'text-blue-600' : 'text-gray-500'
      } hover:text-blue-700 transition-colors`}
    >
      <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
      <span className="text-sm">{likes}</span>
    </button>
  );
}