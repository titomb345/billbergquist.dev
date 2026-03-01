import { PIECE_COLORS } from './constants';
import type { PieceType } from './types';

/**
 * Static preview for the arcade hub card.
 * Shows a small frozen Tetris board with some blocks.
 */
function GridlockPreview() {
  // A simple static mini-board (8 rows x 6 cols)
  const grid: (PieceType | null)[][] = [
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, 'T', null, null],
    [null, null, 'T', 'T', 'T', null],
    [null, null, null, null, null, null],
    ['L', null, null, null, null, 'J'],
    ['L', 'S', 'S', 'Z', 'Z', 'J'],
    ['L', 'L', 'S', 'S', 'Z', 'J'],
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '1px',
        padding: '0.5rem',
        maxWidth: '120px',
        margin: '0 auto',
      }}
    >
      {grid.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            borderRadius: '2px',
            backgroundColor: cell ? PIECE_COLORS[cell] : 'rgba(255,255,255,0.03)',
            boxShadow: cell
              ? `0 0 4px ${PIECE_COLORS[cell]}40`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default GridlockPreview;
