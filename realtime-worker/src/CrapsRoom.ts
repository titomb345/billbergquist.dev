import type {
  CrapsGameState,
  CrapsClientMessage,
  CrapsServerMessage,
  Player,
  Bet,
  BetType,
} from './craps-types';
import { STARTING_BALANCE, MAX_PLAYERS } from './craps-types';
import {
  rollDice,
  resolveComeOutRoll,
  resolvePointPhaseRoll,
  validateBet,
  isContractBet,
  establishComeBetPoints,
} from './craps-engine';
import { generateId } from './utils';

const ROOM_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
const EMPTY_ROOM_CLEANUP_MS = 15 * 60 * 1000; // 15 min after all disconnect
const MSG_RATE_WINDOW_MS = 5_000;
const MSG_RATE_MAX = 30;
interface WebSocketAttachment {
  playerId: string;
  roomCode: string;
}

export class CrapsRoom implements DurableObject {
  private state: DurableObjectState;
  private roomCode: string = '';
  private msgRates = new Map<WebSocket, { count: number; resetAt: number }>();

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

      this.state.acceptWebSocket(server);

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not Found', { status: 404 });
  }

  private isMessageRateLimited(ws: WebSocket): boolean {
    const now = Date.now();
    const entry = this.msgRates.get(ws);

    if (!entry || now > entry.resetAt) {
      this.msgRates.set(ws, { count: 1, resetAt: now + MSG_RATE_WINDOW_MS });
      return false;
    }

    entry.count++;
    return entry.count > MSG_RATE_MAX;
  }

  async webSocketMessage(ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    const msgStr = typeof rawMessage === 'string' ? rawMessage : new TextDecoder().decode(rawMessage);

    let msg: CrapsClientMessage;
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

    if (this.isMessageRateLimited(ws)) {
      this.send(ws, { type: 'error', message: 'Too many messages, slow down' });
      return;
    }

    if (msg.type === 'create') {
      await this.handleCreate(ws, msg.name, msg.userId, msg.avatarUrl);
      return;
    }

    if (msg.type === 'join') {
      await this.handleJoin(ws, msg.name, msg.userId, msg.avatarUrl, msg.roomCode);
      return;
    }

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

    const playerId = attachment.playerId;

    switch (msg.type) {
      case 'toggleReady':
        await this.handleToggleReady(room, playerId);
        break;
      case 'startGame':
        await this.handleStartGame(room, playerId, ws);
        break;
      case 'placeBet':
        await this.handlePlaceBet(room, playerId, msg.betType, msg.amount, ws, msg.betPoint);
        break;
      case 'removeBet':
        await this.handleRemoveBet(room, playerId, msg.betId, ws);
        break;
      case 'confirmBets':
        await this.handleConfirmBets(room, playerId);
        break;
      case 'rollDice':
        await this.handleRollDice(room, playerId, ws);
        break;
      case 'react':
        this.broadcast({ type: 'reaction', playerId, reaction: msg.reaction }, ws);
        break;
      case 'chat': {
        const text = msg.text?.slice(0, 200)?.trim();
        if (!text) break;
        const sender = room.players.find((p) => p.id === playerId);
        if (!sender) break;
        this.broadcast({ type: 'chatMessage', playerId, name: sender.name, text, timestamp: Date.now() });
        break;
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean): Promise<void> {
    this.msgRates.delete(ws);
    if (code === 4001) return;
    await this.handleDisconnect(ws);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    this.msgRates.delete(ws);
    await this.handleDisconnect(ws);
  }

  async alarm(): Promise<void> {
    const room = await this.getRoom();
    if (!room) return;

    const age = Date.now() - room.createdAt;
    const connected = room.players.some((p) => p.connected);

    if (age >= ROOM_TTL_MS) {
      for (const ws of this.state.getWebSockets()) {
        try { ws.close(1000, 'Room expired'); } catch { /* noop */ }
      }
      await this.state.storage.deleteAll();
      return;
    }

    if (!connected) {
      await this.state.storage.deleteAll();
      return;
    }

    const remaining = ROOM_TTL_MS - age;
    await this.state.storage.setAlarm(Date.now() + remaining);
  }

  // ── Room Lifecycle ──

  private async handleCreate(ws: WebSocket, name: string, userId: string, avatarUrl?: string): Promise<void> {
    const playerId = generateId();
    const roomCode = this.roomCode;

    const room: CrapsGameState = {
      roomCode,
      hostId: playerId,
      phase: 'lobby',
      players: [
        {
          id: playerId,
          name,
          userId,
          isHost: true,
          connected: true,
          balance: STARTING_BALANCE,
          ready: false,
          avatarUrl: avatarUrl ?? null,
          betsConfirmed: false,
        },
      ],
      shooterIndex: 0,
      point: null,
      bets: [],
      rollHistory: [],
      createdAt: Date.now(),
    };

    ws.serializeAttachment({ playerId, roomCode } satisfies WebSocketAttachment);
    await this.saveRoom(room);
    await this.state.storage.setAlarm(Date.now() + ROOM_TTL_MS);

    this.send(ws, { type: 'sync', state: room, playerId });
  }

  private async handleJoin(ws: WebSocket, name: string, userId: string, avatarUrl: string | undefined, roomCode: string): Promise<void> {
    const room = await this.getRoom();
    if (!room) {
      this.send(ws, { type: 'error', message: 'Room not found' });
      return;
    }

    if (room.roomCode !== roomCode) {
      this.send(ws, { type: 'error', message: 'Invalid room code' });
      return;
    }

    let playerId: string;
    const existing = room.players.find((p) => p.userId === userId);

    if (existing) {
      playerId = existing.id;
      existing.name = name;
      existing.avatarUrl = avatarUrl ?? existing.avatarUrl ?? null;

      if (existing.connected) {
        const allSockets = this.state.getWebSockets();
        for (const sock of allSockets) {
          if (sock === ws) continue;
          const sockAttachment = sock.deserializeAttachment() as WebSocketAttachment | null;
          if (sockAttachment?.playerId === playerId) {
            try { sock.close(4001, 'Session replaced by new connection'); } catch { /* noop */ }
            break;
          }
        }
      }

      existing.connected = true;
    } else {
      if (room.players.length >= MAX_PLAYERS) {
        this.send(ws, { type: 'error', message: `Room is full (max ${MAX_PLAYERS} players)` });
        return;
      }

      playerId = generateId();
      room.players.push({
        id: playerId,
        name,
        userId,
        isHost: false,
        connected: true,
        balance: STARTING_BALANCE,
        ready: false,
        avatarUrl: avatarUrl ?? null,
        betsConfirmed: false,
      });
    }

    ws.serializeAttachment({ playerId, roomCode } satisfies WebSocketAttachment);
    await this.saveRoom(room);

    const remaining = ROOM_TTL_MS - (Date.now() - room.createdAt);
    if (remaining > 0) {
      await this.state.storage.setAlarm(Date.now() + remaining);
    }

    this.send(ws, { type: 'sync', state: room, playerId });
    this.broadcast({ type: 'playerUpdate', players: room.players }, ws);
  }

  private async handleDisconnect(ws: WebSocket): Promise<void> {
    const room = await this.getRoom();
    if (!room) return;

    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
    if (!attachment) return;

    const player = room.players.find((p) => p.id === attachment.playerId);
    if (player) {
      player.connected = false;
      await this.saveRoom(room);
      this.broadcast({ type: 'playerUpdate', players: room.players });

      const anyConnected = room.players.some((p) => p.connected);
      if (!anyConnected) {
        await this.state.storage.setAlarm(Date.now() + EMPTY_ROOM_CLEANUP_MS);
      }
    }
  }

  // ── Game Flow ──

  private async handleToggleReady(room: CrapsGameState, playerId: string): Promise<void> {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.ready = !player.ready;

    await this.saveRoom(room);
    this.broadcast({ type: 'playerUpdate', players: room.players });
  }

  private async handleStartGame(room: CrapsGameState, playerId: string, ws: WebSocket): Promise<void> {
    if (room.hostId !== playerId) {
      this.send(ws, { type: 'error', message: 'Only the host can start the game' });
      return;
    }

    if (room.phase !== 'lobby') {
      this.send(ws, { type: 'error', message: 'Game already started' });
      return;
    }

    const connectedPlayers = room.players.filter((p) => p.connected);

    const otherPlayers = connectedPlayers.filter((p) => !p.isHost);
    const allReady = otherPlayers.every((p) => p.ready);
    if (otherPlayers.length > 0 && !allReady) {
      this.send(ws, { type: 'error', message: 'All players must be ready' });
      return;
    }

    room.phase = 'betting';
    for (const p of room.players) {
      p.ready = false;
      p.betsConfirmed = false;
    }

    await this.saveRoom(room);
    this.broadcast({ type: 'phaseChanged', phase: 'betting', point: room.point });
    this.broadcast({ type: 'playerUpdate', players: room.players });
  }

  private async handlePlaceBet(room: CrapsGameState, playerId: string, betType: BetType, amount: number, ws: WebSocket, betPoint?: number): Promise<void> {
    if (room.phase !== 'betting') {
      this.send(ws, { type: 'error', message: 'Cannot place bets now' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.betsConfirmed) {
      this.send(ws, { type: 'error', message: 'Bets already confirmed' });
      return;
    }

    const error = validateBet(room, playerId, betType, amount, betPoint);
    if (error) {
      this.send(ws, { type: 'error', message: error });
      return;
    }

    const bet: Bet = {
      id: generateId(),
      playerId,
      type: betType,
      amount,
      ...(betPoint != null ? { point: betPoint } : {}),
    };

    room.bets.push(bet);
    player.balance -= amount;

    await this.saveRoom(room);
    this.broadcast({ type: 'betPlaced', bet, players: room.players });
  }

  private async handleRemoveBet(room: CrapsGameState, playerId: string, betId: string, ws: WebSocket): Promise<void> {
    if (room.phase !== 'betting') {
      this.send(ws, { type: 'error', message: 'Cannot remove bets now' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.betsConfirmed) {
      this.send(ws, { type: 'error', message: 'Bets already confirmed' });
      return;
    }

    const betIndex = room.bets.findIndex((b) => b.id === betId && b.playerId === playerId);
    if (betIndex === -1) {
      this.send(ws, { type: 'error', message: 'Bet not found' });
      return;
    }

    const bet = room.bets[betIndex];

    if (isContractBet(bet, room.point)) {
      this.send(ws, { type: 'error', message: 'Cannot remove a contract bet' });
      return;
    }

    room.bets.splice(betIndex, 1);
    player.balance += bet.amount;

    await this.saveRoom(room);
    this.broadcast({ type: 'betRemoved', betId, players: room.players });
  }

  private async handleConfirmBets(room: CrapsGameState, playerId: string): Promise<void> {
    if (room.phase !== 'betting') return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.betsConfirmed = true;

    // Check if all connected players have confirmed
    const connectedPlayers = room.players.filter((p) => p.connected);
    const allConfirmed = connectedPlayers.every((p) => p.betsConfirmed);

    if (allConfirmed) {
      room.phase = 'rolling';
      await this.saveRoom(room);
      this.broadcast({ type: 'playerUpdate', players: room.players });
      this.broadcast({ type: 'phaseChanged', phase: 'rolling', point: room.point });
    } else {
      await this.saveRoom(room);
      this.broadcast({ type: 'playerUpdate', players: room.players });
    }
  }

  private async handleRollDice(room: CrapsGameState, playerId: string, ws: WebSocket): Promise<void> {
    if (room.phase !== 'rolling') {
      this.send(ws, { type: 'error', message: 'Cannot roll now' });
      return;
    }

    // Only the shooter can roll
    const shooter = room.players[room.shooterIndex];
    if (!shooter || shooter.id !== playerId) {
      this.send(ws, { type: 'error', message: 'Only the shooter can roll' });
      return;
    }

    const roll = rollDice();
    room.rollHistory.push(roll);

    const isComingOut = room.point === null;

    if (isComingOut) {
      const { resolutions, newPoint } = resolveComeOutRoll(room.bets, roll);

      // Apply resolutions
      this.applyResolutions(room, resolutions);

      // Remove resolved bets
      const resolvedIds = new Set(resolutions.map((r) => r.betId));
      room.bets = room.bets.filter((b) => !resolvedIds.has(b.id));

      if (newPoint) {
        // Point established
        room.point = newPoint;
        room.phase = 'betting';
        this.resetBetsConfirmed(room);
      } else {
        // Natural or craps: stay on come-out, new betting round
        room.phase = 'betting';
        this.resetBetsConfirmed(room);
      }

      await this.saveRoom(room);
      this.broadcast({
        type: 'diceRolled',
        roll,
        resolutions,
        players: room.players,
        bets: room.bets,
        point: room.point,
        phase: room.phase,
        shooterIndex: room.shooterIndex,
      });
    } else {
      const { resolutions, pointMade, sevenOut } = resolvePointPhaseRoll(room.bets, roll, room.point!);

      // Apply resolutions
      this.applyResolutions(room, resolutions);

      // Remove resolved bets
      const resolvedIds = new Set(resolutions.map((r) => r.betId));

      // Establish come bet points for unresolved come/don't come bets
      room.bets = establishComeBetPoints(room.bets, roll.total, resolvedIds);

      // Remove resolved bets
      room.bets = room.bets.filter((b) => !resolvedIds.has(b.id));

      if (sevenOut) {
        // Seven-out: all bets were resolved, rotate shooter
        room.bets = [];
        room.point = null;
        room.shooterIndex = this.getNextShooterIndex(room);
        room.phase = 'betting';
        this.resetBetsConfirmed(room);
      } else if (pointMade) {
        // Point made: back to come-out
        room.point = null;
        room.phase = 'betting';
        this.resetBetsConfirmed(room);
      } else {
        // Other number: back to betting (for new bets during point phase)
        room.phase = 'betting';
        this.resetBetsConfirmed(room);
      }

      await this.saveRoom(room);
      this.broadcast({
        type: 'diceRolled',
        roll,
        resolutions,
        players: room.players,
        bets: room.bets,
        point: room.point,
        phase: room.phase,
        shooterIndex: room.shooterIndex,
      });
    }
  }

  // ── Helpers ──

  private applyResolutions(room: CrapsGameState, resolutions: { playerId: string; amount: number; payout: number }[]): void {
    for (const res of resolutions) {
      const player = room.players.find((p) => p.id === res.playerId);
      if (!player) continue;

      if (res.payout > 0) {
        // Win: get bet back + winnings
        player.balance += res.amount + res.payout;
      } else if (res.payout === 0) {
        // Push: get bet back
        player.balance += res.amount;
      }
      // Loss (payout < 0): bet already deducted when placed
    }
  }

  private resetBetsConfirmed(room: CrapsGameState): void {
    for (const p of room.players) {
      p.betsConfirmed = false;
    }
  }

  private getNextShooterIndex(room: CrapsGameState): number {
    const connectedPlayers = room.players.map((p, i) => ({ connected: p.connected, index: i })).filter((p) => p.connected);
    if (connectedPlayers.length === 0) return 0;

    const currentIdx = room.shooterIndex;
    // Find the next connected player after current
    for (let i = 1; i <= room.players.length; i++) {
      const nextIdx = (currentIdx + i) % room.players.length;
      if (room.players[nextIdx].connected) {
        return nextIdx;
      }
    }
    return 0;
  }

  private async getRoom(): Promise<CrapsGameState | null> {
    return (await this.state.storage.get<CrapsGameState>('room')) ?? null;
  }

  private async saveRoom(room: CrapsGameState): Promise<void> {
    await this.state.storage.put('room', room);
  }

  private send(ws: WebSocket, msg: CrapsServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // WebSocket may already be closed
    }
  }

  private broadcast(msg: CrapsServerMessage, except?: WebSocket): void {
    const sockets = this.state.getWebSockets();
    const data = JSON.stringify(msg);
    for (const ws of sockets) {
      if (ws !== except) {
        try {
          ws.send(data);
        } catch {
          // Stale socket
        }
      }
    }
  }
}
