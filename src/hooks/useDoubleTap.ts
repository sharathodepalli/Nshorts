import { useEffect, useRef } from 'react';

export function useDoubleTap(
  elementRef: React.RefObject<HTMLElement>,
  onDoubleTap: () => void,
  delay = 300
) {
  const lastTap = useRef<number>(0);
  const lastClick = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTap = (e: TouchEvent) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap.current;

      if (tapLength < delay && tapLength > 0) {
        onDoubleTap();
        e.preventDefault();
      }

      lastTap.current = currentTime;
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const currentTime = new Date().getTime();
      const clickLength = currentTime - lastClick.current;

      if (clickLength < delay && clickLength > 0) {
        onDoubleTap();
        e.preventDefault();
      }

      lastClick.current = currentTime;
    };

    element.addEventListener('touchend', handleTap);
    element.addEventListener('click', handleDoubleClick);

    return () => {
      element.removeEventListener('touchend', handleTap);
      element.removeEventListener('click', handleDoubleClick);
    };
  }, [elementRef, onDoubleTap, delay]);
}