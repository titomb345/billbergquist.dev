import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const css = `
  .eb-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    padding: 3rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  /* Scanline overlay */
  .eb-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.15) 4px
    );
    pointer-events: none;
    z-index: 3;
  }

  /* Slow crawling scanline bar */
  .eb-wrap::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(255, 0, 255, 0.04),
      transparent
    );
    animation: eb-scanbar 4s linear infinite;
    pointer-events: none;
    z-index: 4;
  }

  @keyframes eb-scanbar {
    0% { top: -60px; }
    100% { top: 100%; }
  }

  /* Glitch text effect */
  .eb-glitch {
    font-family: var(--font-heading, 'Orbitron', monospace);
    font-size: clamp(3rem, 10vw, 6rem);
    font-weight: 900;
    color: var(--neon-magenta, #ff00ff);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    position: relative;
    line-height: 1;
    margin-bottom: 1.5rem;
    text-shadow:
      0 0 10px var(--neon-magenta, #ff00ff),
      0 0 30px rgba(255, 0, 255, 0.4),
      0 0 60px rgba(255, 0, 255, 0.2);
    animation: eb-flicker 3s ease-in-out infinite;
  }

  .eb-glitch::before,
  .eb-glitch::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: hidden;
  }

  .eb-glitch::before {
    color: var(--neon-mint, #00d4aa);
    text-shadow: 0 0 10px var(--neon-mint, #00d4aa);
    clip-path: inset(0 0 65% 0);
    animation: eb-glitch-top 2.5s steps(1) infinite;
  }

  .eb-glitch::after {
    color: var(--neon-orange, #ff6a00);
    text-shadow: 0 0 10px var(--neon-orange, #ff6a00);
    clip-path: inset(60% 0 0 0);
    animation: eb-glitch-btm 3s steps(1) infinite;
  }

  @keyframes eb-glitch-top {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-3px, 2px); }
    40% { transform: translate(3px, -1px); }
    60% { transform: translate(-2px, 1px); }
    80% { transform: translate(2px, -2px); }
  }

  @keyframes eb-glitch-btm {
    0%, 100% { transform: translate(0); }
    15% { transform: translate(2px, 1px); }
    35% { transform: translate(-3px, -1px); }
    55% { transform: translate(1px, 2px); }
    75% { transform: translate(-2px, -1px); }
  }

  @keyframes eb-flicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55% { opacity: 0.85; }
  }

  .eb-label {
    font-family: var(--font-heading, 'Orbitron', monospace);
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--text-muted, #6a6a7a);
    margin-bottom: 1.25rem;
  }

  .eb-msg {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    line-height: 1.7;
    color: var(--text-muted, #6a6a7a);
    max-width: 420px;
    margin: 0 auto 2rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 0, 255, 0.03);
    border: 1px solid rgba(255, 0, 255, 0.08);
    border-radius: 4px;
    word-break: break-word;
    text-align: left;
  }

  .eb-msg-prefix {
    color: var(--neon-magenta, #ff00ff);
    user-select: none;
  }

  .eb-btn {
    font-family: var(--font-heading, 'Orbitron', monospace);
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--neon-mint, #00d4aa);
    background: transparent;
    border: 1px solid var(--neon-mint, #00d4aa);
    padding: 0.6rem 2rem;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .eb-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--neon-mint, #00d4aa);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .eb-btn:hover {
    color: var(--bg-void, #0a0a0f);
    box-shadow:
      0 0 15px rgba(0, 212, 170, 0.3),
      0 0 30px rgba(0, 212, 170, 0.15);
  }

  .eb-btn:hover::before {
    opacity: 1;
  }

  .eb-btn span {
    position: relative;
    z-index: 1;
  }

  .eb-btn:active {
    transform: scale(0.97);
  }

  /* Decorative corner brackets */
  .eb-corners {
    position: absolute;
    inset: 2rem;
    pointer-events: none;
    z-index: 1;
  }

  .eb-corners::before,
  .eb-corners::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: rgba(255, 0, 255, 0.15);
    border-style: solid;
  }

  .eb-corners::before {
    top: 0;
    left: 0;
    border-width: 1px 0 0 1px;
  }

  .eb-corners::after {
    bottom: 0;
    right: 0;
    border-width: 0 1px 1px 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .eb-glitch { animation: none; }
    .eb-glitch::before, .eb-glitch::after { animation: none; display: none; }
    .eb-wrap::after { animation: none; display: none; }
  }

  @media (max-width: 640px) {
    .eb-wrap { padding: 2rem 1rem; }
    .eb-corners { inset: 1rem; }
  }
`;

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="eb-wrap">
        <div className="eb-corners" />
        <div className="eb-glitch" data-text="ERROR">ERROR</div>
        <p className="eb-label">System fault detected</p>
        <div className="eb-msg">
          <span className="eb-msg-prefix">{'> '}</span>
          {error?.message || 'An unexpected error occurred.'}
        </div>
        <button className="eb-btn" onClick={onReset}>
          <span>Retry</span>
        </button>
      </div>
    </>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
