import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import GlowText from '../components/ui/GlowText';
import styles from './ErrorPage.module.css';

function ErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';
  let errorDetails = '';

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    message = error.statusText || 'An error occurred while loading this page.';
  } else if (error instanceof Error) {
    title = 'Application Error';
    message = error.message;
    errorDetails = error.stack || '';
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <GlowText size="large" color="magenta" animated className={styles.icon}>
          !
        </GlowText>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        {errorDetails && (
          <details className={styles.details}>
            <summary className={styles.summary}>Technical Details</summary>
            <pre className={styles.stack}>{errorDetails}</pre>
          </details>
        )}
        <div className={styles.actions}>
          <button onClick={handleReload} className={styles.button}>
            Reload Page
          </button>
          <Link to="/" className={styles.button}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
