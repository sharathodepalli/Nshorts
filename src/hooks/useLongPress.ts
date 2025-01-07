import { useCallback, useEffect, useRef } from 'react';

export function useLongPress(
  elementRef: React.RefObject<HTMLElement>,
  onLongPress: () => void,
  duration = 500
) {
  const timerRef = useRef<number>();
  const isPressed = useRef(false);

  const start = useCallback(() => {
    isPressed.current = true;
    timerRef.current = window.setTimeout(() => {
      if (isPressed.current) {
        onLongPress();
      }
    }, duration);
  }, [onLongPress, duration]);

  const cancel = useCallback(() => {
    isPressed.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', start);
    element.addEventListener('touchend', cancel);
    element.addEventListener('touchcancel', cancel);

    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchend', cancel);
      element.removeEventListener('touchcancel', cancel);
      cancel();
    };
  }, [elementRef, start, cancel]);
}