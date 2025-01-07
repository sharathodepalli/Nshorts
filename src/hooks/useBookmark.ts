import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './useAuth';
import { useToastContext } from '../context/ToastContext';

export function useBookmark(articleId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const checkBookmarkStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId, user]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  const toggleBookmark = async () => {
    if (!user) {
      showToast('Please sign in to bookmark articles', 'error');
      return;
    }

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsBookmarked(false);
        showToast('Article removed from bookmarks', 'success');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            article_id: articleId,
            user_id: user.id
          });

        if (error) throw error;
        setIsBookmarked(true);
        showToast('Article bookmarked', 'success');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToast('Failed to update bookmark', 'error');
    }
  };

  return { isBookmarked, loading, toggleBookmark };
}