import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { NewsCard } from './components/news/NewsCard';
import { CategoryFilter } from './components/layout/CategoryFilter';
import { Category } from './types/news';
import { useArticles } from './hooks/useArticles';
import { useSearch } from './hooks/useSearch';
import { AccountSettings } from './components/settings/AccountSettings';

function App() {
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { articles, loading, error } = useArticles();
  const { searchResults, isSearching } = useSearch();
  const isSettingsPage = window.location.pathname === '/settings';

  const displayedArticles = searchResults.length > 0 ? searchResults : articles;
  const filteredArticles = selectedCategory
    ? displayedArticles.filter(article => article.category === selectedCategory)
    : displayedArticles;

  if (isSettingsPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <AccountSettings />
      </div>
    );
  }

  if (loading || isSearching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-gray-600 animate-pulse">Loading articles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isExpanded={article.id === expandedArticleId}
              onExpand={setExpandedArticleId}
              onCollapse={() => setExpandedArticleId(null)}
            />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchResults.length === 0 
                ? 'No articles found matching your search.'
                : 'No articles found in this category.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;