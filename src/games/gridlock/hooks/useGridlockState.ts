import { useReducer, useCallback } from 'react';
import {
  type GridlockState,
  type GridlockAction,
  GamePhase,
} from '../types';
import {
  getGravitySpeed,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  LINE_CLEAR_DURATION,
} from '../constants';
import { createEmptyBoard, lockPiece, findCompletedLines, clearLines } from '../logic/boardLogic';
import {
  spawnPiece,
  canSpawn,
  tryMove,
  tryRotate,
  isGrounded,
  getGhostY,
  generateBag,
  pullFromBag,
} from '../logic/pieceLogic';
import { getLineClearScore, getHardDropScore, getSoftDropScore, getLevel } from '../logic/scoreLogic';

function createInitialState(): GridlockState {
  return {
    phase: GamePhase.Start,
    board: createEmptyBoard(),
    activePiece: null,
    ghostY: 0,
    nextPiece: 'T',
    heldPiece: null,
    canHold: true,
    bag: [],
    score: 0,
    level: 1,
    lines: 0,
    time: 0,
    lastDropTime: 0,
    lockTimer: null,
    lockResets: 0,
    clearingLines: [],
    isMobile: false,
  };
}

function spawnNextPiece(state: GridlockState): GridlockState {
  const [nextType, remainingBag] = pullFromBag(state.bag);
  const piece = spawnPiece(state.nextPiece);

  if (!canSpawn(state.board, state.nextPiece)) {
    return { ...state, phase: GamePhase.GameOver, activePiece: null };
  }

  return {
    ...state,
    activePiece: piece,
    ghostY: getGhostY(state.board, piece),
    nextPiece: nextType,
    bag: remainingBag,
    canHold: true,
    lockTimer: null,
    lockResets: 0,
  };
}

function handleLockAndClear(state: GridlockState): GridlockState {
  if (!state.activePiece) return state;

  const newBoard = lockPiece(state.board, state.activePiece);
  const completedLines = findCompletedLines(newBoard);

  if (completedLines.length > 0) {
    const lineScore = getLineClearScore(completedLines.length, state.level);
    const newLines = state.lines + completedLines.length;
    const newLevel = getLevel(newLines);
    return {
      ...state,
      board: newBoard,
      activePiece: null,
      score: state.score + lineScore,
      lines: newLines,
      level: newLevel,
      clearingLines: completedLines,
      phase: GamePhase.LineClear,
      lockTimer: null,
      lockResets: 0,
    };
  }

  // No lines cleared, spawn next piece
  const afterLock: GridlockState = {
    ...state,
    board: newBoard,
    activePiece: null,
    lockTimer: null,
    lockResets: 0,
  };
  return spawnNextPiece(afterLock);
}

function updateLockState(state: GridlockState, moved: boolean): GridlockState {
  if (!state.activePiece) return state;

  const grounded = isGrounded(state.board, state.activePiece);

  if (!grounded) {
    // No longer grounded, clear lock timer
    return { ...state, lockTimer: null };
  }

  if (state.lockTimer === null) {
    // Just became grounded, start lock timer
    return { ...state, lockTimer: LOCK_DELAY };
  }

  if (moved && state.lockResets < MAX_LOCK_RESETS) {
    // Successful move/rotate while grounded resets lock timer
    return { ...state, lockTimer: LOCK_DELAY, lockResets: state.lockResets + 1 };
  }

  return state;
}

function gridlockReducer(state: GridlockState, action: GridlockAction): GridlockState {
  switch (action.type) {
    case 'START_GAME': {
      const bag = [...generateBag(), ...generateBag()];
      const [firstType, bag1] = pullFromBag(bag);
      const [secondType, bag2] = pullFromBag(bag1);
      const piece = spawnPiece(firstType);
      return {
        ...createInitialState(),
        phase: GamePhase.Playing,
        activePiece: piece,
        ghostY: getGhostY(createEmptyBoard(), piece),
        nextPiece: secondType,
        bag: bag2,
        lastDropTime: performance.now(),
        isMobile: action.isMobile,
      };
    }

    case 'TICK': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;

      const elapsed = action.timestamp - state.lastDropTime;
      const gravitySpeed = getGravitySpeed(state.level);
      let current = { ...state, time: state.time + 1 };

      // Handle lock timer countdown
      if (current.lockTimer !== null) {
        // Approximate lock timer decrease based on frame time (~16ms)
        const newLockTimer = current.lockTimer - 16;
        if (newLockTimer <= 0) {
          return handleLockAndClear(current);
        }
        current = { ...current, lockTimer: newLockTimer };
      }

      // Gravity drop
      if (elapsed >= gravitySpeed) {
        const moved = tryMove(current.board, current.activePiece!, 1, 0);
        if (moved) {
          current = {
            ...current,
            activePiece: moved,
            ghostY: getGhostY(current.board, moved),
            lastDropTime: action.timestamp,
          };
          return updateLockState(current, false);
        }
        // Can't move down, update lock state
        current = { ...current, lastDropTime: action.timestamp };
        return updateLockState(current, false);
      }

      return current;
    }

    case 'MOVE_LEFT': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const moved = tryMove(state.board, state.activePiece, 0, -1);
      if (!moved) return state;
      const next = {
        ...state,
        activePiece: moved,
        ghostY: getGhostY(state.board, moved),
      };
      return updateLockState(next, true);
    }

    case 'MOVE_RIGHT': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const moved = tryMove(state.board, state.activePiece, 0, 1);
      if (!moved) return state;
      const next = {
        ...state,
        activePiece: moved,
        ghostY: getGhostY(state.board, moved),
      };
      return updateLockState(next, true);
    }

    case 'SOFT_DROP': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const moved = tryMove(state.board, state.activePiece, 1, 0);
      if (!moved) return state;
      return {
        ...state,
        activePiece: moved,
        ghostY: getGhostY(state.board, moved),
        score: state.score + getSoftDropScore(1),
        lastDropTime: performance.now(),
        lockTimer: null, // Reset lock on soft drop
      };
    }

    case 'HARD_DROP': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const ghostY = getGhostY(state.board, state.activePiece);
      const cellsDropped = ghostY - state.activePiece.position.row;
      const dropped: GridlockState = {
        ...state,
        activePiece: {
          ...state.activePiece,
          position: { ...state.activePiece.position, row: ghostY },
        },
        score: state.score + getHardDropScore(cellsDropped),
      };
      return handleLockAndClear(dropped);
    }

    case 'ROTATE_CW': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const rotated = tryRotate(state.board, state.activePiece, 1);
      if (!rotated) return state;
      const next = {
        ...state,
        activePiece: rotated,
        ghostY: getGhostY(state.board, rotated),
      };
      return updateLockState(next, true);
    }

    case 'ROTATE_CCW': {
      if (state.phase !== GamePhase.Playing || !state.activePiece) return state;
      const rotated = tryRotate(state.board, state.activePiece, -1);
      if (!rotated) return state;
      const next = {
        ...state,
        activePiece: rotated,
        ghostY: getGhostY(state.board, rotated),
      };
      return updateLockState(next, true);
    }

    case 'HOLD': {
      if (state.phase !== GamePhase.Playing || !state.activePiece || !state.canHold) return state;

      const currentType = state.activePiece.type;

      if (state.heldPiece === null) {
        // First hold: put current in hold, spawn next
        const next = {
          ...state,
          heldPiece: currentType,
          canHold: false,
          activePiece: null,
        };
        return spawnNextPiece(next);
      }

      // Swap held and active
      const newPiece = spawnPiece(state.heldPiece);
      if (!canSpawn(state.board, state.heldPiece)) {
        return { ...state, phase: GamePhase.GameOver };
      }
      return {
        ...state,
        activePiece: newPiece,
        ghostY: getGhostY(state.board, newPiece),
        heldPiece: currentType,
        canHold: false,
        lockTimer: null,
        lockResets: 0,
      };
    }

    case 'PAUSE': {
      if (state.phase !== GamePhase.Playing) return state;
      return { ...state, phase: GamePhase.Paused };
    }

    case 'RESUME': {
      if (state.phase !== GamePhase.Paused) return state;
      return { ...state, phase: GamePhase.Playing, lastDropTime: performance.now() };
    }

    case 'CLEAR_ANIMATION_DONE': {
      if (state.phase !== GamePhase.LineClear) return state;
      const clearedBoard = clearLines(state.board, state.clearingLines);
      const next: GridlockState = {
        ...state,
        board: clearedBoard,
        clearingLines: [],
        phase: GamePhase.Playing,
      };
      return spawnNextPiece(next);
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}

export function useGridlockState() {
  const [state, dispatch] = useReducer(gridlockReducer, undefined, createInitialState);

  const startGame = useCallback((isMobile: boolean) => {
    dispatch({ type: 'START_GAME', isMobile });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { state, dispatch, startGame, reset };
}
