import React from 'react';
import { NewsCardProps } from '../../types/news';
import { NewsHeader } from './NewsHeader';
import { NewsContent } from './NewsContent';
import { NewsFooter } from './NewsFooter';

export const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  isExpanded, 
  onExpand, 
  onCollapse 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent expanding when clicking interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, textarea')) {
      return;
    }
    if (!isExpanded) {
      onExpand(article.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-lg transition-all duration-300 ${
        isExpanded 
          ? 'fixed inset-0 z-50 overflow-y-auto md:relative md:inset-auto md:col-span-full md:overflow-visible' 
          : 'hover:shadow-xl cursor-pointer transform hover:-translate-y-1'
      }`}
    >
      <div className={`max-w-4xl mx-auto ${isExpanded ? 'min-h-screen md:min-h-0' : ''}`}>
        <NewsHeader 
          article={article} 
          isExpanded={isExpanded}
          onCollapse={onCollapse}
        />
        <NewsContent 
          article={article} 
          isExpanded={isExpanded} 
        />
        <NewsFooter
          article={article}
          isExpanded={isExpanded}
          onCollapse={onCollapse}
        />
      </div>

      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 -z-10 md:hidden"
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
        />
      )}
    </div>
  );
}