import { Link } from 'react-router-dom';
import GlowText from '../ui/GlowText';
import Button from '../ui/Button';
import styles from './AboutSection.module.css';

function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <GlowText
        as="h2"
        size="medium"
        color="mint"
        className={styles.sectionTitle}
      >
        ABOUT ME
      </GlowText>
      <div className={styles.content}>
        <p className={styles.summary}>
          I'm a Staff Software Engineer with 14+ years of experience building
          web applications. Currently at Kasa, I specialize in full stack
          development, internal tooling, and leveraging{' '}
          <span className="neon-text-orange">AI-assisted workflows</span> to
          help teams ship faster.
        </p>
        <div className={styles.highlights}>
          <div className={styles.highlight}>
            <span className={styles.highlightValue}>14+</span>
            <span className={styles.highlightLabel}>Years Experience</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightValue}>React</span>
            <span className={styles.highlightLabel}>Frontend Specialist</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightValue}>Staff Engineer</span>
            <span className={styles.highlightSub}>@ Kasa</span>
          </div>
        </div>
        <div className={styles.cta}>
          <Link to="/about">
            <Button variant="secondary" size="medium">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
