import { useState, useEffect, RefObject } from 'react';

/**
 * Measures container width and returns whether it's constrained.
 * Used to determine if the expert board should use portrait orientation
 * (tall and narrow) instead of landscape (wide and short).
 *
 * @param ref - Reference to the container element to measure
 * @param threshold - Width threshold in pixels (default: 600px)
 * @returns true if container width <= threshold
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>, threshold = 600): boolean {
  const [isConstrained, setIsConstrained] = useState(false);

  useEffect(() => {
    const measureWidth = () => {
      if (!ref.current) return;
      const width = ref.current.clientWidth;
      setIsConstrained(width <= threshold);
    };

    // Initial measurement
    measureWidth();

    // Re-measure on resize
    window.addEventListener('resize', measureWidth);

    // Also use ResizeObserver for more accurate container-specific changes
    const resizeObserver = new ResizeObserver(measureWidth);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      window.removeEventListener('resize', measureWidth);
      resizeObserver.disconnect();
    };
  }, [ref, threshold]);

  return isConstrained;
}
