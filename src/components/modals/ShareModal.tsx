import React from 'react';
import { X, Facebook, Twitter, Linkedin, Mail, Copy } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { useShare } from '../../hooks/useShare';
import { useToastContext } from '../../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle;
}

export function ShareModal({ isOpen, onClose, article }: ShareModalProps) {
  const { shareArticle } = useShare();
  const { showToast } = useToastContext();

  if (!isOpen) return null;

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: () => shareArticle(article.id, 'facebook', article.title, article.url),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: () => shareArticle(article.id, 'twitter', article.title, article.url),
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      onClick: () => shareArticle(article.id, 'linkedin', article.title, article.url),
      color: 'bg-blue-700 hover:bg-blue-800'
    },
    {
      name: 'Email',
      icon: Mail,
      onClick: () => shareArticle(article.id, 'email', article.title, article.url),
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await shareArticle(article.id, 'copy', article.title, article.url);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Share Article</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {shareButtons.map((button) => (
              <button
                key={button.name}
                onClick={button.onClick}
                className={`${button.color} text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2`}
              >
                <button.icon className="w-5 h-5" />
                {button.name}
              </button>
            ))}
          </div>

          <div className="relative mt-4">
            <input
              type="text"
              value={article.url}
              readOnly
              className="w-full pr-24 pl-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md flex items-center gap-1 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}