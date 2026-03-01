const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion

export function generateRoomCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

export function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}
