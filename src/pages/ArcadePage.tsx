import { useNavigate } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import GlowText from '../components/ui/GlowText';
import { GameCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MinesweeperRoguelikePreview } from '../games/minesweeper-roguelike';
import useScrollReveal from '../hooks/useScrollReveal';
import styles from './ArcadePage.module.css';

function ArcadePage() {
  const navigate = useNavigate();
  const gridRef = useScrollReveal<HTMLElement>();

  usePageMeta({
    title: 'Arcade — Bill Bergquist',
    description:
      'Browser-based games built through AI-assisted development. Play Minesweeper: Descent, a roguelike minesweeper with 10 floors and 19 power-ups.',
    canonical: '/arcade',
  });

  return (
    <div className={styles.page}>
      {/* CRT scanline overlay */}
      <div className={styles.scanlines} />

      {/* Marquee ticker */}
      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          <span>INSERT COIN</span>
          <span className={styles.marqueeDot} />
          <span>PLAYER 1 READY</span>
          <span className={styles.marqueeDot} />
          <span>HIGH SCORE: ???</span>
          <span className={styles.marqueeDot} />
          <span>INSERT COIN</span>
          <span className={styles.marqueeDot} />
          <span>PLAYER 1 READY</span>
          <span className={styles.marqueeDot} />
          <span>HIGH SCORE: ???</span>
          <span className={styles.marqueeDot} />
        </div>
      </div>

      <header className={styles.header}>
        <GlowText size="large" color="magenta" animated className={styles.title}>
          ARCADE
        </GlowText>
        <p className={styles.subtitle}>
          Welcome to my arcade—a collection of browser-based games built
          entirely through{' '}
          <span className="neon-text-orange">AI-assisted development</span>.
          These projects are my playground for exploring agentic workflows,
          pushing the boundaries of what's possible when combining rapid
          prototyping with tools like{' '}
          <span className="neon-text-orange">Claude Code</span>. Gaming has
          always been a passion of mine, and this is where that passion meets
          cutting-edge development techniques.
        </p>
        <div className="accent-line-orange" />
      </header>

      <main className={`${styles.grid} scroll-reveal`} ref={gridRef}>
        <div className={`${styles.cabinetFrame} scroll-reveal-child`}>
          <GameCard
            title="Minesweeper: Descent"
            description="Roguelike minesweeper. Descend 10 floors of escalating danger. Collect power-ups to survive."
            preview={<MinesweeperRoguelikePreview />}
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/arcade/descent')}
              >
                Play Now
              </Button>
            }
          />
          <p className={styles.note}>* Game not entirely balanced</p>
        </div>
      </main>
    </div>
  );
}

export default ArcadePage;
