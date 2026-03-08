import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import styles from './Hero.module.css';

const roles = [
  'Staff Software Engineer',
  'Denver Web Developer',
  'Browser Game Builder',
];

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useRoleCycler(delay: number, typingSpeed: number, pauseAfterType: number) {
  const [displayed, setDisplayed] = useState(() => prefersReducedMotion() ? roles[0] : '');
  const [isTyping, setIsTyping] = useState(false);
  const stateRef = useRef({
    roleIndex: 0,
    phase: 'waiting' as 'waiting' | 'typing' | 'paused' | 'erasing',
    charIndex: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    function schedule(fn: () => void, ms: number) {
      timerRef.current = setTimeout(fn, ms);
    }

    function tick() {
      const s = stateRef.current;
      const currentRole = roles[s.roleIndex];

      if (s.phase === 'waiting') {
        schedule(() => {
          s.phase = 'typing';
          setIsTyping(true);
          tick();
        }, delay);
        return;
      }

      if (s.phase === 'typing') {
        if (s.charIndex < currentRole.length) {
          s.charIndex++;
          setDisplayed(currentRole.slice(0, s.charIndex));
          schedule(tick, typingSpeed);
        } else {
          s.phase = 'paused';
          schedule(() => {
            s.phase = 'erasing';
            tick();
          }, pauseAfterType);
        }
        return;
      }

      if (s.phase === 'erasing') {
        if (s.charIndex > 0) {
          s.charIndex--;
          setDisplayed(currentRole.slice(0, s.charIndex));
          schedule(tick, typingSpeed / 2);
        } else {
          s.roleIndex = (s.roleIndex + 1) % roles.length;
          s.phase = 'typing';
          tick();
        }
      }
    }

    tick();
    return () => clearTimeout(timerRef.current);
  }, [delay, typingSpeed, pauseAfterType]);

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
