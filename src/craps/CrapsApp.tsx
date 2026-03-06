import { useCallback, useMemo, useState, useRef } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useWebSocket } from '../shared/hooks/useWebSocket';
import { useCrapsState } from './hooks/useCrapsState';
import type { CrapsClientMessage, CrapsServerMessage } from './types';
import type { ChatMessage } from './components/Chat';
import { WORKER_URL, generateRoomCode } from './constants';
import { CrapsLobby } from './components/CrapsLobby';
import { CrapsGame } from './components/CrapsGame';
import { AuthGate } from '../retro/components/AuthGate';

const CLERK_KEY = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

function getInitialRoomCode(): string | null {
  const pathMatch = window.location.pathname.match(/^\/craps\/([A-Z0-9]{4})$/i);
  if (pathMatch) return pathMatch[1].toUpperCase();
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() ?? null;
}

export default function CrapsApp() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <ErrorBoundary>
        <SignedIn>
          <CrapsAppInner />
        </SignedIn>
        <SignedOut>
          <AuthGate
            brandContent={
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', letterSpacing: '0.25em', marginRight: '-0.25em', textTransform: 'uppercase', color: 'var(--neon-orange)', textShadow: '0 0 30px var(--neon-orange-glow)' }}>
                CRAPS
              </span>
            }
            subtitle="Sign in to join the tables."
            redirectUrl={typeof window !== 'undefined' ? window.location.pathname : '/craps'}
            accentColor="#ff6a00"
          />
        </SignedOut>
      </ErrorBoundary>
    </ClerkProvider>
  );
}

function CrapsAppInner() {
  const { user } = useUser();
  const [state, dispatch] = useCrapsState();
  const initialRoomCode = useMemo(() => getInitialRoomCode(), []);
  const userName = user?.firstName || 'Anonymous';
  const userId = user?.id || '';

  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(initialRoomCode);
  const [pendingMessage, setPendingMessage] = useState<CrapsClientMessage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatIdRef = useRef(0);

  const wsUrl = useMemo(() => {
    if (!activeRoomCode) return null;
    return `${WORKER_URL.replace(/^http/, 'ws')}/api/craps/${activeRoomCode}/ws`;
  }, [activeRoomCode]);

  const handleMessage = useCallback(
    (msg: CrapsServerMessage) => {
      switch (msg.type) {
        case 'sync':
          dispatch({ type: 'SYNC', state: msg.state, playerId: msg.playerId });
          if (msg.state.roomCode) {
            window.history.replaceState({}, '', `/craps/${msg.state.roomCode}`);
          }
          break;
        case 'playerUpdate':
          dispatch({ type: 'PLAYER_UPDATE', players: msg.players });
          break;
        case 'phaseChanged':
          dispatch({ type: 'PHASE_CHANGED', phase: msg.phase, point: msg.point });
          break;
        case 'betPlaced':
          dispatch({ type: 'BET_PLACED', bet: msg.bet, players: msg.players });
          break;
        case 'betRemoved':
          dispatch({ type: 'BET_REMOVED', betId: msg.betId, players: msg.players });
          break;
        case 'diceRolled':
          dispatch({
            type: 'DICE_ROLLED',
            roll: msg.roll,
            resolutions: msg.resolutions,
            players: msg.players,
            bets: msg.bets,
            point: msg.point,
            phase: msg.phase,
            shooterIndex: msg.shooterIndex,
            roundDeadline: msg.roundDeadline,
          });
          break;
        case 'reaction':
          break;
        case 'chatMessage':
          setChatMessages((prev) => {
            const next = [...prev, {
              id: String(++chatIdRef.current),
              playerId: msg.playerId,
              name: msg.name,
              text: msg.text,
              timestamp: msg.timestamp,
            }];
            return next.length > 50 ? next.slice(-50) : next;
          });
          break;
        case 'playerLeft':
          dispatch({ type: 'PLAYER_LEFT', playerId: msg.playerId, players: msg.players, hostId: msg.hostId, shooterIndex: msg.shooterIndex });
          break;
        case 'error':
          dispatch({ type: 'ERROR', message: msg.message });
          break;
        case 'pong':
          break;
      }
    },
    [dispatch],
  );

  const handleStatusChange = useCallback(
    (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
      dispatch({ type: 'CONNECTION_STATUS', status });
    },
    [dispatch],
  );

  const handlePendingMessageSent = useCallback(() => {
    setPendingMessage(null);
  }, []);

  const handleSessionReplaced = useCallback(() => {
    setActiveRoomCode(null);
    dispatch({ type: 'RESET' });
    dispatch({ type: 'ERROR', message: 'This session was opened in another window.' });
    window.history.replaceState({}, '', '/craps');
  }, [dispatch]);

  const userImageUrl = user?.imageUrl;
  const getJoinMessage = useCallback((): CrapsClientMessage | null => {
    const roomCode = state.room?.roomCode ?? initialRoomCode;
    if (roomCode) {
      return { type: 'join', name: userName, userId, avatarUrl: userImageUrl, roomCode };
    }
    return null;
  }, [state.room?.roomCode, initialRoomCode, userName, userId, userImageUrl]);

  const { send, isConnected } = useWebSocket<CrapsClientMessage, CrapsServerMessage>({
    url: wsUrl,
    pendingMessage,
    getJoinMessage,
    onPendingMessageSent: handlePendingMessageSent,
    onMessage: handleMessage,
    onStatusChange: handleStatusChange,
    onReplaced: handleSessionReplaced,
  });

  const handleLeaveRoom = useCallback(() => {
    send({ type: 'leave' });
    setActiveRoomCode(null);
    dispatch({ type: 'RESET' });
    setChatMessages([]);
    window.history.replaceState({}, '', '/craps');
  }, [send, dispatch]);

  const handleLobbyAction = useCallback(
    (msg: CrapsClientMessage) => {
      if (msg.type === 'create') {
        const code = generateRoomCode();
        setPendingMessage(msg);
        setActiveRoomCode(code);
      } else if (msg.type === 'join') {
        if (activeRoomCode === msg.roomCode && isConnected()) {
          send(msg);
        } else {
          setPendingMessage(msg);
          setActiveRoomCode(msg.roomCode);
        }
      } else {
        send(msg);
      }
    },
    [send, isConnected, activeRoomCode],
  );

  if (!state.room) {
    if (initialRoomCode && !state.errorMessage) {
      return null;
    }
    return (
      <CrapsLobby
        onSend={handleLobbyAction}
        initialRoomCode={initialRoomCode}
        connectionStatus={state.connectionStatus}
        errorMessage={state.errorMessage}
        userName={userName}
        userId={userId}
        userImageUrl={user?.imageUrl}
      />
    );
  }

  return (
    <CrapsGame
      room={state.room}
      myPlayerId={state.myPlayerId!}
      connectionStatus={state.connectionStatus}
      lastRoll={state.lastRoll}
      diceAnimating={state.diceAnimating}
      onSend={send}
      onLeave={handleLeaveRoom}
      onClearLastRoll={() => dispatch({ type: 'CLEAR_LAST_ROLL' })}
      onDiceAnimDone={() => dispatch({ type: 'DICE_ANIM_DONE' })}
      chatMessages={chatMessages}
    />
  );
}
