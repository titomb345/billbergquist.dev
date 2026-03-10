import { useState, type FormEvent } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import styles from './SiteAuditForm.module.css';

function SiteAuditForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
    })
      .then(() => setSubmitted(true))
      .catch(() => {})
      .finally(() => setSubmitting(false));
  }

  if (submitted) {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>&#10003;</span>
        <p>Got it! I'll review your site and send you a free audit within a few business days.</p>
      </div>
    );
  }

  return (
    <form
      name="site-audit"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="form-name" value="site-audit" />
      <p className={styles.hidden}>
        <label>
          Don't fill this out: <input name="bot-field" />
        </label>
      </p>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="audit-url" className={styles.label}>
            Your website URL
          </label>
          <input
            type="url"
            id="audit-url"
            name="url"
            required
            className={styles.input}
            placeholder="https://yourbusiness.com"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="audit-email" className={styles.label}>
            Email
          </label>
          <input
            type="email"
            id="audit-email"
            name="email"
            required
            className={styles.input}
            placeholder="you@example.com"
          />
        </div>
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Sending...
            </>
          ) : (
            'Get My Free Audit'
          )}
        </button>
      </div>
    </form>
  );
}

function SiteAuditFormWithBoundary() {
  return (
    <ErrorBoundary>
      <SiteAuditForm />
    </ErrorBoundary>
  );
}

export default SiteAuditFormWithBoundary;
