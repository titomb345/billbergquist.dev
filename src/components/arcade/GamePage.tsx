import { useRef, useCallback, useState, type ComponentType } from 'react';
import ArcadeCabinet from './ArcadeCabinet';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface GameProps {
  resetRef: React.MutableRefObject<(() => void) | null>;
  isPaused: boolean;
  onResume: () => void;
}

interface GamePageProps {
  title: string;
  color: 'mint' | 'magenta' | 'purple' | 'orange';
  Game: ComponentType<GameProps>;
}

function GamePageInner({ title, color, Game }: GamePageProps) {
  const resetRef = useRef<(() => void) | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  return (
    <ArcadeCabinet
      title={title}
      color={color}
      onPause={() => setIsPaused(true)}
      isPaused={isPaused}
      onReset={handleReset}
    >
      <Game
        resetRef={resetRef}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
      />
    </ArcadeCabinet>
  );
}

export default function GamePage(props: GamePageProps) {
  return (
    <ErrorBoundary>
      <GamePageInner {...props} />
    </ErrorBoundary>
  );
}
