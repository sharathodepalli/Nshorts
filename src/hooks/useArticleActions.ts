import { useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useToastContext } from '../context/ToastContext';
import { useAuth } from './useAuth';

export function useArticleActions() {
  const { showToast } = useToastContext();
  const { user } = useAuth();

  const reportArticle = useCallback(async (articleId: string, reason: string, comments?: string) => {
    if (!user) {
      showToast('Please sign in to report articles', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          article_id: articleId,
          user_id: user.id,
          reason,
          comments,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('You have already reported this article');
        }
        throw error;
      }
      
      showToast('Article reported successfully', 'success');
    } catch (error) {
      console.error('Error reporting article:', error);
      if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to report article', 'error');
      }
      throw error;
    }
  }, [user, showToast]);

  return { reportArticle };
}