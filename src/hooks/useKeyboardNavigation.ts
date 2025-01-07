import { useEffect } from 'react';

export function useKeyboardNavigation(
  onPrevious: () => void,
  onNext: () => void,
  onClose: () => void,
  isEnabled: boolean
) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, onPrevious, onNext, onClose]);
}