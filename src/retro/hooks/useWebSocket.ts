import { useCallback, useEffect, useRef } from 'react';
import type { ClientMessage, ServerMessage } from '../types';

interface UseWebSocketOptions {
  url: string | null;
  pendingMessage: ClientMessage | null;
  getJoinMessage?: () => ClientMessage | null;
  onPendingMessageSent: () => void;
  onMessage: (msg: ServerMessage) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  onReplaced?: () => void;
}

export function useWebSocket({ url, pendingMessage, getJoinMessage, onPendingMessageSent, onMessage, onStatusChange, onReplaced }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const onMessageRef = useRef(onMessage);
  const onStatusRef = useRef(onStatusChange);
  const pendingRef = useRef(pendingMessage);
  const getJoinMessageRef = useRef(getJoinMessage);
  const onPendingSentRef = useRef(onPendingMessageSent);
  const onReplacedRef = useRef(onReplaced);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onStatusRef.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => { pendingRef.current = pendingMessage; }, [pendingMessage]);
  useEffect(() => { getJoinMessageRef.current = getJoinMessage; }, [getJoinMessage]);
  useEffect(() => { onPendingSentRef.current = onPendingMessageSent; }, [onPendingMessageSent]);
  useEffect(() => { onReplacedRef.current = onReplaced; }, [onReplaced]);

  useEffect(() => {
    if (!url) return;

    const clearPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = undefined;
      }
    };

    const connect = () => {
      onStatusRef.current('connecting');

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        onStatusRef.current('connected');

        // Flush pending message on connect, or auto-rejoin on reconnect
        if (pendingRef.current) {
          ws.send(JSON.stringify(pendingRef.current));
          pendingRef.current = null;
          onPendingSentRef.current();
        } else if (getJoinMessageRef.current) {
          const joinMsg = getJoinMessageRef.current();
          if (joinMsg) {
            ws.send(JSON.stringify(joinMsg));
          }
        }

        // Start keepalive ping (50s keeps connection alive under Cloudflare's 60s idle timeout)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 50000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          onMessageRef.current(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        clearPing();

        // Session replaced by another connection — don't reconnect
        if (event.code === 4001) {
          onReplacedRef.current?.();
          return;
        }

        onStatusRef.current('disconnected');

        // Auto-reconnect with exponential backoff
        if (urlRef.current) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 30000);
          reconnectAttemptRef.current++;
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        onStatusRef.current('error');
      };
    };

    // Keep urlRef in sync for reconnection check inside onclose
    const urlRef = { current: url };

    connect();

    return () => {
      urlRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = undefined;
      }
      clearPing();
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [url]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  return { send, isConnected };
}
