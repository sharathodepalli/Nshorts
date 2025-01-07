import React, { useState, useEffect } from 'react';
import { Loader2, Bookmark, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../context/ToastContext';
import { NewsCard } from '../news/NewsCard';
import { NewsArticle } from '../../types/news';

export function SavedNews() {
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  useEffect(() => {
    async function loadBookmarks() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select(`
            article_id,
            articles (
              id,
              title,
              summary,
              full_content,
              category_id,
              categories (name),
              image_url,
              source,
              url,
              published_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedArticles: NewsArticle[] = data
          .map(({ articles: article }) => ({
            id: article.id,
            title: article.title,
            summary: article.summary,
            fullContent: article.full_content,
            category: article.categories.name,
            imageUrl: article.image_url,
            source: article.source,
            url: article.url,
            publishedAt: new Date(article.published_at).toLocaleString()
          }))
          .filter(Boolean);

        setBookmarks(formattedArticles);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        showToast('Failed to load bookmarks', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadBookmarks();
  }, [user, showToast]);

  const filteredBookmarks = bookmarks.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bookmark className="w-6 h-6" />
          Saved Articles
        </h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved articles..."
            className="pl-10 pr-10 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved articles yet</h3>
          <p className="text-gray-500">
            Articles you bookmark will appear here for easy access.
          </p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No articles match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isExpanded={article.id === expandedArticleId}
              onExpand={setExpandedArticleId}
              onCollapse={() => setExpandedArticleId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}