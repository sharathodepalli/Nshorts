import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './useAuth';
import { useToastContext } from '../context/ToastContext';

export function useLikes(articleId: string) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const fetchLikes = useCallback(async () => {
    try {
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId);

      if (countError) throw countError;
      setLikes(likeCount || 0);

      if (user) {
        const { data: userLike, error: likeError } = await supabase
          .from('likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (likeError) throw likeError;
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      showToast('Failed to load likes', 'error');
    } finally {
      setLoading(false);
    }
  }, [articleId, user, showToast]);

  useEffect(() => {
    fetchLikes();

    const channel = supabase
      .channel(`likes:${articleId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'likes',
        filter: `article_id=eq.${articleId}`
      }, () => {
        fetchLikes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, fetchLikes]);

  const toggleLike = async () => {
    if (!user) {
      showToast('Please sign in to like articles', 'error');
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) throw error;
        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            article_id: articleId,
            user_id: user.id
          });

        if (error) throw error;
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
      throw error;
    }
  };

  return { likes, isLiked, loading, toggleLike };
}