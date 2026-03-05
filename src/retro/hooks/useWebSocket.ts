import { useWebSocket as useWebSocketGeneric } from '../../shared/hooks/useWebSocket';
import type { ClientMessage, ServerMessage } from '../types';

export function useWebSocket(options: {
  url: string | null;
  pendingMessage: ClientMessage | null;
  getJoinMessage?: () => ClientMessage | null;
  onPendingMessageSent: () => void;
  onMessage: (msg: ServerMessage) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  onReplaced?: () => void;
}) {
  return useWebSocketGeneric<ClientMessage, ServerMessage>(options);
}
