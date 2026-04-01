/**
 * POST /api/visualizador/rooms/[pin]/command
 * Recibe un comando del movil y lo retransmite al desktop via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastToDesktop } from '../../room-store';
import type { RemoteCommand } from '@/app/visualizador/lib/remote-types';

/** Tipos de comando validos */
const VALID_COMMAND_TYPES = new Set([
  'NEXT_SLIDE',
  'PREV_SLIDE',
  'SET_SLIDE',
  'SET_HYMN',
  'SET_PROJECTION_MODE',
  'SET_AUDIO_PLAYING',
  'SET_AUDIO_TRACK',
]);

/** Modos de proyeccion validos */
const VALID_MODES = new Set(['black', 'clear', 'logo', 'slide']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;

  let body: RemoteCommand;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  // Validar tipo de comando
  if (!body || !VALID_COMMAND_TYPES.has(body.type)) {
    return NextResponse.json({ error: 'Tipo de comando invalido' }, { status: 400 });
  }

  // Validar modo si es SET_PROJECTION_MODE
  if (body.type === 'SET_PROJECTION_MODE') {
    if (!('mode' in body) || !VALID_MODES.has(body.mode)) {
      return NextResponse.json({ error: 'Modo invalido' }, { status: 400 });
    }
  }

  // Validar playing si es SET_AUDIO_PLAYING
  if (body.type === 'SET_AUDIO_PLAYING') {
    if (!('playing' in body) || typeof body.playing !== 'boolean') {
      return NextResponse.json({ error: 'Campo playing invalido' }, { status: 400 });
    }
  }

  const result = broadcastToDesktop(pin, body);

  if (result === 'not_found') {
    return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
  }
  if (result === 'rate_limited') {
    return NextResponse.json({ error: 'Demasiados comandos' }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
