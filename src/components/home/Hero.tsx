import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import styles from './Hero.module.css';

function useTypewriter(text: string, delay: number, startAfter: number) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
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
  const navigate = useNavigate();
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
          <span className={styles.firstName}>Bill</span>
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
          <Button
            variant="accent"
            size="large"
            onClick={() => navigate('/projects')}
          >
            View My Work
          </Button>
        </div>
      </div>
      <div className="accent-line-orange" />
    </section>
  );
}

export default Hero;
