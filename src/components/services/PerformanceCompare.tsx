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

function ScoreRing({
  score,
  label,
  size = 72,
  highlight,
}: {
  score: number;
  label: string;
  size?: number;
  highlight?: 'win' | 'lose' | 'tie';
}) {
  return (
    <div className={`${styles.scoreItem} ${highlight === 'win' ? styles.scoreWin : ''}`}>
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
        <span className={styles.scoreValue} style={{ fontSize: size * 0.018 + 'rem' }}>
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
        Enter your website URL below and I'll run a real Google Lighthouse audit. See how your site
        stacks up against my portfolio.
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
        <button type="submit" className={styles.button} disabled={status === 'loading'}>
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
                {CATEGORIES.map((cat) => {
                  const yours = result[cat.key];
                  const ours = portfolioAvg[cat.key];
                  const highlight =
                    yours > ours ? 'win' : yours < ours ? 'lose' : ('tie' as const);
                  return (
                    <ScoreRing
                      key={cat.key}
                      score={yours}
                      label={cat.label}
                      size={64}
                      highlight={highlight}
                    />
                  );
                })}
              </div>
            </div>
            <div className={styles.vsDivider}>
              <span className={styles.vsText}>vs</span>
            </div>
            <div className={styles.resultsColumn}>
              <h3 className={styles.columnTitle}>My Portfolio Avg</h3>
              <p className={styles.columnUrl}>3 sites</p>
              <div className={styles.resultsGrid}>
                {CATEGORIES.map((cat) => {
                  const yours = result[cat.key];
                  const ours = portfolioAvg[cat.key];
                  const highlight =
                    ours > yours ? 'win' : ours < yours ? 'lose' : ('tie' as const);
                  return (
                    <ScoreRing
                      key={cat.key}
                      score={ours}
                      label={cat.label}
                      size={64}
                      highlight={highlight}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {(() => {
            const userAvg = Math.round(
              (result.performance + result.accessibility + result.bestPractices + result.seo) / 4,
            );
            const portfolioAvgScore = Math.round(
              (portfolioAvg.performance +
                portfolioAvg.accessibility +
                portfolioAvg.bestPractices +
                portfolioAvg.seo) /
                4,
            );
            const diff = portfolioAvgScore - userAvg;
            if (diff > 0) {
              return (
                <p className={styles.verdictText}>
                  My portfolio scores <strong>{diff} points higher</strong> on average.{' '}
                  <a href="/services/#contact">Let's close that gap.</a>
                </p>
              );
            }
            if (diff === 0) {
              return (
                <p className={styles.verdictText}>
                  Dead even. Your site is in great shape. If you ever need help keeping it there,{' '}
                  <a href="/services/#contact">let me know</a>.
                </p>
              );
            }
            return (
              <p className={styles.verdictText}>
                Nice work, your site is performing well! If you ever want a second pair of eyes on
                it, <a href="/services/#contact">I'm happy to chat</a>.
              </p>
            );
          })()}

          <p className={styles.scoreDisclaimer}>
            Scores can vary between runs due to network and server conditions.
          </p>

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
