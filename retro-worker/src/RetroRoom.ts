import type {
  RoomState,
  RoomSettings,
  RetroPhase,
  Column,
  Card,
  CardGroup,
  Participant,
  ActionItem,
  ClientMessage,
  ServerMessage,
} from './types';
import { generateId, generateRoomCode } from './utils';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', label: 'What went well', color: 'mint' },
  { id: 'col-2', label: "What didn't go well", color: 'magenta' },
  { id: 'col-3', label: 'Improvements', color: 'orange' },
];

const DEFAULT_SETTINGS: RoomSettings = {
  votesPerPerson: 5,
  timerDuration: 300,
};

const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface WebSocketAttachment {
  participantId: string;
  roomCode: string;
}

export class RetroRoom implements DurableObject {
  private state: DurableObjectState;
  private roomCode: string = '';

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const wsMatch = url.pathname.match(/^\/ws\/([A-Z0-9]{4})$/);

    if (wsMatch) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      this.roomCode = wsMatch[1];

      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      // Accept with hibernation API
      this.state.acceptWebSocket(server);

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not Found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    const msgStr = typeof rawMessage === 'string' ? rawMessage : new TextDecoder().decode(rawMessage);

    let msg: ClientMessage;
    try {
      msg = JSON.parse(msgStr);
    } catch {
      this.send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (msg.type === 'ping') {
      this.send(ws, { type: 'pong' });
      return;
    }

    if (msg.type === 'create') {
      await this.handleCreate(ws, msg.name, msg.settings);
      return;
    }

    if (msg.type === 'join') {
      await this.handleJoin(ws, msg.name, msg.roomCode);
      return;
    }

    // All other messages require an active room
    const room = await this.getRoom();
    if (!room) {
      this.send(ws, { type: 'error', message: 'Room not found' });
      return;
    }

    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
    if (!attachment) {
      this.send(ws, { type: 'error', message: 'Not joined' });
      return;
    }

    const participantId = attachment.participantId;

    switch (msg.type) {
      case 'addCard':
        await this.handleAddCard(room, participantId, msg.columnId, msg.text);
        break;
      case 'deleteCard':
        await this.handleDeleteCard(room, participantId, msg.cardId);
        break;
      case 'editCard':
        await this.handleEditCard(room, participantId, msg.cardId, msg.text);
        break;
      case 'vote':
        await this.handleVote(room, participantId, ws, msg.cardId);
        break;
      case 'unvote':
        await this.handleUnvote(room, participantId, ws, msg.cardId);
        break;
      case 'movePhase':
        await this.handleMovePhase(room, participantId, msg.phase);
        break;
      case 'startTimer':
        await this.handleStartTimer(room, participantId, msg.duration);
        break;
      case 'stopTimer':
        await this.handleStopTimer(room, participantId);
        break;
      case 'addAction':
        await this.handleAddAction(room, msg.text, msg.assignee);
        break;
      case 'toggleAction':
        await this.handleToggleAction(room, msg.actionId);
        break;
      case 'updateColumns':
        await this.handleUpdateColumns(room, participantId, msg.columns);
        break;
      case 'revealAuthors':
        await this.handleRevealAuthors(room, participantId);
        break;
      case 'togglePrivacy':
        await this.handleTogglePrivacy(room, participantId);
        break;
      case 'groupCards':
        await this.handleGroupCards(room, msg.cardIds);
        break;
      case 'ungroupCard':
        await this.handleUngroupCard(room, msg.cardId);
        break;
      case 'dissolveGroup':
        await this.handleDissolveGroup(room, msg.groupId);
        break;
      case 'setGroupLabel':
        await this.handleSetGroupLabel(room, msg.groupId, msg.label);
        break;
      case 'updateSettings':
        await this.handleUpdateSettings(room, participantId, msg.settings);
        break;
      case 'toggleReady':
        await this.handleToggleReady(room, participantId);
        break;
      case 'focusItem':
        await this.handleFocusItem(room, participantId, msg.itemId);
        break;
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): Promise<void> {
    await this.handleDisconnect(ws);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    await this.handleDisconnect(ws);
  }

  async alarm(): Promise<void> {
    const room = await this.getRoom();
    if (!room) return;

    const connected = room.participants.some((p) => p.connected);
    if (!connected) {
      await this.state.storage.deleteAll();
    }
  }

  // ── Room Lifecycle ──

  private async handleCreate(ws: WebSocket, name: string, settingsOverride?: Partial<RoomSettings>): Promise<void> {
    const participantId = generateId();
    const roomCode = this.roomCode;

    const room: RoomState = {
      roomCode,
      hostId: participantId,
      phase: 'lobby',
      columns: [...DEFAULT_COLUMNS],
      cards: [],
      votes: [],
      actionItems: [],
      participants: [
        {
          id: participantId,
          name,
          isHost: true,
          connected: true,
          votesRemaining: settingsOverride?.votesPerPerson ?? DEFAULT_SETTINGS.votesPerPerson,
          ready: false,
        },
      ],
      settings: { ...DEFAULT_SETTINGS, ...settingsOverride },
      timerEnd: null,
      privacyMode: true,
      createdAt: Date.now(),
      groups: [],
      focusedItemId: null,
    };

    ws.serializeAttachment({ participantId, roomCode } satisfies WebSocketAttachment);
    await this.saveRoom(room);

    // Set cleanup alarm
    await this.state.storage.setAlarm(Date.now() + ROOM_TTL_MS);

    this.send(ws, { type: 'sync', state: room, participantId });
  }

  private async handleJoin(ws: WebSocket, name: string, roomCode: string): Promise<void> {
    const room = await this.getRoom();
    if (!room) {
      this.send(ws, { type: 'error', message: 'Room not found' });
      return;
    }

    if (room.roomCode !== roomCode) {
      this.send(ws, { type: 'error', message: 'Invalid room code' });
      return;
    }

    // Check if reconnecting
    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
    let participantId: string;

    const existingByName = room.participants.find((p) => p.name === name && !p.connected);
    if (existingByName) {
      // Reconnecting participant
      participantId = existingByName.id;
      existingByName.connected = true;
    } else {
      // New participant
      participantId = generateId();
      room.participants.push({
        id: participantId,
        name,
        isHost: false,
        connected: true,
        votesRemaining: room.settings.votesPerPerson - room.votes.filter((v) => v.participantId === participantId).length,
        ready: false,
      });
    }

    ws.serializeAttachment({ participantId, roomCode } satisfies WebSocketAttachment);
    await this.saveRoom(room);

    // Send full state to the joining participant
    this.send(ws, { type: 'sync', state: room, participantId });

    // Notify everyone else
    this.broadcast({ type: 'participantUpdate', participants: room.participants }, ws);
  }

  private async handleDisconnect(ws: WebSocket): Promise<void> {
    const room = await this.getRoom();
    if (!room) return;

    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
    if (!attachment) return;

    const participant = room.participants.find((p) => p.id === attachment.participantId);
    if (participant) {
      participant.connected = false;
      await this.saveRoom(room);
      this.broadcast({ type: 'participantUpdate', participants: room.participants });
    }
  }

  // ── Card Operations ──

  private async handleAddCard(room: RoomState, participantId: string, columnId: string, text: string): Promise<void> {
    if (room.phase !== 'write') return;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;

    const column = room.columns.find((c) => c.id === columnId);
    if (!column) return;

    const participant = room.participants.find((p) => p.id === participantId);
    const card: Card = {
      id: generateId(),
      columnId,
      text: trimmed,
      authorId: participantId,
      authorName: participant?.name ?? null,
      votes: 0,
      createdAt: Date.now(),
      groupId: null,
    };

    room.cards.push(card);
    await this.saveRoom(room);
    this.broadcast({ type: 'cardAdded', card });
  }

  private async handleDeleteCard(room: RoomState, participantId: string, cardId: string): Promise<void> {
    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Only author or host can delete
    if (card.authorId !== participantId && room.hostId !== participantId) return;

    // Clean up group membership
    const hadGroup = card.groupId;
    if (card.groupId) {
      const group = room.groups.find((g) => g.id === card.groupId);
      if (group) {
        group.cardIds = group.cardIds.filter((id) => id !== cardId);
        if (group.cardIds.length <= 1) {
          if (group.cardIds.length === 1) {
            const lastCard = room.cards.find((c) => c.id === group.cardIds[0]);
            if (lastCard) lastCard.groupId = null;
          }
          room.groups = room.groups.filter((g) => g.id !== card.groupId);
        }
      }
    }

    room.cards = room.cards.filter((c) => c.id !== cardId);
    room.votes = room.votes.filter((v) => v.cardId !== cardId);

    // Recalculate votesRemaining for affected voters
    for (const p of room.participants) {
      p.votesRemaining = room.settings.votesPerPerson - room.votes.filter((v) => v.participantId === p.id).length;
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'cardDeleted', cardId });
    if (hadGroup) {
      this.broadcast({ type: 'groupsUpdated', groups: room.groups, cards: room.cards });
    }
  }

  private async handleEditCard(room: RoomState, participantId: string, cardId: string, text: string): Promise<void> {
    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Only author or host can edit
    if (card.authorId !== participantId && room.hostId !== participantId) return;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;

    card.text = trimmed;
    await this.saveRoom(room);
    this.broadcast({ type: 'cardEdited', cardId, text: trimmed });
  }

  // ── Voting ──

  private async handleVote(room: RoomState, participantId: string, ws: WebSocket, cardId: string): Promise<void> {
    if (room.phase !== 'vote') return;

    const participant = room.participants.find((p) => p.id === participantId);
    if (!participant || participant.votesRemaining <= 0) {
      this.send(ws, { type: 'error', message: 'No votes remaining' });
      return;
    }

    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Determine the votable unit: group or individual card
    const group = card.groupId ? room.groups.find((g) => g.id === card.groupId) : null;
    const unitCardIds = group ? group.cardIds : [cardId];

    // Record vote against the specific card clicked
    room.votes.push({ participantId, cardId });

    // Increment votes on ALL cards in the unit
    for (const cId of unitCardIds) {
      const c = room.cards.find((x) => x.id === cId);
      if (c) c.votes++;
    }

    participant.votesRemaining--;

    await this.saveRoom(room);
    for (const cId of unitCardIds) {
      const c = room.cards.find((x) => x.id === cId);
      if (c) {
        this.broadcast({ type: 'voteUpdated', cardId: cId, votes: c.votes, participantId, action: 'vote', primary: cId === cardId, votesRemaining: participant.votesRemaining });
      }
    }
  }

  private async handleUnvote(room: RoomState, participantId: string, ws: WebSocket, cardId: string): Promise<void> {
    if (room.phase !== 'vote') return;

    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return;

    const participant = room.participants.find((p) => p.id === participantId);
    if (!participant) return;

    // Determine the votable unit
    const group = card.groupId ? room.groups.find((g) => g.id === card.groupId) : null;
    const unitCardIds = group ? group.cardIds : [cardId];

    // Find the vote on any card in the unit
    const voteIndex = room.votes.findIndex(
      (v) => v.participantId === participantId && unitCardIds.includes(v.cardId),
    );
    if (voteIndex === -1) return;

    const removedVoteCardId = room.votes[voteIndex].cardId;
    room.votes.splice(voteIndex, 1);

    // Decrement votes on ALL cards in the unit
    for (const cId of unitCardIds) {
      const c = room.cards.find((x) => x.id === cId);
      if (c) c.votes--;
    }

    participant.votesRemaining++;

    await this.saveRoom(room);
    for (const cId of unitCardIds) {
      const c = room.cards.find((x) => x.id === cId);
      if (c) {
        this.broadcast({ type: 'voteUpdated', cardId: cId, votes: c.votes, participantId, action: 'unvote', primary: cId === removedVoteCardId, votesRemaining: participant.votesRemaining });
      }
    }
  }

  // ── Phase Management ──

  private async handleMovePhase(room: RoomState, participantId: string, phase: RetroPhase): Promise<void> {
    if (room.hostId !== participantId) return;

    room.phase = phase;
    room.timerEnd = null; // Reset timer on phase change
    room.focusedItemId = null; // Reset focus on phase change

    // Reset ready state for all participants
    for (const p of room.participants) {
      p.ready = false;
    }

    // Auto-reveal cards when leaving write phase
    if (phase !== 'write' && room.privacyMode) {
      room.privacyMode = false;
      this.broadcast({ type: 'privacyChanged', privacyMode: false });
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'phaseChanged', phase });
  }

  // ── Timer ──

  private async handleStartTimer(room: RoomState, participantId: string, duration?: number): Promise<void> {
    if (room.hostId !== participantId) return;

    const seconds = duration ?? room.settings.timerDuration;
    room.timerEnd = Date.now() + seconds * 1000;

    await this.saveRoom(room);
    this.broadcast({ type: 'timerUpdate', timerEnd: room.timerEnd });
  }

  private async handleStopTimer(room: RoomState, participantId: string): Promise<void> {
    if (room.hostId !== participantId) return;

    room.timerEnd = null;

    await this.saveRoom(room);
    this.broadcast({ type: 'timerUpdate', timerEnd: null });
  }

  // ── Action Items ──

  private async handleAddAction(room: RoomState, text: string, assignee: string): Promise<void> {
    if (room.phase !== 'actions') return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const action: ActionItem = {
      id: generateId(),
      text: trimmed,
      assignee: assignee.trim(),
      completed: false,
    };

    room.actionItems.push(action);
    await this.saveRoom(room);
    this.broadcast({ type: 'actionAdded', action });
  }

  private async handleToggleAction(room: RoomState, actionId: string): Promise<void> {
    const action = room.actionItems.find((a) => a.id === actionId);
    if (!action) return;

    action.completed = !action.completed;
    await this.saveRoom(room);
    this.broadcast({ type: 'actionToggled', actionId, completed: action.completed });
  }

  // ── Column Management ──

  private async handleUpdateColumns(room: RoomState, participantId: string, columns: Column[]): Promise<void> {
    if (room.hostId !== participantId) return;
    if (columns.length === 0 || columns.length > 5) return;

    room.columns = columns;
    await this.saveRoom(room);
    this.broadcast({ type: 'columnsUpdated', columns });
  }

  // ── Author Reveal ──

  private async handleRevealAuthors(room: RoomState, participantId: string): Promise<void> {
    if (room.hostId !== participantId) return;

    for (const card of room.cards) {
      const author = room.participants.find((p) => p.id === card.authorId);
      card.authorName = author?.name ?? 'Unknown';
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'authorsRevealed', cards: room.cards });
  }

  // ── Privacy ──

  private async handleTogglePrivacy(room: RoomState, participantId: string): Promise<void> {
    if (room.hostId !== participantId) return;

    room.privacyMode = !room.privacyMode;
    await this.saveRoom(room);
    this.broadcast({ type: 'privacyChanged', privacyMode: room.privacyMode });
  }

  // ── Card Grouping ──

  private async handleGroupCards(room: RoomState, cardIds: string[]): Promise<void> {
    if (room.phase !== 'group') return;
    if (cardIds.length < 2) return;

    // Verify all cards exist
    if (!cardIds.every((id) => room.cards.some((c) => c.id === id))) return;

    // cardIds[0] = dragged card, cardIds[1] = target card
    const draggedCardId = cardIds[0];
    const draggedCard = room.cards.find((c) => c.id === draggedCardId);
    if (!draggedCard) return;

    // Remove dragged card from its old group (if any)
    if (draggedCard.groupId) {
      const oldGroup = room.groups.find((g) => g.id === draggedCard.groupId);
      if (oldGroup) {
        oldGroup.cardIds = oldGroup.cardIds.filter((id) => id !== draggedCardId);
        if (oldGroup.cardIds.length <= 1) {
          const lastCard = room.cards.find((c) => c.id === oldGroup.cardIds[0]);
          if (lastCard) lastCard.groupId = null;
          room.groups = room.groups.filter((g) => g.id !== oldGroup.id);
        }
      }
      draggedCard.groupId = null;
    }

    // Find if the target card belongs to an existing group
    const targetCard = room.cards.find((c) => c.id === cardIds[1]);
    const targetGroup = targetCard?.groupId
      ? room.groups.find((g) => g.id === targetCard.groupId)
      : null;

    if (targetGroup) {
      // Add dragged card to existing group
      targetGroup.cardIds.push(draggedCardId);
      draggedCard.groupId = targetGroup.id;
    } else {
      // Create new group with both cards
      const newGroupId = generateId();
      const newGroup: CardGroup = {
        id: newGroupId,
        cardIds: [...cardIds],
        label: null,
      };
      room.groups.push(newGroup);
      for (const cardId of cardIds) {
        const card = room.cards.find((c) => c.id === cardId);
        if (card) card.groupId = newGroupId;
      }
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'groupsUpdated', groups: room.groups, cards: room.cards });
  }

  private async handleUngroupCard(room: RoomState, cardId: string): Promise<void> {
    if (room.phase !== 'group') return;

    const card = room.cards.find((c) => c.id === cardId);
    if (!card || !card.groupId) return;

    const group = room.groups.find((g) => g.id === card.groupId);
    if (!group) return;

    group.cardIds = group.cardIds.filter((id) => id !== cardId);
    card.groupId = null;

    // Dissolve group if 0 or 1 card remains
    if (group.cardIds.length <= 1) {
      if (group.cardIds.length === 1) {
        const lastCard = room.cards.find((c) => c.id === group.cardIds[0]);
        if (lastCard) lastCard.groupId = null;
      }
      room.groups = room.groups.filter((g) => g.id !== group.id);
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'groupsUpdated', groups: room.groups, cards: room.cards });
  }

  private async handleDissolveGroup(room: RoomState, groupId: string): Promise<void> {
    if (room.phase !== 'group') return;

    const group = room.groups.find((g) => g.id === groupId);
    if (!group) return;

    for (const card of room.cards) {
      if (card.groupId === groupId) card.groupId = null;
    }

    room.groups = room.groups.filter((g) => g.id !== groupId);

    await this.saveRoom(room);
    this.broadcast({ type: 'groupsUpdated', groups: room.groups, cards: room.cards });
  }

  private async handleSetGroupLabel(room: RoomState, groupId: string, label: string): Promise<void> {
    const group = room.groups.find((g) => g.id === groupId);
    if (!group) return;

    group.label = label.trim() || null;

    await this.saveRoom(room);
    this.broadcast({ type: 'groupsUpdated', groups: room.groups, cards: room.cards });
  }

  // ── Settings ──

  private async handleUpdateSettings(room: RoomState, participantId: string, settings: Partial<RoomSettings>): Promise<void> {
    if (room.hostId !== participantId) return;

    if (settings.votesPerPerson !== undefined) {
      const val = Math.max(1, Math.min(20, Math.floor(settings.votesPerPerson)));
      room.settings.votesPerPerson = val;
      // Recalculate votesRemaining for all participants
      for (const p of room.participants) {
        const used = room.votes.filter((v) => v.participantId === p.id).length;
        p.votesRemaining = val - used;
      }
    }

    if (settings.timerDuration !== undefined) {
      room.settings.timerDuration = Math.max(30, Math.min(1800, Math.floor(settings.timerDuration)));
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'settingsUpdated', settings: room.settings });
  }

  // ── Ready Check ──

  private async handleToggleReady(room: RoomState, participantId: string): Promise<void> {
    const participant = room.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.ready = !participant.ready;

    await this.saveRoom(room);
    this.broadcast({ type: 'participantUpdate', participants: room.participants });
  }

  // ── Discuss Focus ──

  private async handleFocusItem(room: RoomState, participantId: string, itemId: string | null): Promise<void> {
    if (room.hostId !== participantId) return;
    if (room.phase !== 'discuss') return;

    room.focusedItemId = itemId;

    await this.saveRoom(room);
    this.broadcast({ type: 'focusUpdated', focusedItemId: itemId });
  }

  // ── Helpers ──

  private async getRoom(): Promise<RoomState | null> {
    return (await this.state.storage.get<RoomState>('room')) ?? null;
  }

  private async saveRoom(room: RoomState): Promise<void> {
    await this.state.storage.put('room', room);
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // WebSocket may already be closed
    }
  }

  private broadcast(msg: ServerMessage, except?: WebSocket): void {
    const sockets = this.state.getWebSockets();
    const data = JSON.stringify(msg);
    for (const ws of sockets) {
      if (ws !== except) {
        try {
          ws.send(data);
        } catch {
          // Stale socket, will be cleaned up by webSocketClose
        }
      }
    }
  }
}
