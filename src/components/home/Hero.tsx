import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import styles from './Hero.module.css';

const roles = [
  'Staff Software Engineer',
  'Denver Web Developer',
  'Browser Game Builder',
];

function useRoleCycler(delay: number, typingSpeed: number, pauseAfterType: number) {
  const [displayed, setDisplayed] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'typing' | 'paused' | 'erasing'>('waiting');

  const tick = useCallback(() => {
    const currentRole = roles[roleIndex];

    if (phase === 'waiting') {
      // Initial delay before first type
      const timeout = setTimeout(() => setPhase('typing'), delay);
      return () => clearTimeout(timeout);
    }

    if (phase === 'typing') {
      if (displayed.length < currentRole.length) {
        const timeout = setTimeout(() => {
          setDisplayed(currentRole.slice(0, displayed.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      }
      // Done typing, pause
      const timeout = setTimeout(() => setPhase('paused'), pauseAfterType);
      return () => clearTimeout(timeout);
    }

    if (phase === 'paused') {
      const timeout = setTimeout(() => setPhase('erasing'), 0);
      return () => clearTimeout(timeout);
    }

    if (phase === 'erasing') {
      if (displayed.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, typingSpeed / 2);
        return () => clearTimeout(timeout);
      }
      // Done erasing, move to next role
      setRoleIndex((roleIndex + 1) % roles.length);
      setPhase('typing');
    }
  }, [displayed, roleIndex, phase, delay, typingSpeed, pauseAfterType]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setDisplayed(roles[0]);
      return;
    }

    return tick();
  }, [tick]);

  const isTyping = phase === 'typing' || phase === 'erasing';

  return { displayed, isTyping };
}

function Hero() {
  const { displayed: roleText, isTyping } = useRoleCycler(800, 60, 3000);

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <p className={styles.greeting}>
          <span className={styles.hello}>Hello</span>, I'm
        </p>
        <h1 className={styles.name}>
          <span className={styles.firstName}>Bill</span>{' '}
          <span className={styles.lastName}>Bergquist</span>
        </h1>
        <div className={styles.role}>
          <span className={styles.roleText}>
            {roleText}
            <span
              className={`blinking-cursor ${isTyping ? styles.typingCursor : ''}`}
            >
              _
            </span>
          </span>
        </div>
        <p className={styles.tagline}>
          14+ years building for the web. From enterprise software to small business sites and browser games.
        </p>
        <div className={styles.cta}>
          <a href="/projects" className={styles.ctaButton}>
            View My Work
          </a>
          <a href="/services" className={styles.ctaButtonSecondary}>
            Get a Free Quote
          </a>
        </div>
      </div>
    </section>
  );
}

function HeroWithBoundary() {
  return (
    <ErrorBoundary>
      <Hero />
    </ErrorBoundary>
  );
}

export default HeroWithBoundary;
