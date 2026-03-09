import { useState, useEffect, useCallback, Fragment } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import styles from './CostCalculator.module.css';

/* ── Pricing model ── */

type ProjectType = 'business' | 'landing' | 'redesign' | 'ecommerce';
type SiteSize = 'small' | 'medium' | 'large' | 'xlarge';
type DesignLevel = 'clean' | 'custom' | 'premium';
type Timeline = 'standard' | 'accelerated' | 'rush';

interface Feature {
  id: string;
  label: string;
  price: number;
}

const PROJECT_TYPES: {
  id: ProjectType;
  icon: string;
  title: string;
  hint: string;
  base: number;
}[] = [
  {
    id: 'business',
    icon: '🏢',
    title: 'Business Website',
    hint: 'Multi-page site for your company or service',
    base: 2500,
  },
  {
    id: 'landing',
    icon: '🎯',
    title: 'Landing Page',
    hint: 'Single page focused on one goal',
    base: 1200,
  },
  {
    id: 'redesign',
    icon: '🔄',
    title: 'Website Redesign',
    hint: 'Rebuild an existing site from scratch',
    base: 2500,
  },
  {
    id: 'ecommerce',
    icon: '🛒',
    title: 'E-commerce',
    hint: 'Online store with product pages and checkout',
    base: 5000,
  },
];

const SITE_SIZES: {
  id: SiteSize;
  title: string;
  hint: string;
  multiplier: number;
}[] = [
  { id: 'small', title: '1 - 3 pages', hint: 'Perfect for landing pages or simple sites', multiplier: 1 },
  { id: 'medium', title: '4 - 7 pages', hint: 'Most common for small businesses', multiplier: 1.4 },
  { id: 'large', title: '8 - 15 pages', hint: 'Larger sites with multiple sections', multiplier: 1.8 },
  { id: 'xlarge', title: '15+ pages', hint: 'Complex sites with lots of content', multiplier: 2.0 },
];

const DESIGN_LEVELS: {
  id: DesignLevel;
  icon: string;
  title: string;
  hint: string;
  multiplier: number;
}[] = [
  {
    id: 'clean',
    icon: '✦',
    title: 'Clean & Professional',
    hint: 'Polished design using proven layouts',
    multiplier: 1,
  },
  {
    id: 'custom',
    icon: '◆',
    title: 'Custom & Unique',
    hint: 'Tailored design built around your brand',
    multiplier: 1.35,
  },
  {
    id: 'premium',
    icon: '★',
    title: 'Premium & Immersive',
    hint: 'Show-stopping design with animations and effects',
    multiplier: 1.7,
  },
];

const FEATURES: Feature[] = [
  { id: 'blog', label: 'Blog', price: 600 },
  { id: 'gallery', label: 'Photo Gallery', price: 350 },
  { id: 'animations', label: 'Animations & Interactions', price: 600 },
  { id: 'gbp', label: 'Google Business Profile', price: 300 },
  { id: 'booking', label: 'Booking / Scheduling Integration', price: 400 },
];

const TIMELINES: {
  id: Timeline;
  title: string;
  hint: string;
  multiplier: number;
}[] = [
  { id: 'standard', title: 'Standard (4 - 6 weeks)', hint: 'Recommended for most projects', multiplier: 1 },
  {
    id: 'accelerated',
    title: 'Accelerated (2 - 3 weeks)',
    hint: 'Faster delivery, prioritized schedule',
    multiplier: 1.25,
  },
  { id: 'rush', title: 'Rush (1 - 2 weeks)', hint: 'Need it yesterday', multiplier: 1.5 },
];

type StepKey = 'projectType' | 'siteSize' | 'designLevel' | 'features' | 'timeline';

const ALL_STEPS: { label: string; key: StepKey }[] = [
  { label: 'Type', key: 'projectType' },
  { label: 'Size', key: 'siteSize' },
  { label: 'Design', key: 'designLevel' },
  { label: 'Features', key: 'features' },
  { label: 'Timeline', key: 'timeline' },
];

function getSteps(projectType: ProjectType | null) {
  if (projectType === 'landing') {
    return ALL_STEPS.filter((s) => s.key !== 'siteSize');
  }
  return ALL_STEPS;
}

/* ── Price calculation ── */

function calculate(
  projectType: ProjectType | null,
  siteSize: SiteSize | null,
  designLevel: DesignLevel | null,
  selectedFeatures: string[],
  timeline: Timeline | null,
) {
  const typeData = PROJECT_TYPES.find((t) => t.id === projectType);
  const sizeData = SITE_SIZES.find((s) => s.id === siteSize);
  const designData = DESIGN_LEVELS.find((d) => d.id === designLevel);
  const timelineData = TIMELINES.find((t) => t.id === timeline);

  if (!typeData || !sizeData || !designData || !timelineData) return null;

  const base = typeData.base;
  const sizedBase = base * sizeData.multiplier;
  const designedBase = sizedBase * designData.multiplier;

  const featureCost = selectedFeatures.reduce((sum, fId) => {
    const f = FEATURES.find((feat) => feat.id === fId);
    return sum + (f ? f.price : 0);
  }, 0);

  const subtotal = designedBase + featureCost;
  const total = subtotal * timelineData.multiplier;

  // Show a range: -10% to +15% of calculated total
  const low = Math.round(total * 0.9 / 100) * 100;
  const high = Math.round(total * 1.15 / 100) * 100;

  return {
    low,
    high,
    breakdown: {
      base: { label: typeData.title, value: base },
      size: { label: sizeData.title, value: Math.round(sizedBase - base) },
      design: {
        label: designData.title,
        value: Math.round(designedBase - sizedBase),
      },
      features: {
        label: `${selectedFeatures.length} feature${selectedFeatures.length !== 1 ? 's' : ''}`,
        value: featureCost,
      },
      timeline: {
        label: timelineData.title,
        value: Math.round(subtotal * timelineData.multiplier - subtotal),
      },
    },
  };
}

/* ── Animated counter ── */

function useAnimatedNumber(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}

/* ── Component ── */

function CostCalculatorInner() {
  const [stepIndex, setStepIndex] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [siteSize, setSiteSize] = useState<SiteSize | null>(null);
  const [designLevel, setDesignLevel] = useState<DesignLevel | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [showResults, setShowResults] = useState(false);

  const activeSteps = getSteps(projectType);
  const currentStep = activeSteps[stepIndex]?.key ?? 'projectType';
  const lastStepIndex = activeSteps.length - 1;

  // For landing pages, force siteSize to 'small' (1 page)
  const effectiveSiteSize = projectType === 'landing' ? 'small' : siteSize;

  const result = calculate(projectType, effectiveSiteSize, designLevel, selectedFeatures, timeline);
  const animLow = useAnimatedNumber(result?.low ?? 0);
  const animHigh = useAnimatedNumber(result?.high ?? 0);

  const canAdvance =
    (currentStep === 'projectType' && projectType !== null) ||
    (currentStep === 'siteSize' && siteSize !== null) ||
    (currentStep === 'designLevel' && designLevel !== null) ||
    currentStep === 'features' || // features are optional
    (currentStep === 'timeline' && timeline !== null);

  const next = useCallback(() => {
    if (stepIndex < lastStepIndex) {
      setStepIndex((s) => s + 1);
    } else {
      setShowResults(true);
    }
  }, [stepIndex, lastStepIndex]);

  const back = useCallback(() => {
    if (showResults) {
      setShowResults(false);
    } else if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    }
  }, [stepIndex, showResults]);

  const toggleFeature = useCallback((id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }, []);

  const startOver = useCallback(() => {
    setStepIndex(0);
    setProjectType(null);
    setSiteSize(null);
    setDesignLevel(null);
    setSelectedFeatures([]);
    setTimeline(null);
    setShowResults(false);
  }, []);

  function fmt(n: number) {
    return '$' + n.toLocaleString('en-US');
  }

  /* ── Results view ── */
  if (showResults && result) {
    const bd = result.breakdown;
    const items = [
      bd.base,
      ...(bd.size.value > 0 ? [bd.size] : []),
      ...(bd.design.value > 0 ? [bd.design] : []),
      ...(bd.features.value > 0 ? [bd.features] : []),
      ...(bd.timeline.value > 0 ? [bd.timeline] : []),
    ];

    return (
      <div className={styles.calculator}>
        <div className={styles.results}>
          <div className={styles.priceCard}>
            <div className={styles.priceLabel}>Estimated Investment</div>
            <div className={styles.priceRange}>
              {fmt(animLow)}
              <span className={styles.priceTo}> to </span>
              {fmt(animHigh)}
            </div>
            <div className={styles.priceNote}>
              Based on your selections. Final price determined after consultation.
            </div>
          </div>

          <div className={styles.breakdown}>
            <div className={styles.breakdownTitle}>How we got there</div>
            <ul className={styles.breakdownList}>
              {items.map((item) => (
                <li key={item.label} className={styles.breakdownItem}>
                  <span className={styles.breakdownName}>{item.label}</span>
                  <span className={styles.breakdownValue}>
                    {item === bd.base ? fmt(item.value) : '+' + fmt(item.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.resultActions}>
            <a href="/services/#contact" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
              Get an exact quote →
            </a>
            <button
              type="button"
              className={`${styles.ctaBtn} ${styles.ctaSecondary}`}
              onClick={startOver}
            >
              Start over
            </button>
          </div>

          <p className={styles.disclaimer}>
            This estimate is a starting point, not a binding quote. Every project is different.
            Let's chat about yours and I'll give you a real number.
          </p>
        </div>
      </div>
    );
  }

  /* ── Wizard steps ── */
  return (
    <div className={styles.calculator}>
      {/* Progress */}
      <div className={styles.progress}>
        {activeSteps.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 && (
              <span className={styles.stepLine}>
                <span className={`${styles.stepLineFill} ${i <= stepIndex ? styles.filled : ''}`} />
              </span>
            )}
            <span
              className={`${styles.stepDot} ${i === stepIndex ? styles.active : ''} ${i < stepIndex ? styles.completed : ''}`}
            >
              {i < stepIndex ? '✓' : i + 1}
            </span>
          </Fragment>
        ))}
      </div>

      <div className={styles.stepContainer}>
        {/* Project Type */}
        {currentStep === 'projectType' && (
          <div className={styles.step} key="projectType">
            <div className={styles.stepLabel}>Step {stepIndex + 1} of {activeSteps.length}</div>
            <h2 className={styles.stepTitle}>What kind of project is this?</h2>
            <p className={styles.stepDescription}>
              Pick the option that best describes what you need. Not sure? "Business Website" covers
              most cases.
            </p>
            <div className={styles.options}>
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.option} ${projectType === t.id ? styles.selected : ''}`}
                  onClick={() => setProjectType(t.id)}
                >
                  <span className={styles.optionIcon}>{t.icon}</span>
                  <div className={styles.optionTitle}>{t.title}</div>
                  <div className={styles.optionHint}>{t.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Site Size */}
        {currentStep === 'siteSize' && (
          <div className={styles.step} key="siteSize">
            <div className={styles.stepLabel}>Step {stepIndex + 1} of {activeSteps.length}</div>
            <h2 className={styles.stepTitle}>
              {projectType === 'redesign'
                ? 'How big is your current site?'
                : 'How many pages do you need?'}
            </h2>
            <p className={styles.stepDescription}>
              {projectType === 'redesign'
                ? "Roughly how many pages does your existing site have? The new site can end up different, but this helps estimate scope."
                : "Think about the main sections: Home, About, Services, Contact, etc. Don't worry about getting this exact."}
            </p>
            <div className={styles.options}>
              {SITE_SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.option} ${siteSize === s.id ? styles.selected : ''}`}
                  onClick={() => setSiteSize(s.id)}
                >
                  <div className={styles.optionTitle}>{s.title}</div>
                  <div className={styles.optionHint}>{s.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Design Level */}
        {currentStep === 'designLevel' && (
          <div className={styles.step} key="designLevel">
            <div className={styles.stepLabel}>Step {stepIndex + 1} of {activeSteps.length}</div>
            <h2 className={styles.stepTitle}>What level of design are you looking for?</h2>
            <p className={styles.stepDescription}>
              All options look great. This is about how much custom work goes into making your site
              stand out.
            </p>
            <div className={styles.options}>
              {DESIGN_LEVELS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`${styles.option} ${designLevel === d.id ? styles.selected : ''}`}
                  onClick={() => setDesignLevel(d.id)}
                >
                  <span className={styles.optionIcon}>{d.icon}</span>
                  <div className={styles.optionTitle}>{d.title}</div>
                  <div className={styles.optionHint}>{d.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {currentStep === 'features' && (
          <div className={styles.step} key="features">
            <div className={styles.stepLabel}>Step {stepIndex + 1} of {activeSteps.length}</div>
            <h2 className={styles.stepTitle}>Any extra features?</h2>
            <p className={styles.stepDescription}>
              These are optional add-ons. Skip any you don't need.
            </p>
            <div className={styles.features}>
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.feature} ${selectedFeatures.includes(f.id) ? styles.checked : ''}`}
                  onClick={() => toggleFeature(f.id)}
                >
                  <span className={styles.checkbox}>✓</span>
                  <span className={styles.featureLabel}>{f.label}</span>
                  <span className={styles.featurePrice}>+${f.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {currentStep === 'timeline' && (
          <div className={styles.step} key="timeline">
            <div className={styles.stepLabel}>Step {stepIndex + 1} of {activeSteps.length}</div>
            <h2 className={styles.stepTitle}>When do you need it done?</h2>
            <p className={styles.stepDescription}>
              Faster timelines mean I prioritize your project, which adjusts the cost.
            </p>
            <div className={styles.options}>
              {TIMELINES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.option} ${timeline === t.id ? styles.selected : ''}`}
                  onClick={() => setTimeline(t.id)}
                >
                  <div className={styles.optionTitle}>{t.title}</div>
                  <div className={styles.optionHint}>{t.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className={styles.nav}>
        {stepIndex > 0 ? (
          <button type="button" className={`${styles.navBtn} ${styles.backBtn}`} onClick={back}>
            ← Back
          </button>
        ) : (
          <span className={styles.spacer} />
        )}
        <button
          type="button"
          className={`${styles.navBtn} ${styles.nextBtn}`}
          disabled={!canAdvance}
          onClick={next}
        >
          {stepIndex === lastStepIndex ? 'See estimate' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default function CostCalculator() {
  return (
    <ErrorBoundary>
      <CostCalculatorInner />
    </ErrorBoundary>
  );
}
