import { useState, useCallback } from 'react';
import { NewsArticle } from '../types/news';

export function useArticleNavigation(articles: NewsArticle[]) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const navigateToArticle = useCallback((id: string) => {
    const index = articles.findIndex(article => article.id === id);
    setCurrentIndex(index);
  }, [articles]);

  const navigatePrevious = useCallback(() => {
    if (currentIndex === null || currentIndex <= 0) return;
    setCurrentIndex(currentIndex - 1);
    return articles[currentIndex - 1].id;
  }, [currentIndex, articles]);

  const navigateNext = useCallback(() => {
    if (currentIndex === null || currentIndex >= articles.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    return articles[currentIndex + 1].id;
  }, [currentIndex, articles]);

  return {
    currentIndex,
    navigateToArticle,
    navigatePrevious,
    navigateNext,
    hasPrevious: currentIndex !== null && currentIndex > 0,
    hasNext: currentIndex !== null && currentIndex < articles.length - 1
  };
}