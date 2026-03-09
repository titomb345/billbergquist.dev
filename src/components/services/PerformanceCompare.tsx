import { useState, type FormEvent } from 'react';
import styles from './PerformanceCompare.module.css';

interface Scores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface Props {
  portfolioAvg: Scores;
  apiKey?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const CATEGORIES = [
  { key: 'performance' as const, label: 'Performance' },
  { key: 'accessibility' as const, label: 'Accessibility' },
  { key: 'bestPractices' as const, label: 'Best Practices' },
  { key: 'seo' as const, label: 'SEO' },
];

function scoreColor(score: number): string {
  if (score >= 90) return '#0cce6b';
  if (score >= 50) return '#ffa400';
  return '#ff4e42';
}

function ScoreRing({ score, label, size = 72 }: { score: number; label: string; size?: number }) {
  return (
    <div className={styles.scoreItem}>
      <div
        className={styles.scoreRing}
        style={
          {
            width: size,
            height: size,
            '--ring-color': scoreColor(score),
            '--score': score,
          } as React.CSSProperties
        }
      >
        <span className={styles.scoreValue} style={{ fontSize: size * 0.3 + 'px' }}>
          {score}
        </span>
      </div>
      <span className={styles.scoreLabel}>{label}</span>
    </div>
  );
}

export default function PerformanceCompare({ portfolioAvg, apiKey }: Props) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<Scores | null>(null);
  const [testedUrl, setTestedUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Normalize URL
    let testUrl = trimmed;
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = 'https://' + testUrl;
    }

    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    setTestedUrl(testUrl);

    try {
      const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
      apiUrl.searchParams.set('url', testUrl);
      apiUrl.searchParams.set('strategy', 'mobile');
      apiUrl.searchParams.set('category', 'PERFORMANCE');
      apiUrl.searchParams.append('category', 'ACCESSIBILITY');
      apiUrl.searchParams.append('category', 'BEST_PRACTICES');
      apiUrl.searchParams.append('category', 'SEO');
      if (apiKey) {
        apiUrl.searchParams.set('key', apiKey);
      }

      const res = await fetch(apiUrl.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `API returned ${res.status}`);
      }

      const data = await res.json();
      const cats = data.lighthouseResult?.categories;
      if (!cats) throw new Error('No Lighthouse results returned');

      setResult({
        performance: Math.round((cats.performance?.score ?? 0) * 100),
        accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
        seo: Math.round((cats.seo?.score ?? 0) * 100),
      });
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setStatus('error');
    }
  }

  return (
    <div className={styles.compare}>
      <h2 className={styles.heading}>Test Your Site</h2>
      <p className={styles.description}>
        Enter your website URL below and we'll run a real Google Lighthouse audit. See how your site
        stacks up against our portfolio.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yoursite.com"
          className={styles.input}
          disabled={status === 'loading'}
          aria-label="Website URL to test"
        />
        <button type="submit" className={styles.button} disabled={status === 'loading' || !url.trim()}>
          {status === 'loading' ? 'Running...' : 'Run Test'}
        </button>
      </form>

      {status === 'loading' && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>
            Running Lighthouse audit on <strong>{testedUrl}</strong>
          </p>
          <p className={styles.loadingSubtext}>This usually takes 15 to 30 seconds.</p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorState}>
          <p className={styles.errorText}>{errorMsg}</p>
          <p className={styles.errorHint}>
            Make sure the URL is publicly accessible and try again.
          </p>
        </div>
      )}

      {status === 'done' && result && (
        <div className={styles.results}>
          <div className={styles.resultsColumns}>
            <div className={styles.resultsColumn}>
              <h3 className={styles.columnTitle}>Your Site</h3>
              <p className={styles.columnUrl}>{testedUrl.replace(/^https?:\/\//, '')}</p>
              <div className={styles.resultsGrid}>
                {CATEGORIES.map((cat) => (
                  <ScoreRing key={cat.key} score={result[cat.key]} label={cat.label} size={64} />
                ))}
              </div>
            </div>
            <div className={styles.vsDivider}>
              <span className={styles.vsText}>vs</span>
            </div>
            <div className={styles.resultsColumn}>
              <h3 className={styles.columnTitle}>Our Portfolio Avg</h3>
              <p className={styles.columnUrl}>3 sites</p>
              <div className={styles.resultsGrid}>
                {CATEGORIES.map((cat) => (
                  <ScoreRing
                    key={cat.key}
                    score={portfolioAvg[cat.key]}
                    label={cat.label}
                    size={64}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.retestButton}
            onClick={() => {
              setStatus('idle');
              setResult(null);
            }}
          >
            Test another site
          </button>
        </div>
      )}

      <p className={styles.apiNote}>
        Powered by{' '}
        <a
          href="https://developers.google.com/speed/docs/insights/v5/get-started"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google PageSpeed Insights API
        </a>{' '}
        (mobile strategy)
      </p>
    </div>
  );
}
