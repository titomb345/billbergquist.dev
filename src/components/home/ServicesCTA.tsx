import { useNavigate } from 'react-router-dom';
import GlowText from '../ui/GlowText';
import Button from '../ui/Button';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './ServicesCTA.module.css';

function ServicesCTA() {
  const navigate = useNavigate();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section className={`${styles.section} scroll-reveal`} ref={sectionRef}>
      <GlowText
        as="h2"
        size="medium"
        color="mint"
        className={styles.title}
      >
        NEED A WEBSITE?
      </GlowText>
      <p className={styles.description}>
        I build fast, modern websites for small businesses in Denver, Lakewood,
        and across the Colorado Front Range.
      </p>
      <Button variant="primary" onClick={() => navigate('/services')}>
        View Services →
      </Button>
    </section>
  );
}

export default ServicesCTA;
