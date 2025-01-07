import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

export function useArticleStats(articleId: string) {
  const [viewCount, setViewCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('view_count, full_content')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      
      if (data) {
        setViewCount(data.view_count);
        // Calculate read time based on words (average reading speed: 200 words/minute)
        const words = data.full_content.trim().split(/\s+/).length;
        setReadTime(Math.max(1, Math.ceil(words / 200)));
      }
    } catch (error) {
      console.error('Error fetching article stats:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchStats();

    // Update view count when article is opened
    const updateViewCount = async () => {
      try {
        const { error } = await supabase
          .rpc('increment_article_views', { article_id: articleId });
        if (error) throw error;
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    };

    updateViewCount();
  }, [articleId, fetchStats]);

  return { viewCount, readTime, loading };
}