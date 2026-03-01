import type { CellValue } from '../types';
import { PIECE_COLORS, PIECE_DARK_COLORS, PIECE_GLOW_COLORS } from '../constants';
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

  const dark = PIECE_DARK_COLORS[value];
  const neon = PIECE_COLORS[value];
  const glow = PIECE_GLOW_COLORS[value];

  return (
    <div
      className={`cellFilled cell ${isClearing ? 'cellClearing' : ''}`}
      style={{
        backgroundColor: dark,
        borderColor: neon,
        boxShadow: `0 0 8px ${glow}, 0 0 2px ${neon}, inset 0 0 6px ${glow}`,
      }}
    />
  );
}

export default Cell;
