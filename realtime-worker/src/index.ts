import { RetroRoom } from './RetroRoom';
import { CrapsRoom } from './CrapsRoom';

export { RetroRoom, CrapsRoom };

interface Env {
  RETRO_ROOM: DurableObjectNamespace;
  CRAPS_ROOM: DurableObjectNamespace;
}

const ALLOWED_ORIGINS = [
  'https://billbergquist.dev',
  'http://localhost:4321',
  'http://localhost:3000',
];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // GET /api/rooms/:code/ws - WebSocket connection
    const wsMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{4})\/ws$/);
    if (wsMatch) {
      const roomCode = wsMatch[1];
      const id = env.RETRO_ROOM.idFromName(roomCode);
      const stub = env.RETRO_ROOM.get(id);

      // Forward the request to the Durable Object, passing room code in the path
      const doUrl = new URL(request.url);
      doUrl.pathname = `/ws/${roomCode}`;
      return stub.fetch(new Request(doUrl.toString(), request));
    }

    // GET /api/craps/:code/ws - Craps WebSocket connection
    const crapsMatch = url.pathname.match(/^\/api\/craps\/([A-Z0-9]{4})\/ws$/);
    if (crapsMatch) {
      const roomCode = crapsMatch[1];
      const id = env.CRAPS_ROOM.idFromName(roomCode);
      const stub = env.CRAPS_ROOM.get(id);

      const doUrl = new URL(request.url);
      doUrl.pathname = `/ws/${roomCode}`;
      return stub.fetch(new Request(doUrl.toString(), request));
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response('ok', { headers: cors });
    }

    return new Response('Not Found', { status: 404, headers: cors });
  },
};
