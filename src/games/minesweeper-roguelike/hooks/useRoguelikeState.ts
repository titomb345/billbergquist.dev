import { useReducer, useEffect, useCallback } from 'react';
import {
  RoguelikeGameState,
  RoguelikeAction,
  PowerUp,
  GamePhase,
  RunState,
  Cell,
  CellState,
} from '../types';
import {
  createEmptyBoard,
  placeMines,
  placeMinesWithConstraints,
  revealCell,
  toggleFlag,
  chordReveal,
  revealAllMines,
} from '../logic/gameLogic';
import {
  createRoguelikeInitialState,
  createInitialRunState,
  setupFloor,
  hasPowerUp,
  calculateDangerCells,
  applyLuckyStart,
  applySixthSense,
  applyXRayVision,
  applyEdgeWalker,
  applySafePath,
  applyDefusalKit,
  calculateLineMineCount,
  calculateRevealScore,
  calculateFloorClearBonus,
  countRevealedCells,
  checkFloorCleared,
  isFinalFloor,
  countFlags,
  calculateChordHighlightCells,
  countZeroCells,
  calculatePatternMemoryCell,
  calculateSafestCells,
  calculateOracleGiftCells,
  calculateMineCount4x4,
} from '../logic/roguelikeLogic';
import { getFloorConfig, selectDraftOptions, getAvailablePowerUps, ORACLES_GIFT_MINE_DENSITY_BONUS } from '../constants';
import { saveGameState, loadGameState, clearGameState } from '../persistence';
import { AscensionLevel, getAscensionModifiers } from '../ascension';

// Helper: Handle floor clear transition and calculate draft options
function handleFloorClearTransition(
  run: RunState,
  time: number
): { phase: GamePhase; score: number; draftOptions: PowerUp[] } {
  const score = run.score + calculateFloorClearBonus(run.currentFloor, time);
  const modifiers = getAscensionModifiers(run.ascensionLevel);
  const draftOptions = isFinalFloor(run.currentFloor)
    ? []
    : selectDraftOptions(
        getAvailablePowerUps(),
        run.activePowerUps.map((p) => p.id),
        modifiers.draftChoices // A1: 2 choices at ascension 1+, otherwise 3
      );

  return { phase: GamePhase.FloorClear, score, draftOptions };
}

// Helper: Apply Iron Will protection when hitting a mine
function applyIronWillProtection(
  board: Cell[][],
  run: RunState,
  mineRow: number,
  mineCol: number,
  chordCenter?: { row: number; col: number }
): {
  board: Cell[][];
  run: RunState;
  saved: boolean;
  savedCell: { row: number; col: number } | null;
} {
  // Check per-floor usage instead of run-wide availability
  if (hasPowerUp(run, 'iron-will') && !run.ironWillUsedThisFloor) {
    let newBoard: Cell[][];
    if (chordCenter) {
      // For chord hits, flag only revealed mines in the chord area (3x3 around chord center)
      const rows = board.length;
      const cols = board[0].length;
      newBoard = board.map((r) =>
        r.map((c) => {
          // Check if this cell is within the chord's 3x3 area
          const inChordArea =
            Math.abs(c.row - chordCenter.row) <= 1 &&
            Math.abs(c.col - chordCenter.col) <= 1 &&
            c.row >= 0 &&
            c.row < rows &&
            c.col >= 0 &&
            c.col < cols;
          return c.isMine && c.state === CellState.Revealed && inChordArea
            ? { ...c, state: CellState.Flagged }
            : c;
        })
      );
    } else {
      // For single cell hits, flag just the hit mine
      newBoard = board.map((r) =>
        r.map((c) =>
          c.row === mineRow && c.col === mineCol ? { ...c, state: CellState.Flagged } : c
        )
      );
    }
    return {
      board: newBoard,
      run: {
        ...run,
        ironWillUsedThisFloor: true,
        traumaStacks: run.traumaStacks + 1,
      },
      saved: true,
      savedCell: { row: mineRow, col: mineCol },
    };
  }
  return { board, run, saved: false, savedCell: null };
}

function roguelikeReducer(
  state: RoguelikeGameState,
  action: RoguelikeAction
): RoguelikeGameState {
  switch (action.type) {
    case 'START_RUN': {
      const newState = createRoguelikeInitialState(action.isMobile, action.ascensionLevel);
      return setupFloor(newState, 1);
    }

    case 'GO_TO_START': {
      clearGameState();
      return {
        ...state,
        phase: GamePhase.Start,
        run: createInitialRunState(),
      };
    }

    case 'SET_MOBILE': {
      if (state.isMobile === action.isMobile) return state;
      return {
        ...state,
        isMobile: action.isMobile,
      };
    }

    case 'TICK': {
      if (state.phase !== GamePhase.Playing) return state;

      const modifiers = getAscensionModifiers(state.run.ascensionLevel);

      // A2: Countdown timer mode
      if (modifiers.timerCountdown !== null) {
        const newTime = state.time - 1;
        if (newTime <= 0) {
          // Time's up - explode!
          return {
            ...state,
            time: 0,
            phase: GamePhase.Exploding,
            explodedCell: null, // No specific cell exploded
          };
        }
        return {
          ...state,
          time: newTime,
        };
      }

      // Normal count-up timer
      return {
        ...state,
        time: Math.min(state.time + 1, 999),
      };
    }

    case 'REVEAL_CELL': {
      if (state.phase !== GamePhase.Playing) return state;

      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.state !== CellState.Hidden) return state;

      let newBoard = state.board;
      let newRun = { ...state.run };
      let newPhase: GamePhase = state.phase;
      let newDraftOptions: PowerUp[] = [];
      let newDangerCells = state.dangerCells;
      let newZeroCellCount: number | null = state.zeroCellCount;
      let newCellsRevealedThisFloor = state.cellsRevealedThisFloor;

      // Handle first click - place mines after
      if (state.isFirstClick) {
        const config = state.floorConfig;
        const hasCautiousStart = hasPowerUp(state.run, 'cautious-start');
        const hasBreathingRoom = hasPowerUp(state.run, 'breathing-room');
        const modifiers = getAscensionModifiers(state.run.ascensionLevel);

        if (hasCautiousStart || hasBreathingRoom || modifiers.toroidal) {
          newBoard = placeMinesWithConstraints(createEmptyBoard(config), config, row, col, {
            cautiousStart: hasCautiousStart,
            breathingRoom: hasBreathingRoom,
            toroidal: modifiers.toroidal,
          });
        } else {
          newBoard = placeMines(createEmptyBoard(config), config, row, col);
        }

        // Apply Sixth Sense on first click
        if (hasPowerUp(state.run, 'sixth-sense')) {
          newBoard = applySixthSense(newBoard, row, col);
        } else {
          newBoard = revealCell(newBoard, row, col);
        }

        // Apply Lucky Start after mines are placed (if not used yet this floor)
        if (hasPowerUp(state.run, 'lucky-start') && !state.run.luckyStartUsedThisFloor) {
          newBoard = applyLuckyStart(newBoard);
          newRun.luckyStartUsedThisFloor = true;
        }

        // Apply Edge Walker after mines are placed
        if (hasPowerUp(state.run, 'edge-walker')) {
          newBoard = applyEdgeWalker(newBoard);
        }

        // Calculate danger cells if player has Danger Sense
        if (hasPowerUp(state.run, 'danger-sense')) {
          newDangerCells = calculateDangerCells(newBoard);
        }

        // Calculate zero-cell count for Floor Scout
        if (hasPowerUp(state.run, 'floor-scout')) {
          newZeroCellCount = countZeroCells(newBoard);
        }

        // Calculate score for revealed cells
        const cellsRevealed = countRevealedCells(newBoard);
        newRun.score += calculateRevealScore(cellsRevealed, newRun.currentFloor);
        newCellsRevealedThisFloor = cellsRevealed;
      } else {
        // Normal reveal
        const prevRevealed = countRevealedCells(state.board);

        // If momentum is active and this cell is a mine, protect the player
        const targetCell = state.board[row][col];
        if (state.run.momentumActive && targetCell.isMine) {
          // Momentum saves from mine - flag it instead of revealing
          newBoard = state.board.map((r) =>
            r.map((c) =>
              c.row === row && c.col === col ? { ...c, state: CellState.Flagged } : c
            )
          );
          newRun.momentumActive = false; // Momentum used up
        } else {
          newBoard = revealCell(state.board, row, col);
        }

        const newRevealed = countRevealedCells(newBoard);
        const cascadeSize = newRevealed - prevRevealed;
        newRun.score += calculateRevealScore(cascadeSize, newRun.currentFloor);
        newCellsRevealedThisFloor += cascadeSize;

        // Check if momentum should activate (cascade of 5+ cells)
        if (hasPowerUp(state.run, 'momentum') && cascadeSize >= 5 && !newRun.momentumActive) {
          newRun.momentumActive = true;
        }
      }

      // Check for mine hit
      let closeCallCell: { row: number; col: number } | null = null;
      let savedByIronWill = false;
      if (newBoard[row][col].isMine) {
        const protection = applyIronWillProtection(newBoard, newRun, row, col);
        if (protection.saved) {
          newBoard = protection.board;
          newRun = protection.run;
          closeCallCell = protection.savedCell;
          savedByIronWill = true;
        } else {
          // Game over - start explosion animation
          return {
            ...state,
            board: newBoard,
            isFirstClick: false,
            phase: GamePhase.Exploding,
            run: newRun,
            explodedCell: { row, col },
            minesRemaining: state.floorConfig.mines - countFlags(newBoard),
          };
        }
      } else if (checkFloorCleared(newBoard)) {
        const clearResult = handleFloorClearTransition(newRun, state.time);
        newRun.score = clearResult.score;
        newPhase = clearResult.phase;
        newDraftOptions = clearResult.draftOptions;
      }

      // A4: Track reveal times for newly revealed cells (for amnesia)
      const modifiersForAmnesia = getAscensionModifiers(state.run.ascensionLevel);
      let newCellRevealTimes = state.cellRevealTimes;
      if (modifiersForAmnesia.amnesiaSeconds !== null) {
        const now = Date.now();
        newCellRevealTimes = new Map(state.cellRevealTimes);
        // Find all newly revealed cells (cells that are revealed in newBoard but weren't before)
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[r].length; c++) {
            const key = `${r},${c}`;
            const wasRevealed = state.board[r]?.[c]?.state === CellState.Revealed;
            const isNowRevealed = newBoard[r][c].state === CellState.Revealed;
            const hasNumber = newBoard[r][c].adjacentMines > 0 && !newBoard[r][c].isMine;
            if (isNowRevealed && !wasRevealed && hasNumber && !newCellRevealTimes.has(key)) {
              newCellRevealTimes.set(key, now);
            }
          }
        }
      }

      // Pattern Memory: check for newly revealed 3+ cells
      let newPatternMemoryCells = state.patternMemoryCells;
      if (hasPowerUp(state.run, 'pattern-memory')) {
        // Find all cells that were just revealed with 3+ adjacent mines
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[r].length; c++) {
            const wasHidden = state.board[r]?.[c]?.state !== CellState.Revealed;
            const isNowRevealed = newBoard[r][c].state === CellState.Revealed;
            const has3Plus = newBoard[r][c].adjacentMines >= 3;

            if (wasHidden && isNowRevealed && has3Plus && !newBoard[r][c].isMine) {
              const safeCell = calculatePatternMemoryCell(newBoard, r, c);
              if (safeCell && !newPatternMemoryCells.has(safeCell)) {
                newPatternMemoryCells = new Set([...newPatternMemoryCells, safeCell]);
              }
            }
          }
        }
      }

      // Oracle's Gift: recalculate 50/50 safe cells
      const newOracleGiftCells = calculateOracleGiftCells(newBoard, newRun);

      return {
        ...state,
        board: newBoard,
        isFirstClick: false,
        phase: savedByIronWill ? GamePhase.IronWillSave : newPhase,
        run: newRun,
        draftOptions: newDraftOptions,
        dangerCells: newDangerCells,
        minesRemaining: state.floorConfig.mines - countFlags(newBoard),
        closeCallCell,
        zeroCellCount: newZeroCellCount,
        cellsRevealedThisFloor: newCellsRevealedThisFloor,
        cellRevealTimes: newCellRevealTimes,
        patternMemoryCells: newPatternMemoryCells,
        oracleGiftCells: newOracleGiftCells,
      };
    }

    case 'TOGGLE_FLAG': {
      if (state.phase !== GamePhase.Playing) return state;
      if (state.isFirstClick) return state; // Can't flag before first click

      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.state === CellState.Revealed) return state;

      const newBoard = toggleFlag(state.board, row, col);

      // Clear momentum on flag (as per design)
      const newRun = hasPowerUp(state.run, 'momentum') && state.run.momentumActive
        ? { ...state.run, momentumActive: false }
        : state.run;

      // Oracle's Gift: recalculate 50/50 safe cells (flagging can change the situation)
      const flagOracleGiftCells = calculateOracleGiftCells(newBoard, newRun);

      return {
        ...state,
        board: newBoard,
        run: newRun,
        minesRemaining: state.floorConfig.mines - countFlags(newBoard),
        oracleGiftCells: flagOracleGiftCells,
      };
    }

    case 'CHORD_CLICK': {
      if (state.phase !== GamePhase.Playing) return state;

      const { row, col } = action;
      const { board: newBoard, hitMine } = chordReveal(state.board, row, col);

      let newPhase: GamePhase = state.phase;
      let newRun = { ...state.run };
      let finalBoard = newBoard;
      let newDraftOptions: PowerUp[] = [];

      // Calculate score for revealed cells
      const prevRevealed = countRevealedCells(state.board);
      const newRevealed = countRevealedCells(newBoard);
      const cascadeSize = newRevealed - prevRevealed;
      newRun.score += calculateRevealScore(cascadeSize, newRun.currentFloor);

      // Check if momentum should activate (cascade of 5+ cells)
      if (hasPowerUp(state.run, 'momentum') && cascadeSize >= 5 && !newRun.momentumActive) {
        newRun.momentumActive = true;
      }

      let closeCallCell: { row: number; col: number } | null = null;
      let chordSavedByIronWill = false;
      if (hitMine) {
        // Find which mine was hit for the animation
        let hitRow = row,
          hitCol = col;
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (newBoard[r][c].isMine && newBoard[r][c].state === CellState.Revealed) {
              hitRow = r;
              hitCol = c;
              break;
            }
          }
          if (hitRow !== row || hitCol !== col) break;
        }

        const protection = applyIronWillProtection(newBoard, newRun, hitRow, hitCol, { row, col });
        if (protection.saved) {
          finalBoard = protection.board;
          newRun = protection.run;
          closeCallCell = protection.savedCell;
          chordSavedByIronWill = true;
        } else {
          return {
            ...state,
            board: newBoard,
            phase: GamePhase.Exploding,
            run: newRun,
            explodedCell: { row: hitRow, col: hitCol },
            minesRemaining: state.floorConfig.mines - countFlags(newBoard),
          };
        }
      } else if (checkFloorCleared(newBoard)) {
        const clearResult = handleFloorClearTransition(newRun, state.time);
        newRun.score = clearResult.score;
        newPhase = clearResult.phase;
        newDraftOptions = clearResult.draftOptions;
      }

      // Pattern Memory: check for newly revealed 3+ cells
      let newPatternMemoryCells = state.patternMemoryCells;
      if (hasPowerUp(state.run, 'pattern-memory')) {
        // Find all cells that were just revealed with 3+ adjacent mines
        for (let r = 0; r < finalBoard.length; r++) {
          for (let c = 0; c < finalBoard[r].length; c++) {
            const wasHidden = state.board[r]?.[c]?.state !== CellState.Revealed;
            const isNowRevealed = finalBoard[r][c].state === CellState.Revealed;
            const has3Plus = finalBoard[r][c].adjacentMines >= 3;

            if (wasHidden && isNowRevealed && has3Plus && !finalBoard[r][c].isMine) {
              const safeCell = calculatePatternMemoryCell(finalBoard, r, c);
              if (safeCell && !newPatternMemoryCells.has(safeCell)) {
                newPatternMemoryCells = new Set([...newPatternMemoryCells, safeCell]);
              }
            }
          }
        }
      }

      // Oracle's Gift: recalculate 50/50 safe cells
      const chordOracleGiftCells = calculateOracleGiftCells(finalBoard, newRun);

      return {
        ...state,
        board: finalBoard,
        phase: chordSavedByIronWill ? GamePhase.IronWillSave : newPhase,
        run: newRun,
        draftOptions: newDraftOptions,
        minesRemaining: state.floorConfig.mines - countFlags(finalBoard),
        closeCallCell,
        patternMemoryCells: newPatternMemoryCells,
        oracleGiftCells: chordOracleGiftCells,
      };
    }

    case 'USE_X_RAY': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'x-ray-vision')) return state;
      if (state.run.xRayUsedThisFloor) return state;
      if (state.isFirstClick) return state; // Can't use before mines are placed

      const { row, col } = action;
      const prevRevealed = countRevealedCells(state.board);
      const newBoard = applyXRayVision(state.board, row, col);
      const newRevealed = countRevealedCells(newBoard);

      const newRun = {
        ...state.run,
        xRayUsedThisFloor: true,
        momentumActive: false, // Using ability clears momentum
        score:
          state.run.score +
          calculateRevealScore(newRevealed - prevRevealed, state.run.currentFloor),
      };

      let newPhase: GamePhase = state.phase;
      let newDraftOptions: PowerUp[] = [];

      if (checkFloorCleared(newBoard)) {
        const clearResult = handleFloorClearTransition(newRun, state.time);
        newRun.score = clearResult.score;
        newPhase = clearResult.phase;
        newDraftOptions = clearResult.draftOptions;
      }

      return {
        ...state,
        board: newBoard,
        run: newRun,
        phase: newPhase,
        draftOptions: newDraftOptions,
        minesRemaining: state.floorConfig.mines - countFlags(newBoard),
      };
    }

    case 'SELECT_POWER_UP': {
      if (state.phase !== GamePhase.Draft) return state;

      const newPowerUps = [...state.run.activePowerUps, action.powerUp];
      const hasHeatMap = newPowerUps.some((p) => p.id === 'heat-map');
      const hasOraclesGift = newPowerUps.some((p) => p.id === 'oracles-gift');
      const modifiers = getAscensionModifiers(state.run.ascensionLevel);

      // Set up next floor (with Oracle's Gift density bonus and trauma stacks if applicable)
      const nextFloor = state.run.currentFloor + 1;
      const extraDensity = hasOraclesGift ? ORACLES_GIFT_MINE_DENSITY_BONUS : 0;
      const floorConfig = getFloorConfig(nextFloor, state.isMobile, state.run.ascensionLevel, extraDensity, state.run.traumaStacks);
      const newBoard = createEmptyBoard(floorConfig);

      // A2: Initialize countdown timer if applicable
      const initialTime = modifiers.timerCountdown ?? 0;

      return {
        ...state,
        phase: GamePhase.Playing,
        board: newBoard,
        floorConfig,
        minesRemaining: floorConfig.mines,
        time: initialTime,
        isFirstClick: true,
        run: {
          ...state.run,
          activePowerUps: newPowerUps,
          currentFloor: nextFloor,
          ironWillUsedThisFloor: false, // Reset shield for new floor
          xRayUsedThisFloor: false,
          luckyStartUsedThisFloor: false,
          momentumActive: false,
          peekUsedThisFloor: false,
          safePathUsedThisFloor: false,
          defusalKitUsedThisFloor: false,
          surveyUsedThisFloor: false,
          probabilityLensUsedThisFloor: false,
          mineDetectorScansRemaining: 3,
        },
        draftOptions: [],
        dangerCells: new Set(),
        patternMemoryCells: new Set(),
        zeroCellCount: null,
        peekCell: null,
        surveyResult: null,
        heatMapEnabled: hasHeatMap,
        cellsRevealedThisFloor: 0,
        probabilityLensCells: new Set(),
        oracleGiftCells: new Set(),
        mineDetectorScannedCells: new Set(),
        mineDetectorResult: null,
      };
    }

    case 'SKIP_DRAFT': {
      if (state.phase !== GamePhase.Draft) return state;

      const modifiers = getAscensionModifiers(state.run.ascensionLevel);
      const hasOraclesGiftSkip = hasPowerUp(state.run, 'oracles-gift');

      // Set up next floor with bonus points (with Oracle's Gift density bonus and trauma stacks if applicable)
      const nextFloor = state.run.currentFloor + 1;
      const extraDensitySkip = hasOraclesGiftSkip ? ORACLES_GIFT_MINE_DENSITY_BONUS : 0;
      const floorConfig = getFloorConfig(nextFloor, state.isMobile, state.run.ascensionLevel, extraDensitySkip, state.run.traumaStacks);
      const newBoard = createEmptyBoard(floorConfig);

      // A2: Initialize countdown timer if applicable
      const initialTime = modifiers.timerCountdown ?? 0;

      return {
        ...state,
        phase: GamePhase.Playing,
        board: newBoard,
        floorConfig,
        minesRemaining: floorConfig.mines,
        time: initialTime,
        isFirstClick: true,
        run: {
          ...state.run,
          currentFloor: nextFloor,
          score: state.run.score + action.bonusPoints,
          ironWillUsedThisFloor: false, // Reset shield for new floor
          xRayUsedThisFloor: false,
          luckyStartUsedThisFloor: false,
          momentumActive: false,
          peekUsedThisFloor: false,
          safePathUsedThisFloor: false,
          defusalKitUsedThisFloor: false,
          surveyUsedThisFloor: false,
          probabilityLensUsedThisFloor: false,
          mineDetectorScansRemaining: 3,
        },
        draftOptions: [],
        dangerCells: new Set(),
        patternMemoryCells: new Set(),
        zeroCellCount: null,
        peekCell: null,
        surveyResult: null,
        heatMapEnabled: hasPowerUp(state.run, 'heat-map'),
        cellsRevealedThisFloor: 0,
        probabilityLensCells: new Set(),
        oracleGiftCells: new Set(),
        mineDetectorScannedCells: new Set(),
        mineDetectorResult: null,
      };
    }

    case 'USE_PEEK': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'peek')) return state;
      if (state.run.peekUsedThisFloor) return state;
      if (state.isFirstClick) return state; // Can't peek before mines are placed

      const { row, col } = action;
      const cell = state.board[row][col];

      // Can only peek hidden cells
      if (cell.state !== CellState.Hidden) return state;

      const peekValue = cell.isMine ? 'mine' : cell.adjacentMines;

      return {
        ...state,
        peekCell: { row, col, value: peekValue },
        run: {
          ...state.run,
          peekUsedThisFloor: true,
          momentumActive: false, // Using ability clears momentum
        },
      };
    }

    case 'CLEAR_PEEK': {
      if (!state.peekCell) return state;
      return {
        ...state,
        peekCell: null,
      };
    }

    case 'USE_SAFE_PATH': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'safe-path')) return state;
      if (state.run.safePathUsedThisFloor) return state;
      if (state.isFirstClick) return state;

      const { direction, index } = action;
      const prevRevealed = countRevealedCells(state.board);
      const newBoard = applySafePath(state.board, direction, index);
      const newRevealed = countRevealedCells(newBoard);

      const newRun = {
        ...state.run,
        safePathUsedThisFloor: true,
        momentumActive: false,
        score: state.run.score + calculateRevealScore(newRevealed - prevRevealed, state.run.currentFloor),
      };

      let newPhase: GamePhase = state.phase;
      let newDraftOptions: PowerUp[] = [];

      if (checkFloorCleared(newBoard)) {
        const clearResult = handleFloorClearTransition(newRun, state.time);
        newRun.score = clearResult.score;
        newPhase = clearResult.phase;
        newDraftOptions = clearResult.draftOptions;
      }

      return {
        ...state,
        board: newBoard,
        run: newRun,
        phase: newPhase,
        draftOptions: newDraftOptions,
        minesRemaining: state.floorConfig.mines - countFlags(newBoard),
      };
    }

    case 'USE_SURVEY': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'survey')) return state;
      if (state.run.surveyUsedThisFloor) return state;
      if (state.isFirstClick) return state;

      const { direction, index } = action;
      const mineCount = calculateLineMineCount(state.board, direction, index);

      return {
        ...state,
        run: {
          ...state.run,
          surveyUsedThisFloor: true,
          momentumActive: false,
        },
        surveyResult: { direction, index, mineCount },
      };
    }

    case 'USE_DEFUSAL_KIT': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'defusal-kit')) return state;
      if (state.run.defusalKitUsedThisFloor) return state;

      const { row, col } = action;
      const { board: newBoard, success } = applyDefusalKit(state.board, row, col);

      if (!success) {
        // Wasted the charge on incorrect flag
        return {
          ...state,
          run: {
            ...state.run,
            defusalKitUsedThisFloor: true,
            momentumActive: false,
          },
        };
      }

      const newRun = {
        ...state.run,
        defusalKitUsedThisFloor: true,
        momentumActive: false,
      };

      let newPhase: GamePhase = state.phase;
      let newDraftOptions: PowerUp[] = [];

      if (checkFloorCleared(newBoard)) {
        const clearResult = handleFloorClearTransition(newRun, state.time);
        newRun.score = clearResult.score;
        newPhase = clearResult.phase;
        newDraftOptions = clearResult.draftOptions;
      }

      return {
        ...state,
        board: newBoard,
        run: newRun,
        phase: newPhase,
        draftOptions: newDraftOptions,
        floorConfig: {
          ...state.floorConfig,
          mines: state.floorConfig.mines - 1,
        },
        minesRemaining: state.floorConfig.mines - 1 - countFlags(newBoard),
      };
    }

    case 'EXPLOSION_COMPLETE': {
      if (state.phase !== GamePhase.Exploding) return state;

      // Check if Quick Recovery applies (died before revealing 10 cells, not used this run)
      const canUseQuickRecovery =
        hasPowerUp(state.run, 'quick-recovery') &&
        !state.run.quickRecoveryUsedThisRun &&
        state.cellsRevealedThisFloor < 10;

      if (canUseQuickRecovery) {
        // Restart the current floor (with Oracle's Gift density bonus and trauma stacks if applicable)
        const modifiers = getAscensionModifiers(state.run.ascensionLevel);
        const hasOraclesGiftRecovery = hasPowerUp(state.run, 'oracles-gift');
        const extraDensityRecovery = hasOraclesGiftRecovery ? ORACLES_GIFT_MINE_DENSITY_BONUS : 0;
        const floorConfig = getFloorConfig(state.run.currentFloor, state.isMobile, state.run.ascensionLevel, extraDensityRecovery, state.run.traumaStacks);
        const newBoard = createEmptyBoard(floorConfig);

        // A2: Reset countdown timer if applicable
        const initialTime = modifiers.timerCountdown ?? 0;

        return {
          ...state,
          phase: GamePhase.Playing,
          board: newBoard,
          floorConfig,
          minesRemaining: floorConfig.mines,
          time: initialTime,
          isFirstClick: true,
          explodedCell: null,
          dangerCells: new Set(),
          patternMemoryCells: new Set(),
          zeroCellCount: null,
          cellsRevealedThisFloor: 0,
          probabilityLensCells: new Set(),
          oracleGiftCells: new Set(),
          mineDetectorScannedCells: new Set(),
          mineDetectorResult: null,
          run: {
            ...state.run,
            quickRecoveryUsedThisRun: true,
            ironWillUsedThisFloor: false, // Reset shield for floor restart
            xRayUsedThisFloor: false,
            luckyStartUsedThisFloor: false,
            momentumActive: false,
            peekUsedThisFloor: false,
            safePathUsedThisFloor: false,
            defusalKitUsedThisFloor: false,
            surveyUsedThisFloor: false,
            probabilityLensUsedThisFloor: false,
            mineDetectorScansRemaining: 3,
          },
        };
      }

      // Reveal all mines and transition to run-over
      const finalBoard = revealAllMines(state.board);

      return {
        ...state,
        board: finalBoard,
        phase: GamePhase.RunOver,
        explodedCell: null,
      };
    }

    case 'FLOOR_CLEAR_COMPLETE': {
      if (state.phase !== GamePhase.FloorClear) return state;

      // Check if this was the final floor
      if (isFinalFloor(state.run.currentFloor)) {
        return {
          ...state,
          phase: GamePhase.Victory,
        };
      }

      // Move to draft phase
      return {
        ...state,
        phase: GamePhase.Draft,
      };
    }

    case 'IRON_WILL_COMPLETE': {
      if (state.phase !== GamePhase.IronWillSave) return state;
      return {
        ...state,
        phase: GamePhase.Playing,
        closeCallCell: null,
      };
    }

    case 'SET_CHORD_HIGHLIGHT': {
      if (state.phase !== GamePhase.Playing) return state;
      const chordHighlightCells = calculateChordHighlightCells(
        state.board,
        action.row,
        action.col
      );
      return {
        ...state,
        chordHighlightCells,
      };
    }

    case 'CLEAR_CHORD_HIGHLIGHT': {
      if (state.chordHighlightCells.size === 0) return state;
      return {
        ...state,
        chordHighlightCells: new Set(),
      };
    }

    case 'UPDATE_FADED_CELLS': {
      // A4: Check which cells have been revealed for longer than amnesiaSeconds
      const modifiers = getAscensionModifiers(state.run.ascensionLevel);
      if (modifiers.amnesiaSeconds === null) return state;
      if (state.phase !== GamePhase.Playing) return state;

      const now = Date.now();
      const fadeThreshold = modifiers.amnesiaSeconds * 1000;
      const newFadedCells = new Set<string>();

      for (const [key, revealTime] of state.cellRevealTimes) {
        if (now - revealTime >= fadeThreshold) {
          newFadedCells.add(key);
        }
      }

      // Only update if there are changes
      if (newFadedCells.size === state.fadedCells.size) {
        // Quick check - sizes are same, might be identical
        let same = true;
        for (const key of newFadedCells) {
          if (!state.fadedCells.has(key)) {
            same = false;
            break;
          }
        }
        if (same) return state;
      }

      return {
        ...state,
        fadedCells: newFadedCells,
      };
    }

    case 'USE_PROBABILITY_LENS': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'probability-lens')) return state;
      if (state.run.probabilityLensUsedThisFloor) return state;
      if (state.isFirstClick) return state; // Can't use before mines are placed

      const safestCells = calculateSafestCells(state.board);

      return {
        ...state,
        probabilityLensCells: safestCells,
        run: {
          ...state.run,
          probabilityLensUsedThisFloor: true,
          momentumActive: false, // Using ability clears momentum
        },
      };
    }

    case 'CLEAR_PROBABILITY_LENS': {
      if (state.probabilityLensCells.size === 0) return state;
      return {
        ...state,
        probabilityLensCells: new Set(),
      };
    }

    case 'USE_MINE_DETECTOR': {
      if (state.phase !== GamePhase.Playing) return state;
      if (!hasPowerUp(state.run, 'mine-detector')) return state;
      if (state.run.mineDetectorScansRemaining <= 0) return state;
      if (state.isFirstClick) return state;

      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.state !== CellState.Hidden) return state;

      // No-repeat rule: if cell already scanned, do nothing
      const cellKey = `${row},${col}`;
      if (state.mineDetectorScannedCells.has(cellKey)) return state;

      const count = calculateMineCount4x4(state.board, row, col);
      const newScannedCells = new Set(state.mineDetectorScannedCells);
      newScannedCells.add(cellKey);

      return {
        ...state,
        mineDetectorScannedCells: newScannedCells,
        mineDetectorResult: { row, col, count },
        run: {
          ...state.run,
          mineDetectorScansRemaining: state.run.mineDetectorScansRemaining - 1,
          momentumActive: false, // Using ability clears momentum
        },
      };
    }

    case 'CLEAR_MINE_DETECTOR_RESULT': {
      if (!state.mineDetectorResult) return state;
      return {
        ...state,
        mineDetectorResult: null,
      };
    }

    default:
      return state;
  }
}

export function useRoguelikeState(isMobile: boolean = false) {
  const [state, dispatch] = useReducer(
    roguelikeReducer,
    { isMobile },
    (init) => loadGameState() ?? createRoguelikeInitialState(init.isMobile)
  );

  // Handle mobile state changes
  useEffect(() => {
    if (state.isMobile !== isMobile) {
      dispatch({ type: 'SET_MOBILE', isMobile });
    }
  }, [isMobile, state.isMobile]);

  // Save state to localStorage during active gameplay
  useEffect(() => {
    if (
      state.phase === GamePhase.Playing ||
      state.phase === GamePhase.Draft ||
      state.phase === GamePhase.FloorClear
    ) {
      saveGameState(state);
    } else if (
      state.phase === GamePhase.Start ||
      state.phase === GamePhase.RunOver ||
      state.phase === GamePhase.Victory
    ) {
      // Clear saved state when not in active gameplay
      clearGameState();
    }
  }, [state]);

  // Timer effect
  useEffect(() => {
    if (state.phase !== GamePhase.Playing) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // A4: Amnesia effect - check for faded cells every 500ms
  useEffect(() => {
    const modifiers = getAscensionModifiers(state.run.ascensionLevel);
    if (modifiers.amnesiaSeconds === null) return;
    if (state.phase !== GamePhase.Playing) return;

    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_FADED_CELLS' });
    }, 500);

    return () => clearInterval(interval);
  }, [state.phase, state.run.ascensionLevel]);

  const startRun = useCallback(
    (ascensionLevel: AscensionLevel = 0) => {
      dispatch({ type: 'START_RUN', isMobile, ascensionLevel });
    },
    [isMobile]
  );

  const goToStart = useCallback(() => {
    dispatch({ type: 'GO_TO_START' });
  }, []);

  const revealCellAction = useCallback((row: number, col: number) => {
    dispatch({ type: 'REVEAL_CELL', row, col });
  }, []);

  const toggleFlagAction = useCallback((row: number, col: number) => {
    dispatch({ type: 'TOGGLE_FLAG', row, col });
  }, []);

  const chordClick = useCallback((row: number, col: number) => {
    dispatch({ type: 'CHORD_CLICK', row, col });
  }, []);

  const useXRay = useCallback((row: number, col: number) => {
    dispatch({ type: 'USE_X_RAY', row, col });
  }, []);

  const selectPowerUp = useCallback((powerUp: PowerUp) => {
    dispatch({ type: 'SELECT_POWER_UP', powerUp });
  }, []);

  const skipDraft = useCallback((bonusPoints: number) => {
    dispatch({ type: 'SKIP_DRAFT', bonusPoints });
  }, []);

  const explosionComplete = useCallback(() => {
    dispatch({ type: 'EXPLOSION_COMPLETE' });
  }, []);

  const floorClearComplete = useCallback(() => {
    dispatch({ type: 'FLOOR_CLEAR_COMPLETE' });
  }, []);

  const ironWillComplete = useCallback(() => {
    dispatch({ type: 'IRON_WILL_COMPLETE' });
  }, []);

  const setChordHighlight = useCallback((row: number, col: number) => {
    dispatch({ type: 'SET_CHORD_HIGHLIGHT', row, col });
  }, []);

  const clearChordHighlight = useCallback(() => {
    dispatch({ type: 'CLEAR_CHORD_HIGHLIGHT' });
  }, []);

  const usePeek = useCallback((row: number, col: number) => {
    dispatch({ type: 'USE_PEEK', row, col });
  }, []);

  const clearPeek = useCallback(() => {
    dispatch({ type: 'CLEAR_PEEK' });
  }, []);

  const useSafePath = useCallback((direction: 'row' | 'col', index: number) => {
    dispatch({ type: 'USE_SAFE_PATH', direction, index });
  }, []);

  const useDefusalKit = useCallback((row: number, col: number) => {
    dispatch({ type: 'USE_DEFUSAL_KIT', row, col });
  }, []);

  const useSurvey = useCallback((direction: 'row' | 'col', index: number) => {
    dispatch({ type: 'USE_SURVEY', direction, index });
  }, []);

  const useProbabilityLens = useCallback(() => {
    dispatch({ type: 'USE_PROBABILITY_LENS' });
  }, []);

  const useMineDetector = useCallback((row: number, col: number) => {
    dispatch({ type: 'USE_MINE_DETECTOR', row, col });
  }, []);

  // Auto-clear peek after a short delay
  useEffect(() => {
    if (!state.peekCell) return;

    const timeout = setTimeout(() => {
      dispatch({ type: 'CLEAR_PEEK' });
    }, 2000); // Show peek for 2 seconds

    return () => clearTimeout(timeout);
  }, [state.peekCell]);

  // Auto-clear mine detector result after 3 seconds
  useEffect(() => {
    if (!state.mineDetectorResult) return;

    const timeout = setTimeout(() => {
      dispatch({ type: 'CLEAR_MINE_DETECTOR_RESULT' });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [state.mineDetectorResult]);

  // Note: Probability Lens highlights persist until floor end (no auto-clear timer)
  // This gives players time to act on the strategic guidance

  return {
    state,
    startRun,
    goToStart,
    revealCell: revealCellAction,
    toggleFlag: toggleFlagAction,
    chordClick,
    useXRay,
    usePeek,
    clearPeek,
    useSafePath,
    useDefusalKit,
    useSurvey,
    useProbabilityLens,
    useMineDetector,
    selectPowerUp,
    skipDraft,
    explosionComplete,
    floorClearComplete,
    ironWillComplete,
    setChordHighlight,
    clearChordHighlight,
  };
}
