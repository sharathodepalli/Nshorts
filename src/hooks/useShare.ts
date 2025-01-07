import { useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useToastContext } from '../context/ToastContext';
import { useAuth } from './useAuth';

type ShareType = 'facebook' | 'twitter' | 'linkedin' | 'email' | 'copy';

export function useShare() {
  const { showToast } = useToastContext();
  const { user } = useAuth();

  const shareArticle = useCallback(async (
    articleId: string,
    shareType: ShareType,
    title: string,
    url: string
  ) => {
    try {
      // Track share analytics if user is logged in
      if (user) {
        await supabase
          .from('article_shares')
          .insert({
            article_id: articleId,
            user_id: user.id,
            share_type: shareType
          });
      }

      // Handle different share types
      switch (shareType) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${url}`)}`;
          break;
        case 'copy':
          await navigator.clipboard.writeText(url);
          showToast('Link copied to clipboard', 'success');
          break;
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      showToast('Failed to share article', 'error');
    }
  }, [user, showToast]);

  return { shareArticle };
}