import React, { useState } from 'react';
import { Share2, Bookmark, ArrowLeft, Flag } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { useBookmark } from '../../hooks/useBookmark';
import { useShare } from '../../hooks/useShare';
import { useArticleActions } from '../../hooks/useArticleActions';
import { ReportModal } from '../modals/ReportModal';
import { ShareModal } from '../modals/ShareModal';

interface NewsHeaderProps {
  article: NewsArticle;
  isExpanded: boolean;
  onCollapse: () => void;
}

export const NewsHeader: React.FC<NewsHeaderProps> = ({ 
  article, 
  isExpanded, 
  onCollapse 
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmark(article.id);
  const { shareArticle } = useShare();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark();
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReportModal(true);
  };

  return (
    <div className="relative group">
      <img
        src={article.imageUrl}
        alt={article.title}
        className={`w-full rounded-t-xl object-cover ${
          isExpanded ? 'h-96' : 'h-56'
        }`}
      />
      
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          className="absolute top-4 left-4 bg-white/90 p-1.5 rounded-full hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      <div className="absolute top-4 right-4 flex gap-1.5">
        <button 
          onClick={handleShare}
          className="bg-white/90 p-1.5 rounded-full hover:bg-white"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleBookmark}
          className={`bg-white/90 p-1.5 rounded-full hover:bg-white ${
            isBookmarked ? 'text-blue-600' : ''
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={handleReport}
          className="bg-white/90 p-1.5 rounded-full hover:bg-white"
          title="Report"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        articleId={article.id}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        article={article}
      />
    </div>
  );
};