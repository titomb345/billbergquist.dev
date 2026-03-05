import { useReducer } from 'react';
import type { CrapsGameState, Player, Bet, DiceRoll, BetResolution, CrapsPhase } from '../types';

export interface CrapsClientState {
  room: CrapsGameState | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  myPlayerId: string | null;
  errorMessage: string | null;
  lastRoll: { roll: DiceRoll; resolutions: BetResolution[] } | null;
  diceAnimating: boolean;
}

export type CrapsAction =
  | { type: 'SYNC'; state: CrapsGameState; playerId: string }
  | { type: 'PLAYER_UPDATE'; players: Player[] }
  | { type: 'PHASE_CHANGED'; phase: CrapsPhase; point: number | null }
  | { type: 'BET_PLACED'; bet: Bet; players: Player[] }
  | { type: 'BET_REMOVED'; betId: string; players: Player[] }
  | { type: 'DICE_ROLLED'; roll: DiceRoll; resolutions: BetResolution[]; players: Player[]; bets: Bet[]; point: number | null; phase: CrapsPhase; shooterIndex: number }
  | { type: 'CONNECTION_STATUS'; status: CrapsClientState['connectionStatus'] }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_LAST_ROLL' }
  | { type: 'DICE_ANIM_DONE' }
  | { type: 'RESET' };

const initialState: CrapsClientState = {
  room: null,
  connectionStatus: 'disconnected',
  myPlayerId: null,
  errorMessage: null,
  lastRoll: null,
  diceAnimating: false,
};

function crapsReducer(state: CrapsClientState, action: CrapsAction): CrapsClientState {
  switch (action.type) {
    case 'SYNC':
      return {
        ...state,
        room: action.state,
        myPlayerId: action.playerId,
        errorMessage: null,
      };

    case 'PLAYER_UPDATE':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, players: action.players },
      };

    case 'PHASE_CHANGED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, phase: action.phase, point: action.point },
      };

    case 'BET_PLACED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          bets: [...state.room.bets, action.bet],
          players: action.players,
        },
      };

    case 'BET_REMOVED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          bets: state.room.bets.filter((b) => b.id !== action.betId),
          players: action.players,
        },
      };

    case 'DICE_ROLLED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          rollHistory: [...state.room.rollHistory, action.roll],
          players: action.players,
          bets: action.bets,
          point: action.point,
          phase: action.phase,
          shooterIndex: action.shooterIndex,
        },
        lastRoll: { roll: action.roll, resolutions: action.resolutions },
        diceAnimating: true,
      };

    case 'DICE_ANIM_DONE':
      return { ...state, diceAnimating: false };

    case 'CLEAR_LAST_ROLL':
      return { ...state, lastRoll: null };

    case 'CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status };

    case 'ERROR':
      return { ...state, errorMessage: action.message };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useCrapsState() {
  return useReducer(crapsReducer, initialState);
}
