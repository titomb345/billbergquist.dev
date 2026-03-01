import type { PieceType } from '../types';
import { PIECE_SHAPES, PIECE_COLORS, PIECE_GLOW_COLORS } from '../constants';
import '../styles.css';

interface PiecePreviewProps {
  type: PieceType | null;
  label: string;
}

function PiecePreview({ type, label }: PiecePreviewProps) {
  // 4x4 preview grid
  const grid: boolean[][] = Array.from({ length: 2 }, () => Array(4).fill(false));

  if (type) {
    const shape = PIECE_SHAPES[type][0]; // Spawn rotation
    // Find min row to vertically center
    const minR = Math.min(...shape.map(([r]) => r));
    for (const [r, c] of shape) {
      const row = r - minR;
      if (row < 2 && c < 4) {
        grid[row][c] = true;
      }
    }
  }

  const color = type ? PIECE_COLORS[type] : undefined;
  const glow = type ? PIECE_GLOW_COLORS[type] : undefined;

  return (
    <div className="panelBox">
      <div className="panelLabel">{label}</div>
      <div className="piecePreview">
        {grid.flat().map((filled, i) => (
          <div
            key={i}
            className={`previewCell ${filled ? 'cellFilled' : 'previewCellEmpty'}`}
            style={
              filled
                ? {
                    backgroundColor: color,
                    boxShadow: `0 0 4px ${glow}`,
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

export default PiecePreview;
