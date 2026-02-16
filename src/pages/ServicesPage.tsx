import { useEffect, useState, FormEvent } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import useScrollReveal from '../hooks/useScrollReveal';
import GlowText from '../components/ui/GlowText';
import Card from '../components/ui/Card';
import SectionDivider from '../components/ui/SectionDivider';
import styles from './ServicesPage.module.css';

const JSONLD_SERVICE = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Bill Bergquist — Web Development Services',
  description:
    'Professional web design and development services for small businesses in Denver, Lakewood, and the Colorado Front Range.',
  url: 'https://billbergquist.dev/services',
  telephone: '',
  email: 'services@billbergquist.dev',
  areaServed: [
    {
      '@type': 'City',
      name: 'Denver',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
    {
      '@type': 'City',
      name: 'Lakewood',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
    {
      '@type': 'City',
      name: 'Golden',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
    {
      '@type': 'City',
      name: 'Arvada',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
    {
      '@type': 'City',
      name: 'Wheat Ridge',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
    {
      '@type': 'City',
      name: 'Littleton',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    },
  ],
  provider: {
    '@type': 'Person',
    name: 'Bill Bergquist',
    jobTitle: 'Staff Software Engineer',
    url: 'https://billbergquist.dev',
  },
  serviceType: [
    'Web Design',
    'Web Development',
    'Website Redesign',
    'Landing Page Design',
  ],
  priceRange: '$$',
});

const services = [
  {
    icon: '01',
    title: 'Business Websites',
    description:
      'A professional website that puts your Denver or Lakewood business on the map. Fast, mobile-friendly, and built to convert visitors into customers.',
    color: 'mint' as const,
  },
  {
    icon: '02',
    title: 'Landing Pages',
    description:
      'Focused, single-page sites designed to drive a specific action — whether it\'s bookings, signups, or sales for your Colorado business.',
    color: 'orange' as const,
  },
  {
    icon: '03',
    title: 'Website Redesign',
    description:
      'Already have a site that feels outdated? I\'ll modernize it with a fresh design, faster performance, and a better experience for your customers.',
    color: 'magenta' as const,
  },
  {
    icon: '04',
    title: 'Ongoing Support',
    description:
      'Updates, tweaks, and maintenance so your site stays current. A local developer you can reach out to whenever something comes up.',
    color: 'purple' as const,
  },
];

const steps = [
  {
    number: '01',
    title: 'Chat',
    description:
      'We\'ll meet — in person or over a call — to talk about your business, what you need, and what success looks like.',
  },
  {
    number: '02',
    title: 'Build',
    description:
      'I\'ll design and develop your site, checking in along the way so the result is exactly what you envisioned.',
  },
  {
    number: '03',
    title: 'Launch',
    description:
      'Your new site goes live. I\'ll make sure everything runs smoothly and you know how to manage it going forward.',
  },
];

function ServicesPage() {
  usePageMeta({
    title: 'Web Design Services in Denver & Lakewood, CO — Bill Bergquist',
    description:
      'Professional web design and development for small businesses in Denver, Lakewood, and the Colorado Front Range. Custom websites, landing pages, and redesigns from a local staff engineer with 14+ years of experience.',
    canonical: '/services',
  });

  const servicesRef = useScrollReveal<HTMLElement>();
  const stepsRef = useScrollReveal<HTMLElement>();
  const contactRef = useScrollReveal<HTMLElement>();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = 'jsonld-service';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSONLD_SERVICE;
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlowText size="large" color="mint" animated className={styles.title}>
          WEB DESIGN SERVICES
        </GlowText>
        <p className={styles.subtitle}>Denver &middot; Lakewood &middot; Colorado</p>
        <p className={styles.intro}>
          I'm a staff software engineer with over 14 years of experience
          building for the web. I help small businesses across Denver, Lakewood,
          and the Front Range get online with fast, modern websites that look
          great and actually work.
        </p>
        <div className="accent-line-orange" />
      </header>

      <section className={`${styles.services} scroll-reveal`} ref={servicesRef}>
        <GlowText as="h2" size="medium" color="orange" className={styles.sectionTitle}>
          WHAT I OFFER
        </GlowText>
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <div key={service.title} className="scroll-reveal-child">
              <Card className={styles.serviceCard}>
                <span className={`${styles.serviceIcon} neon-text-${service.color}`}>
                  {service.icon}
                </span>
                <h3 className={`${styles.serviceTitle} neon-text-${service.color}`}>
                  {service.title}
                </h3>
                <p className={styles.serviceDescription}>{service.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider color="mint" />

      <section className={`${styles.process} scroll-reveal`} ref={stepsRef}>
        <GlowText as="h2" size="medium" color="magenta" className={styles.sectionTitle}>
          HOW IT WORKS
        </GlowText>
        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={step.number} className={`${styles.step} scroll-reveal-child`}>
              <div className={styles.stepConnector}>
                <span className={styles.stepNumber}>{step.number}</span>
                {i < steps.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider color="orange" />

      <section className={`${styles.contact} scroll-reveal`} ref={contactRef}>
        <GlowText as="h2" size="medium" color="mint" className={styles.sectionTitle}>
          GET IN TOUCH
        </GlowText>
        <p className={styles.contactIntro}>
          Have a project in mind? Whether you're a Denver coffee shop, a
          Lakewood boutique, or any local business looking for a website — I'd
          love to hear about it.
        </p>

        {submitted ? (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>&#10003;</span>
            <p>
              Thanks for reaching out! I'll get back to you within a couple of business days.
            </p>
          </div>
        ) : (
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
        )}

        <div className={styles.emailAlt}>
          <p>
            Prefer email?{' '}
            <a href="mailto:services@billbergquist.dev" className={styles.emailLink}>
              services@billbergquist.dev
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
