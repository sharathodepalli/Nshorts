import React from 'react';
import { MessageCircle } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { LikeButton } from '../interactions/LikeButton';

interface NewsFooterProps {
  article: NewsArticle;
  isExpanded: boolean;
  onCollapse: () => void;
}

export const NewsFooter: React.FC<NewsFooterProps> = ({ 
  article, 
  isExpanded,
  onCollapse
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      onCollapse();
    }
  };

  return (
    <div className="px-6 pb-6">
      <div className="flex justify-between items-center">
        {isExpanded && (
          <button
            onClick={handleClick}
            className="text-blue-600 font-medium hover:text-blue-800"
          >
            Show Less
          </button>
        )}

        <div className="flex gap-4" onClick={e => e.stopPropagation()}>
          <LikeButton articleId={article.id} />
          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">0</span>
          </button>
        </div>
      </div>

      {isExpanded && article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Related Articles</h3>
          <div className="space-y-2">
            {article.relatedArticles.map((related) => (
              <a
                key={related.id}
                href={related.url}
                className="block text-blue-600 hover:text-blue-800"
                onClick={e => e.stopPropagation()}
              >
                {related.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}