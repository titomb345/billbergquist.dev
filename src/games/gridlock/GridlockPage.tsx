import { useRef, useCallback, useState } from 'react';
import { ArcadeCabinet } from '../../components/arcade';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import Gridlock from './Gridlock';

function GridlockPage() {
  const resetRef = useRef<(() => void) | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  return (
    <ArcadeCabinet
      title="GRIDLOCK: SHOWDOWN"
      color="purple"
      onPause={() => setIsPaused(true)}
      isPaused={isPaused}
      onReset={handleReset}
    >
      <Gridlock
        resetRef={resetRef}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
      />
    </ArcadeCabinet>
  );
}

function GridlockPageWithBoundary() {
  return (
    <ErrorBoundary>
      <GridlockPage />
    </ErrorBoundary>
  );
}

export default GridlockPageWithBoundary;
