import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

function useTypewriter(text: string, delay: number, startAfter: number) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, delay);
      return () => clearInterval(interval);
    }, startAfter);
    return () => clearTimeout(startTimeout);
  }, [text, delay, startAfter]);

  return { displayed, done };
}

function Hero() {
  const { displayed: roleText, done: typingDone } = useTypewriter(
    'Staff Software Engineer',
    60,
    800,
  );

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
              className={`blinking-cursor ${typingDone ? '' : styles.typingCursor}`}
            >
              _
            </span>
          </span>
        </div>
        <p className={styles.tagline}>
          Building elegant solutions with modern web technologies
        </p>
        <div className={styles.cta}>
          <a href="/projects" className={styles.ctaButton}>
            View My Work
          </a>
          <a href="/services" className={styles.ctaButtonSecondary}>
            Hire Me
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
