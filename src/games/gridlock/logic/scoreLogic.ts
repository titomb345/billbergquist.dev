import { LINE_CLEAR_SCORES, LINES_PER_LEVEL, SOFT_DROP_SCORE, HARD_DROP_SCORE } from '../constants';

/** Calculate score for a line clear */
export function getLineClearScore(linesCleared: number, level: number): number {
  const base = LINE_CLEAR_SCORES[linesCleared] ?? 0;
  return base * level;
}

/** Calculate score for a soft drop */
export function getSoftDropScore(cellsDropped: number): number {
  return cellsDropped * SOFT_DROP_SCORE;
}

/** Calculate score for a hard drop */
export function getHardDropScore(cellsDropped: number): number {
  return cellsDropped * HARD_DROP_SCORE;
}

/** Calculate the level based on total lines cleared */
export function getLevel(totalLines: number, startLevel: number = 1): number {
  return startLevel + Math.floor(totalLines / LINES_PER_LEVEL);
}
