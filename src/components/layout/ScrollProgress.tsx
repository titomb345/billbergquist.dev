import { useRef, useEffect } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import styles from './ScrollProgress.module.css';

function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    function handleScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && barRef.current) {
          barRef.current.style.width = `${(scrollTop / docHeight) * 100}%`;
        }
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  );
}

function ScrollProgressWithBoundary() {
  return (
    <ErrorBoundary>
      <ScrollProgress />
    </ErrorBoundary>
  );
}

export default ScrollProgressWithBoundary;
