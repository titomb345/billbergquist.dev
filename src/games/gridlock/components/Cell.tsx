import type { CellValue } from '../types';
import { PIECE_COLORS, PIECE_GLOW_COLORS } from '../constants';
import '../styles.css';

interface CellProps {
  value: CellValue;
  isGhost?: boolean;
  isClearing?: boolean;
}

function Cell({ value, isGhost, isClearing }: CellProps) {
  if (isGhost) {
    return <div className="cellGhost cell" />;
  }

  if (!value) {
    return <div className="cellEmpty cell" />;
  }

  const bg = PIECE_COLORS[value];
  const glow = PIECE_GLOW_COLORS[value];

  return (
    <div
      className={`cellFilled cell ${isClearing ? 'cellClearing' : ''}`}
      style={{
        backgroundColor: bg,
        boxShadow: `0 0 6px ${glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    />
  );
}

export default Cell;
