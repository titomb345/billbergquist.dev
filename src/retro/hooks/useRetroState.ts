import { useReducer } from 'react';
import type { RoomState, RoomSettings, Card, CardGroup, Vote, Participant, ActionItem, Column, RetroPhase } from '../types';

export interface RetroClientState {
  room: RoomState | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  myParticipantId: string | null;
  errorMessage: string | null;
}

export type RetroAction =
  | { type: 'SYNC'; state: RoomState; participantId: string }
  | { type: 'CARD_ADDED'; card: Card }
  | { type: 'CARD_DELETED'; cardId: string }
  | { type: 'CARD_EDITED'; cardId: string; text: string }
  | { type: 'VOTE_UPDATED'; cardId: string; votes: number; participantId: string; action: 'vote' | 'unvote'; primary: boolean; votesRemaining: number }
  | { type: 'PHASE_CHANGED'; phase: RetroPhase; startedAt?: number; endedAt?: number }
  | { type: 'TIMER_UPDATE'; timerEnd: number | null }
  | { type: 'PARTICIPANTS_UPDATE'; participants: Participant[] }
  | { type: 'ACTION_ADDED'; action: ActionItem }

  | { type: 'COLUMNS_UPDATED'; columns: Column[] }
  | { type: 'AUTHORS_REVEALED'; cards: Card[] }
  | { type: 'PRIVACY_CHANGED'; privacyMode: boolean }
  | { type: 'VOTES_RESET'; cards: Card[]; votes: Vote[]; participants: Participant[] }
  | { type: 'GROUPS_UPDATED'; groups: CardGroup[]; cards: Card[]; votes?: Vote[]; participants?: Participant[] }
  | { type: 'SETTINGS_UPDATED'; settings: RoomSettings }
  | { type: 'FOCUS_UPDATED'; focusedItemId: string | null }
  | { type: 'ACTION_DELETED'; actionId: string }
  | { type: 'ACTION_EDITED'; actionId: string; text: string }
  | { type: 'HOST_TRANSFERRED'; newHostId: string; participants: Participant[] }
  | { type: 'ACTIONS_REORDERED'; actionItems: ActionItem[] }
  | { type: 'CONNECTION_STATUS'; status: RetroClientState['connectionStatus'] }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

const initialState: RetroClientState = {
  room: null,
  connectionStatus: 'disconnected',
  myParticipantId: null,
  errorMessage: null,
};

function retroReducer(state: RetroClientState, action: RetroAction): RetroClientState {
  switch (action.type) {
    case 'SYNC':
      return {
        ...state,
        room: action.state,
        myParticipantId: action.participantId,
        errorMessage: null,
      };

    case 'CARD_ADDED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, cards: [...state.room.cards, action.card] },
      };

    case 'CARD_DELETED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          cards: state.room.cards.filter((c) => c.id !== action.cardId),
        },
      };

    case 'CARD_EDITED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          cards: state.room.cards.map((c) =>
            c.id === action.cardId ? { ...c, text: action.text } : c,
          ),
        },
      };

    case 'VOTE_UPDATED': {
      if (!state.room) return state;
      const cards = state.room.cards.map((c) =>
        c.id === action.cardId ? { ...c, votes: action.votes } : c,
      );
      const participants = state.room.participants.map((p) =>
        p.id === action.participantId ? { ...p, votesRemaining: action.votesRemaining } : p,
      );
      let votes = state.room.votes;
      if (action.primary) {
        if (action.action === 'vote') {
          votes = [...votes, { participantId: action.participantId, cardId: action.cardId }];
        } else {
          const idx = votes.findIndex(
            (v) => v.participantId === action.participantId && v.cardId === action.cardId,
          );
          if (idx !== -1) {
            votes = votes.filter((_, i) => i !== idx);
          }
        }
      }
      return {
        ...state,
        room: { ...state.room, cards, participants, votes },
      };
    }

    case 'PHASE_CHANGED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          phase: action.phase,
          timerEnd: null,
          ...(action.startedAt !== undefined && { startedAt: action.startedAt }),
          ...(action.endedAt !== undefined && { endedAt: action.endedAt }),
        },
      };

    case 'TIMER_UPDATE':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, timerEnd: action.timerEnd },
      };

    case 'PARTICIPANTS_UPDATE':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, participants: action.participants },
      };

    case 'ACTION_ADDED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          actionItems: [...state.room.actionItems, action.action],
        },
      };

    case 'COLUMNS_UPDATED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, columns: action.columns },
      };

    case 'AUTHORS_REVEALED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, cards: action.cards },
      };

    case 'PRIVACY_CHANGED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, privacyMode: action.privacyMode },
      };

    case 'VOTES_RESET':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, cards: action.cards, votes: action.votes, participants: action.participants },
      };

    case 'GROUPS_UPDATED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          groups: action.groups,
          cards: action.cards,
          ...(action.votes && { votes: action.votes }),
          ...(action.participants && { participants: action.participants }),
        },
      };

    case 'SETTINGS_UPDATED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, settings: action.settings },
      };

    case 'FOCUS_UPDATED':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, focusedItemId: action.focusedItemId },
      };

    case 'ACTION_DELETED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          actionItems: state.room.actionItems.filter((a) => a.id !== action.actionId),
        },
      };

    case 'ACTION_EDITED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          actionItems: state.room.actionItems.map((a) =>
            a.id === action.actionId ? { ...a, text: action.text } : a,
          ),
        },
      };

    case 'HOST_TRANSFERRED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          hostId: action.newHostId,
          participants: action.participants,
        },
      };

    case 'ACTIONS_REORDERED':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          actionItems: action.actionItems,
        },
      };

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

export function useRetroState() {
  return useReducer(retroReducer, initialState);
}
