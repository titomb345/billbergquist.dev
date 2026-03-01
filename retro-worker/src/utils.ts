const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}
