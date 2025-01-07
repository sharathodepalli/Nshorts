import { useEffect, useCallback } from 'react';

export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean
) {
  const handleScroll = useCallback(() => {
    if (isLoading || !hasMore) return;

    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800;

    if (scrolledToBottom) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}