import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useClerk, useUser } from '@clerk/clerk-react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import { useRetroState } from './hooks/useRetroState';
import type { ClientMessage, ServerMessage } from './types';
import { WORKER_URL, generateRoomCode } from './constants';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { AuthGate } from './components/AuthGate';
import { ThemeToggle } from './components/ThemeToggle';
import './retro-theme.css';

const CLERK_KEY = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

function getInitialRoomCode(): string | null {
  // Clean URL: /retro/ABCD
  const pathMatch = window.location.pathname.match(/^\/retro\/([A-Z0-9]{4})$/i);
  if (pathMatch) return pathMatch[1].toUpperCase();
  // Legacy fallback: /retro?room=ABCD
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() ?? null;
}

const ALLOWED_DOMAIN = 'kasa.com';

function useRetroTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('retro-theme') as 'dark' | 'light') ?? 'dark'; } catch { return 'dark'; }
  });

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('retro-theme', next); } catch { /* noop */ }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export default function RetroApp() {
  const { theme, toggle } = useRetroTheme();

  return (
    <div data-retro-theme={theme} className="themeRoot">
      <ClerkProvider publishableKey={CLERK_KEY}>
        <ErrorBoundary>
          <ThemeToggle theme={theme} onToggle={toggle} />
          <SignedIn>
            <DomainGuard>
              <RetroAppInner />
            </DomainGuard>
          </SignedIn>
          <SignedOut>
            <AuthGate subtitle="Sign in with your Kasa Google account to continue." />
          </SignedOut>
        </ErrorBoundary>
      </ClerkProvider>
    </div>
  );
}

function DomainGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const isAllowed = !isLoaded || !user || email.endsWith(`@${ALLOWED_DOMAIN}`);

  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      if (isAllowed) {
        localStorage.setItem('retro-authorized', '1');
      } else {
        localStorage.removeItem('retro-authorized');
      }
    } catch { /* noop */ }
  }, [isLoaded, user, isAllowed]);

  if (!isLoaded) return null;

  if (!isAllowed) {
    return (
      <AuthGate
        error={`Access is restricted to @${ALLOWED_DOMAIN} accounts.`}
        onBack={() => {
          try { localStorage.removeItem('retro-authorized'); } catch { /* noop */ }
          signOut({ redirectUrl: '/retro' });
        }}
      />
    );
  }

  return <>{children}</>;
}

function RetroAppInner() {
  const { user } = useUser();
  const [state, dispatch] = useRetroState();
  const initialRoomCode = useMemo(() => getInitialRoomCode(), []);
  const userName = user?.firstName || 'Anonymous';
  const userId = user?.id || '';

  // Room code drives WebSocket connection. null = not connected.
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(initialRoomCode);

  // Queue a message to send once connected
  const [pendingMessage, setPendingMessage] = useState<ClientMessage | null>(null);

  const wsUrl = useMemo(() => {
    if (!activeRoomCode) return null;
    return `${WORKER_URL.replace(/^http/, 'ws')}/api/rooms/${activeRoomCode}/ws`;
  }, [activeRoomCode]);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'sync':
          dispatch({ type: 'SYNC', state: msg.state, participantId: msg.participantId });
          if (msg.state.roomCode) {
            window.history.replaceState({}, '', `/retro/${msg.state.roomCode}`);
          }
          break;
        case 'cardAdded':
          dispatch({ type: 'CARD_ADDED', card: msg.card });
          break;
        case 'cardDeleted':
          dispatch({ type: 'CARD_DELETED', cardId: msg.cardId });
          break;
        case 'cardEdited':
          dispatch({ type: 'CARD_EDITED', cardId: msg.cardId, text: msg.text });
          break;
        case 'voteUpdated':
          dispatch({
            type: 'VOTE_UPDATED',
            cardId: msg.cardId,
            votes: msg.votes,
            participantId: msg.participantId,
            action: msg.action,
            primary: msg.primary,
            votesRemaining: msg.votesRemaining,
          });
          break;
        case 'phaseChanged':
          dispatch({ type: 'PHASE_CHANGED', phase: msg.phase, startedAt: msg.startedAt, endedAt: msg.endedAt });
          break;
        case 'timerUpdate':
          dispatch({ type: 'TIMER_UPDATE', timerEnd: msg.timerEnd });
          break;
        case 'participantUpdate':
          dispatch({ type: 'PARTICIPANTS_UPDATE', participants: msg.participants });
          break;
        case 'actionAdded':
          dispatch({ type: 'ACTION_ADDED', action: msg.action });
          break;

        case 'columnsUpdated':
          dispatch({ type: 'COLUMNS_UPDATED', columns: msg.columns });
          break;
        case 'authorsRevealed':
          dispatch({ type: 'AUTHORS_REVEALED', cards: msg.cards });
          break;
        case 'privacyChanged':
          dispatch({ type: 'PRIVACY_CHANGED', privacyMode: msg.privacyMode });
          break;
        case 'votesReset':
          dispatch({ type: 'VOTES_RESET', cards: msg.cards, votes: msg.votes, participants: msg.participants });
          break;
        case 'groupsUpdated':
          dispatch({ type: 'GROUPS_UPDATED', groups: msg.groups, cards: msg.cards, votes: msg.votes, participants: msg.participants });
          break;
        case 'settingsUpdated':
          dispatch({ type: 'SETTINGS_UPDATED', settings: msg.settings });
          break;
        case 'focusUpdated':
          dispatch({ type: 'FOCUS_UPDATED', focusedItemId: msg.focusedItemId });
          break;
        case 'actionDeleted':
          dispatch({ type: 'ACTION_DELETED', actionId: msg.actionId });
          break;
        case 'actionEdited':
          dispatch({ type: 'ACTION_EDITED', actionId: msg.actionId, text: msg.text });
          break;
        case 'hostTransferred':
          dispatch({ type: 'HOST_TRANSFERRED', newHostId: msg.newHostId, participants: msg.participants });
          break;
        case 'actionsReordered':
          dispatch({ type: 'ACTIONS_REORDERED', actionItems: msg.actionItems });
          break;
        case 'participantLeft':
          dispatch({ type: 'PARTICIPANT_LEFT', participantId: msg.participantId, participants: msg.participants, hostId: msg.hostId });
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
    window.history.replaceState({}, '', '/retro');
  }, [dispatch]);

  // Auto-rejoin on reconnect or page reload with room code in URL
  const userImageUrl = user?.imageUrl;
  const getJoinMessage = useCallback((): ClientMessage | null => {
    const roomCode = state.room?.roomCode ?? initialRoomCode;
    if (roomCode) {
      return { type: 'join', name: userName, userId, avatarUrl: userImageUrl, roomCode };
    }
    return null;
  }, [state.room?.roomCode, initialRoomCode, userName, userId, userImageUrl]);

  const { send, isConnected } = useWebSocket({
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
    window.history.replaceState({}, '', '/retro');
  }, [send, dispatch]);

  const handleLobbyAction = useCallback(
    (msg: ClientMessage) => {
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

  // Show lobby if no room synced yet
  if (!state.room) {
    // Auto-joining an existing room — show nothing while waiting for sync
    if (initialRoomCode && !state.errorMessage) {
      return null;
    }
    return (
      <Lobby
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

  const me = state.room.participants.find((p) => p.id === state.myParticipantId);
  const isHost = me?.isHost ?? false;

  return (
    <Board
      room={state.room}
      isHost={isHost}
      myParticipantId={state.myParticipantId!}
      connectionStatus={state.connectionStatus}
      onSend={send}
      onLeave={handleLeaveRoom}
    />
  );
}
