import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import GlowText from '../components/ui/GlowText';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  usePageMeta({
    title: '404 — Bill Bergquist',
    description: 'Page not found.',
    noindex: true,
  });

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <GlowText size="large" color="magenta" animated className={styles.code}>
          404
        </GlowText>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className={styles.homeLink}>
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
