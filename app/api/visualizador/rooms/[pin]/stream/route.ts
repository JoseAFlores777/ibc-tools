/**
 * GET /api/visualizador/rooms/[pin]/stream?role=desktop|mobile
 * Endpoint SSE que envia eventos segun el rol:
 *   - desktop recibe eventos 'command' del movil
 *   - mobile recibe eventos 'state' del desktop
 */

import { NextRequest } from 'next/server';
import { getRoom, addListener, removeListener, getRoomState } from '../../room-store';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();
const KEEPALIVE_INTERVAL = 30_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;
  const role = request.nextUrl.searchParams.get('role') === 'desktop' ? 'desktop' : 'mobile';

  const room = getRoom(pin);
  if (!room) {
    return new Response(JSON.stringify({ error: 'Sala no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  addListener(pin, role, writer);

  // Enviar estado actual a late-joiners mobile
  if (role === 'mobile') {
    const currentState = getRoomState(pin);
    if (currentState) {
      const payload = encoder.encode(`event: state\ndata: ${JSON.stringify(currentState)}\n\n`);
      writer.write(payload).catch(() => {});
    }
  }

  // Keepalive cada 30 segundos
  const keepaliveId = setInterval(() => {
    writer.write(encoder.encode(': keepalive\n\n')).catch(() => {
      clearInterval(keepaliveId);
    });
  }, KEEPALIVE_INTERVAL);

  // Limpieza cuando se cierra la conexion
  request.signal.addEventListener('abort', () => {
    clearInterval(keepaliveId);
    removeListener(pin, role, writer);
    writer.close().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
