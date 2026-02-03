import { useNavigate } from 'react-router-dom';
import { GameCard } from '../ui/Card';
import GlowText from '../ui/GlowText';
import Button from '../ui/Button';
import { MinesweeperRoguelikePreview } from '../../games/minesweeper-roguelike';
import styles from './GameGrid.module.css';

function GameGrid() {
  const navigate = useNavigate();

  return (
    <section id="games" className={styles.section}>
      <GlowText
        as="h2"
        size="medium"
        color="magenta"
        className={styles.sectionTitle}
      >
        FEATURED GAME
      </GlowText>
      <p className={styles.blurb}>
        A playground for rapid AI-assisted development, combining my love of
        gaming with experiments in agentic workflows.
      </p>
      <div className={styles.grid}>
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
      </div>
      <div className={styles.arcadeLink}>
        <Button variant="secondary" onClick={() => navigate('/arcade')}>
          View My Arcade →
        </Button>
      </div>
    </section>
  );
}

export default GameGrid;
