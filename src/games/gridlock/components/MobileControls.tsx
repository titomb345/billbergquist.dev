import type { GridlockAction } from '../types';
import '../styles.css';

interface MobileControlsProps {
  dispatch: React.Dispatch<GridlockAction>;
  onHold: () => void;
}

function MobileControls({ dispatch, onHold }: MobileControlsProps) {
  return (
    <div className="mobileControls">
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'MOVE_LEFT' }); }}
        aria-label="Move left"
      >
        &larr;
      </button>
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'HARD_DROP' }); }}
        aria-label="Hard drop"
      >
        &darr;&darr;
      </button>
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'MOVE_RIGHT' }); }}
        aria-label="Move right"
      >
        &rarr;
      </button>
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'ROTATE_CCW' }); }}
        aria-label="Rotate counter-clockwise"
      >
        &#8634;
      </button>
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'SOFT_DROP' }); }}
        aria-label="Soft drop"
      >
        &darr;
      </button>
      <button
        className="mobileButton"
        onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'ROTATE_CW' }); }}
        aria-label="Rotate clockwise"
      >
        &#8635;
      </button>
      <button
        className="mobileButtonWide"
        onTouchStart={(e) => { e.preventDefault(); onHold(); }}
        aria-label="Hold piece"
      >
        HOLD
      </button>
    </div>
  );
}

export default MobileControls;
