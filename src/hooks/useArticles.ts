import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { NewsArticle } from '../types/news';

export function useArticles() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchArticles = useCallback(async (pageNumber: number) => {
    try {
      const { data, error, count } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          summary,
          full_content,
          category_id,
          categories (
            name,
            slug
          ),
          image_url,
          published_at,
          source,
          url,
          is_featured,
          view_count
        `, { count: 'exact' })
        .order('published_at', { ascending: false })
        .range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1);

      if (error) throw error;

      const formattedArticles: NewsArticle[] = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        fullContent: article.full_content,
        category: article.categories?.name as NewsArticle['category'],
        imageUrl: article.image_url,
        publishedAt: new Date(article.published_at).toLocaleString(),
        source: article.source,
        url: article.url,
        isFeatured: article.is_featured,
        viewCount: article.view_count
      }));

      if (pageNumber === 1) {
        setArticles(formattedArticles);
      } else {
        setArticles(prev => [...prev, ...formattedArticles]);
      }

      setHasMore(count !== null && (pageNumber * pageSize) < count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(1);

    const channel = supabase
      .channel('articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        () => {
          fetchArticles(1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArticles]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const nextPage = page + 1;
    await fetchArticles(nextPage);
    setPage(nextPage);
  }, [fetchArticles, hasMore, loading, page]);

  return { articles, loading, error, loadMore, hasMore };
}