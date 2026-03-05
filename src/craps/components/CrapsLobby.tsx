import { useState, useCallback, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import type { CrapsClientMessage } from '../types';
import { MAX_PLAYERS } from '../types';
import styles from './CrapsLobby.module.css';

interface CrapsLobbyProps {
  onSend: (msg: CrapsClientMessage) => void;
  initialRoomCode: string | null;
  connectionStatus: string;
  errorMessage: string | null;
  userName: string;
  userId: string;
  userImageUrl?: string;
}

export function CrapsLobby({ onSend, initialRoomCode, connectionStatus, errorMessage, userName, userId, userImageUrl }: CrapsLobbyProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mode, setMode] = useState<'menu' | 'join'>(initialRoomCode ? 'join' : 'menu');
  const [roomCode, setRoomCode] = useState(initialRoomCode ?? '');

  const handleCreate = useCallback(() => {
    onSend({ type: 'create', name: userName, userId, avatarUrl: userImageUrl });
  }, [onSend, userName, userId, userImageUrl]);

  const handleJoin = useCallback(() => {
    const code = roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) return;
    onSend({ type: 'join', name: userName, userId, avatarUrl: userImageUrl, roomCode: code });
  }, [onSend, roomCode, userName, userId, userImageUrl]);

  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  return (
    <div className={styles.lobby}>
      {/* Decorative dice */}
      <div className={styles.floatingDice} aria-hidden="true">
        <span className={styles.die1}>&#x2684;</span>
        <span className={styles.die2}>&#x2681;</span>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>The table is open</p>
          <h1 className={styles.title}>
            <span className="neon-text-orange">CRAPS</span>
          </h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>Roll the bones with friends. No chips required.</p>
        </div>

        {errorMessage && (
          <div className={styles.error}>{errorMessage}</div>
        )}

        <div className={styles.userInfo}>
          {user?.imageUrl && <img src={user.imageUrl} alt="" className={styles.avatar} />}
          <span className={styles.userName}>{userName}</span>
          <button
            className={styles.signOutBtn}
            onClick={() => signOut({ redirectUrl: '/craps' })}
          >
            Sign out
          </button>
        </div>

        {mode === 'menu' && (
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={handleCreate}>
              Create Room
            </button>
            <button className={styles.secondaryBtn} onClick={() => setMode('join')}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className={styles.joinForm}>
            <label className={styles.label}>Room Code</label>
            <input
              className={styles.input}
              type="text"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={handleJoin}
                disabled={roomCode.trim().length !== 4}
              >
                Join
              </button>
              <button className={styles.secondaryBtn} onClick={() => setMode('menu')}>
                Back
              </button>
            </div>
          </div>
        )}

        <p className={styles.status}>
          {connectionStatus === 'connecting' ? 'Connecting...' : '\u00A0'}
        </p>

        <div className={styles.features}>
          <span className={styles.pill}>Up to {MAX_PLAYERS} players</span>
          <span className={styles.pill}>$1,000 buy-in</span>
          <span className={styles.pill}>Full craps rules</span>
          <span className={styles.pill}>Real-time multiplayer</span>
        </div>
      </div>
    </div>
  );
}
