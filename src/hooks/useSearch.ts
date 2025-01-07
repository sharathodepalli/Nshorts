import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { NewsArticle } from '../types/news';

export function useSearch() {
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchArticles = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          summary,
          full_content,
          category_id,
          categories!inner (
            name
          ),
          image_url,
          published_at,
          source,
          url
        `)
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,full_content.ilike.%${query}%`)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const formattedArticles: NewsArticle[] = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        fullContent: article.full_content,
        category: article.categories.name as NewsArticle['category'],
        imageUrl: article.image_url,
        publishedAt: new Date(article.published_at).toLocaleString(),
        source: article.source,
        url: article.url
      }));

      setSearchResults(formattedArticles);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { searchArticles, searchResults, isSearching };
}