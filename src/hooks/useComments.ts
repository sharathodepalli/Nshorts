import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './useAuth';
import { useToastContext } from '../context/ToastContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string | null;
    full_name: string | null;
    email: string;
  };
}

export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey (
            username,
            full_name,
            email
          )
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  }, [articleId, showToast]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments:${articleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `article_id=eq.${articleId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, fetchComments]);

  const addComment = async (content: string) => {
    if (!user) {
      showToast('Please sign in to comment', 'error');
      return;
    }

    if (content.trim().length < 3) {
      showToast('Comment must be at least 3 characters', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
      
      await fetchComments();
      showToast('Comment posted successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to post comment', 'error');
      throw error;
    }
  };

  return { comments, loading, addComment };
}