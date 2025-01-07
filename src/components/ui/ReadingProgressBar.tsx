import React from 'react';
import { useReadingProgress } from '../../hooks/useReadingProgress';

export function ReadingProgressBar() {
  const progress = useReadingProgress();

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div 
        className="h-full bg-blue-600 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}