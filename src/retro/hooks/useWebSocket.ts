import { useCallback, useEffect, useRef } from 'react';
import type { ClientMessage, ServerMessage } from '../types';

interface UseWebSocketOptions {
  url: string | null;
  onMessage: (msg: ServerMessage) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export function useWebSocket({ url, onMessage, onStatusChange }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const urlRef = useRef(url);
  urlRef.current = url;

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  const connect = useCallback(() => {
    if (!urlRef.current) return;

    onStatusRef.current('connecting');

    const ws = new WebSocket(urlRef.current);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      onStatusRef.current('connected');

      // Start keepalive ping (50s keeps connection alive under Cloudflare's 60s idle timeout)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 50000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      cleanup();
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
  }, []);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }
    cleanup();
    if (wsRef.current) {
      // Prevent reconnect on intentional close
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onclose = null;
      ws.close();
    }
  }, [cleanup]);

  useEffect(() => {
    if (url) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  return { send, disconnect, isConnected };
}
