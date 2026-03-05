import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Player } from '../types';
import { getAvatarColor, getInitials } from '../../retro/utils/avatar';
import styles from './Chat.module.css';

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myPlayerId: string;
  players: Player[];
}

const MAX_LENGTH = 200;

export function Chat({ messages, onSend, myPlayerId, players }: ChatProps) {
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);
  const autoExpandedRef = useRef(false);

  // Auto-scroll on new messages and auto-expand on first message
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      if (!autoExpandedRef.current && messages.length >= 1) {
        autoExpandedRef.current = true;
        requestAnimationFrame(() => setExpanded(true));
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  }, [input, onSend]);

  const unreadCount = expanded ? 0 : messages.length;

  return (
    <div className={styles.chat}>
      <button className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        <span className={styles.toggleLabel}>
          <span>Chat</span>
          {!expanded && unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </span>
        <span className={styles.arrow}>{expanded ? '\u25BC' : '\u25B2'}</span>
      </button>

      <div className={`${styles.collapse} ${expanded ? styles.collapseOpen : ''}`}>
        <div className={styles.collapseInner}>
          <div className={styles.messages} ref={scrollRef}>
            {messages.length === 0 && (
              <p className={styles.empty}>No messages yet</p>
            )}
            {messages.map((msg) => {
              const player = playerMap.get(msg.playerId);
              const avatarUrl = player?.avatarUrl;
              const isMine = msg.playerId === myPlayerId;
              return (
                <div
                  key={msg.id}
                  className={`${styles.message} ${isMine ? styles.messageMine : ''}`}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className={styles.avatar} />
                  ) : (
                    <div
                      className={styles.avatarFallback}
                      style={{ background: getAvatarColor(msg.playerId) }}
                    >
                      {getInitials(msg.name)}
                    </div>
                  )}
                  <div className={styles.msgBody}>
                    <span className={styles.author}>{isMine ? 'You' : msg.name}</span>
                    <span className={styles.text}>{msg.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Type a message..."
              maxLength={MAX_LENGTH}
              autoComplete="off"
            />
            <button className={styles.sendBtn} type="submit" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
