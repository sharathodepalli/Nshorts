import React from 'react';
import { Clock, Eye, Calendar } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { CommentSection } from '../interactions/CommentSection';
import { useArticleStats } from '../../hooks/useArticleStats';

interface NewsContentProps {
  article: NewsArticle;
  isExpanded: boolean;
}

export const NewsContent: React.FC<NewsContentProps> = ({ article, isExpanded }) => {
  const { viewCount, readTime } = useArticleStats(article.id);
  const publishDate = new Date(article.publishedAt);
  const timeAgo = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((publishDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {article.category}
        </span>
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span title={publishDate.toLocaleString()}>{timeAgo}</span>
        </div>
        {article.source && (
          <span className="text-gray-500 text-sm">• {article.source}</span>
        )}
      </div>

      <h2 className={`text-xl font-bold mb-4 ${!isExpanded ? 'line-clamp-2' : ''}`}>
        {article.title}
      </h2>
      
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1" title="Views">
          <Eye className="w-4 h-4" />
          <span>{new Intl.NumberFormat().format(viewCount)}</span>
        </div>
        <div className="flex items-center gap-1" title="Estimated read time">
          <Clock className="w-4 h-4" />
          <span>{readTime} min read</span>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className={`text-gray-600 text-base leading-relaxed ${!isExpanded && 'line-clamp-3'}`}>
          {isExpanded ? article.fullContent : article.summary}
        </p>
        
        {isExpanded && (
          <>
            {article.media && article.media.length > 0 && (
              <div className="mt-6 space-y-4">
                {article.media.map((item, index) => (
                  <figure key={index} className="relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.caption || ''}
                        className="rounded-lg w-full"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="rounded-lg w-full"
                        preload="metadata"
                      />
                    )}
                    {item.caption && (
                      <figcaption className="text-sm text-gray-500 mt-2 italic">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
            <CommentSection articleId={article.id} />
          </>
        )}
      </div>
    </div>
  );
}