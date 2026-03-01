import { useState } from 'react';
import type { ClientMessage } from '../types';
import styles from './Lobby.module.css';

interface LobbyProps {
  onSend: (msg: ClientMessage) => void;
  initialRoomCode: string | null;
  connectionStatus: string;
  errorMessage: string | null;
}

export function Lobby({ onSend, initialRoomCode, connectionStatus, errorMessage }: LobbyProps) {
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('retro-name') ?? ''; } catch { return ''; }
  });
  const [roomCode, setRoomCode] = useState(initialRoomCode ?? '');
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');

  const isConnecting = connectionStatus === 'connecting';
  const canSubmit = name.trim().length > 0 && !isConnecting;

  const saveName = (n: string) => {
    try { localStorage.setItem('retro-name', n); } catch { /* noop */ }
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    saveName(name.trim());
    onSend({ type: 'create', name: name.trim() });
  };

  const handleJoin = () => {
    if (!canSubmit || roomCode.trim().length !== 4) return;
    saveName(name.trim());
    onSend({ type: 'join', name: name.trim(), roomCode: roomCode.trim().toUpperCase() });
  };

  return (
    <div className={styles.lobby}>
      <span className={styles.brand}>Retro<span className={styles.brandAccent}>Retro</span></span>
      <p className={styles.subtitle}>
        Run team retrospectives in real time. Create a room, invite your team,
        and collaborate with sticky notes, voting, and action items.
      </p>
      <div className={styles.features}>
        <span className={styles.featurePill}>Writing</span>
        <span className={styles.featurePill}>Grouping</span>
        <span className={styles.featurePill}>Voting</span>
        <span className={styles.featurePill}>Discussion</span>
      </div>

      <div className={styles.card}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="retro-name">Your name</label>
          <input
            id="retro-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                mode === 'create' ? handleCreate() : handleJoin();
              }
            }}
          />
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
              <label className={styles.label} htmlFor="retro-room-code">Room code</label>
              <input
                id="retro-room-code"
                className={styles.codeInput}
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                maxLength={4}
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
