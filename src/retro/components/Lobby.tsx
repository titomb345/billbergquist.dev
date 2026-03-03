import { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import type { ClientMessage } from '../types';
import styles from './Lobby.module.css';

interface LobbyProps {
  onSend: (msg: ClientMessage) => void;
  initialRoomCode: string | null;
  connectionStatus: string;
  errorMessage: string | null;
  userName: string;
  userId: string;
  userImageUrl?: string;
}

export function Lobby({
  onSend,
  initialRoomCode,
  connectionStatus,
  errorMessage,
  userName,
  userId,
  userImageUrl,
}: LobbyProps) {
  const { signOut } = useClerk();
  const [roomCode, setRoomCode] = useState(initialRoomCode ?? '');
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');

  const isConnecting = connectionStatus === 'connecting';
  const canSubmit = !isConnecting;

  const handleCreate = () => {
    if (!canSubmit) return;
    onSend({ type: 'create', name: userName, userId });
  };

  const handleJoin = () => {
    if (!canSubmit || roomCode.trim().length !== 4) return;
    onSend({ type: 'join', name: userName, userId, roomCode: roomCode.trim().toUpperCase() });
  };

  return (
    <div className={styles.lobby}>
      <span className={styles.brand}>
        Retro<span className={styles.brandAccent}>Retro</span>
      </span>
      <p className={styles.subtitle}>
        Run team retrospectives in real time. Create a room, invite your team, and collaborate with
        sticky notes, voting, and action items.
      </p>
      <div className={styles.features}>
        <span className={styles.featurePill}>Writing</span>
        <span className={styles.featurePill}>Grouping</span>
        <span className={styles.featurePill}>Voting</span>
        <span className={styles.featurePill}>Discussion</span>
      </div>

      <div className={styles.card}>
        <div className={styles.userInfo}>
          {userImageUrl && (
            <img src={userImageUrl} alt="" className={styles.avatar} width={36} height={36} />
          )}
          <div className={styles.userDetails}>
            <span className={styles.userName}>{userName}</span>
            <button className={styles.signOutBtn} onClick={() => {
              try { localStorage.removeItem('retro-authorized'); } catch { /* noop */ }
              signOut({ redirectUrl: '/retro' });
            }}>
              Sign out
            </button>
          </div>
        </div>

        {mode === 'create' ? (
          <>
            <button className={styles.primaryBtn} onClick={handleCreate} disabled={!canSubmit}>
              {isConnecting ? 'Creating...' : 'Create Room'}
            </button>
            <div className={styles.divider}>or</div>
            <button className={styles.ghostBtn} onClick={() => setMode('join')}>
              Join Existing Room
            </button>
          </>
        ) : (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="retro-room-code">
                Room code
              </label>
              <input
                id="retro-room-code"
                className={styles.codeInput}
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                maxLength={4}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoin();
                }}
              />
            </div>
            <button
              className={styles.primaryBtn}
              onClick={handleJoin}
              disabled={!canSubmit || roomCode.trim().length !== 4}
            >
              {isConnecting ? 'Joining...' : 'Join Room'}
            </button>
            <div className={styles.divider}>or</div>
            <button className={styles.ghostBtn} onClick={() => setMode('create')}>
              Create New Room
            </button>
          </>
        )}

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>
    </div>
  );
}
