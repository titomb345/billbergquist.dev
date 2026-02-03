import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArcadeCabinet } from '../../components/arcade';
import MinesweeperRoguelike from './MinesweeperRoguelike';

function MinesweeperRoguelikePage() {
  const navigate = useNavigate();
  const resetRef = useRef<(() => void) | null>(null);

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  return (
    <ArcadeCabinet
      title="MINESWEEPER: DESCENT"
      color="magenta"
      onBack={() => navigate('/arcade')}
      onReset={handleReset}
      resetLabel="RESET"
    >
      <MinesweeperRoguelike resetRef={resetRef} />
    </ArcadeCabinet>
  );
}

export default MinesweeperRoguelikePage;
