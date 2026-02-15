import { useRef, useCallback, useState } from 'react';
import usePageMeta from '../../hooks/usePageMeta';
import { ArcadeCabinet } from '../../components/arcade';
import MinesweeperRoguelike from './MinesweeperRoguelike';

function MinesweeperRoguelikePage() {
  usePageMeta({
    title: 'Minesweeper: Descent — Bill Bergquist',
    description:
      'Roguelike minesweeper game. Descend 10 floors of escalating danger, collect power-ups, and survive. Free to play in your browser.',
    canonical: '/arcade/descent',
  });
  const resetRef = useRef<(() => void) | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  return (
    <ArcadeCabinet
      title="MINESWEEPER: DESCENT"
      color="magenta"
      onPause={() => setIsPaused(true)}
      isPaused={isPaused}
      onReset={handleReset}
    >
      <MinesweeperRoguelike
        resetRef={resetRef}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
      />
    </ArcadeCabinet>
  );
}

export default MinesweeperRoguelikePage;
