import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useArticleActions } from '../../hooks/useArticleActions';
import { useToastContext } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
}

export function ReportModal({ isOpen, onClose, articleId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { reportArticle } = useArticleActions();
  const { showToast } = useToastContext();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in to report articles', 'error');
      return;
    }

    if (!reason) {
      showToast('Please select a reason for reporting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportArticle(articleId, reason, comments);
      onClose();
    } catch (error) {
      // Error is handled in useArticleActions
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    'Incorrect information',
    'Inappropriate content',
    'Spam or duplicate',
    'Misleading title',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Report Article</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional comments (optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Please provide any additional details about the issue..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {500 - comments.length} characters remaining
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !reason}
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}