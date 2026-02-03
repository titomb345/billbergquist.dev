import Button from '../ui/Button';
import styles from './Hero.module.css';

interface HeroProps {
  onEnterArcade?: () => void;
}

function Hero({ onEnterArcade }: HeroProps) {
  const handleClick = () => {
    if (onEnterArcade) {
      onEnterArcade();
    } else {
      const gamesSection = document.getElementById('games');
      gamesSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <span className={styles.roleText}>Staff Software Engineer</span>
          <span className="blinking-cursor">_</span>
        </div>
        <p className={styles.tagline}>
          Building elegant solutions with modern web technologies
        </p>
        <div className={styles.cta}>
          <Button variant="accent" size="large" onClick={handleClick}>
            View My Work
          </Button>
        </div>
      </div>
      <div className="accent-line-orange" />
    </section>
  );
}

export default Hero;
