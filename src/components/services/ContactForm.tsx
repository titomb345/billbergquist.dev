import { useState, type FormEvent } from 'react';
import styles from '../../pages/ServicesPage.module.css';

function ContactForm() {
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
      .catch(() => {
        // Allow default form submission as fallback
      })
      .finally(() => setSubmitting(false));
  }

  if (submitted) {
    return (
      <div className={styles.successMessage}>
        <span className={styles.successIcon}>&#10003;</span>
        <p>Thanks for reaching out! I'll get back to you within a couple of business days.</p>
      </div>
    );
  }

  return (
    <form
      name="services-contact"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="form-name" value="services-contact" />
      <p className={styles.hidden}>
        <label>
          Don't fill this out: <input name="bot-field" />
        </label>
      </p>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className={styles.input}
          placeholder="Your name"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className={styles.input}
          placeholder="you@example.com"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="message" className={styles.label}>
          Tell me about your project
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={styles.textarea}
          placeholder="What does your business do? What kind of website are you looking for?"
        />
      </div>
      <button type="submit" className={styles.submitButton} disabled={submitting}>
        {submitting ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}

export default ContactForm;
