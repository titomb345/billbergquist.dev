import { useRef, useCallback, useState } from 'react';
import { ArcadeCabinet } from '../../components/arcade';
import MinesweeperRoguelike from './MinesweeperRoguelike';

function MinesweeperRoguelikePage() {
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
