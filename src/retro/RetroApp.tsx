import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useClerk, useUser } from '@clerk/clerk-react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import { useRetroState } from './hooks/useRetroState';
import type { ClientMessage, ServerMessage } from './types';
import { WORKER_URL } from './constants';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { AuthGate } from './components/AuthGate';

const CLERK_KEY = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

function getInitialRoomCode(): string | null {
  // Clean URL: /retro/ABCD
  const pathMatch = window.location.pathname.match(/^\/retro\/([A-Z0-9]{4})$/i);
  if (pathMatch) return pathMatch[1].toUpperCase();
  // Legacy fallback: /retro?room=ABCD
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() ?? null;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

const ALLOWED_DOMAIN = 'kasa.com';

export default function RetroApp() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <ErrorBoundary>
        <SignedIn>
          <DomainGuard>
            <RetroAppInner />
          </DomainGuard>
        </SignedIn>
        <SignedOut>
          <AuthGate />
        </SignedOut>
      </ErrorBoundary>
    </ClerkProvider>
  );
}

function DomainGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress ?? '';
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setDenied(true);
    }
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  if (denied) {
    return (
      <AuthGate
        error={`Access is restricted to @${ALLOWED_DOMAIN} accounts.`}
        onBack={() => {
          setDenied(false);
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
  const initialRoomCode = useMemo(getInitialRoomCode, []);
  const userName = user?.firstName || 'Anonymous';

  // Room code drives WebSocket connection. null = not connected.
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(initialRoomCode);

  // Queue a message to send once connected
  const pendingMessageRef = useRef<ClientMessage | null>(null);

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
          dispatch({ type: 'PHASE_CHANGED', phase: msg.phase });
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
        case 'actionToggled':
          dispatch({ type: 'ACTION_TOGGLED', actionId: msg.actionId, completed: msg.completed });
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
        case 'groupsUpdated':
          dispatch({ type: 'GROUPS_UPDATED', groups: msg.groups, cards: msg.cards });
          break;
        case 'settingsUpdated':
          dispatch({ type: 'SETTINGS_UPDATED', settings: msg.settings });
          break;
        case 'focusUpdated':
          dispatch({ type: 'FOCUS_UPDATED', focusedItemId: msg.focusedItemId });
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

      // Send pending message once connected
      if (status === 'connected' && pendingMessageRef.current) {
        const msg = pendingMessageRef.current;
        pendingMessageRef.current = null;
        sendRef.current(msg);
      }
    },
    [dispatch],
  );

  const { send, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onStatusChange: handleStatusChange,
  });

  const sendRef = useRef(send);
  sendRef.current = send;

  const handleLobbyAction = useCallback(
    (msg: ClientMessage) => {
      if (msg.type === 'create') {
        const code = generateRoomCode();
        pendingMessageRef.current = msg;
        setActiveRoomCode(code);
      } else if (msg.type === 'join') {
        if (activeRoomCode === msg.roomCode && isConnected()) {
          // Already connected to this room, send directly
          send(msg);
        } else {
          pendingMessageRef.current = msg;
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
    return (
      <Lobby
        onSend={handleLobbyAction}
        initialRoomCode={initialRoomCode}
        connectionStatus={state.connectionStatus}
        errorMessage={state.errorMessage}
        userName={userName}
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
      myAvatarUrl={user?.imageUrl}
      connectionStatus={state.connectionStatus}
      onSend={send}
    />
  );
}
