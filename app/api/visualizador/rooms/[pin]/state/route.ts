/**
 * POST /api/visualizador/rooms/[pin]/state
 * Recibe un snapshot de estado del desktop y lo retransmite a los moviles via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastToMobile } from '../../room-store';
import type { RemoteState } from '@/app/visualizador/lib/remote-types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;

  let body: RemoteState;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  // Validar campos requeridos
  if (
    typeof body?.activeHymnName !== 'string' ||
    typeof body?.activeSlideLabel !== 'string' ||
    typeof body?.activeSlideIndex !== 'number' ||
    typeof body?.totalSlides !== 'number' ||
    typeof body?.projectionMode !== 'string' ||
    typeof body?.audioPlaying !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Campos requeridos faltantes o invalidos' },
      { status: 400 },
    );
  }

  const success = broadcastToMobile(pin, body);
  if (!success) {
    return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
