/**
 * POST /api/visualizador/rooms/[pin]/command
 * Recibe un comando del movil y lo retransmite al desktop via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastToDesktop, checkIpRateLimit } from '../../room-store';
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
  'RESTART_AUDIO',
  'SET_VOLUME',
]);

/** Modos de proyeccion validos */
const VALID_MODES = new Set(['black', 'clear', 'logo', 'slide']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;

  // Validar formato del PIN (4-6 digitos, compatible con transicion)
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'Formato de PIN invalido' }, { status: 400 });
  }

  // Rate limit por IP: maximo 60 comandos por minuto
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkIpRateLimit(ip, 60)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

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

  // Validar index para SET_SLIDE (entero no negativo)
  if (body.type === 'SET_SLIDE') {
    if (!('index' in body) || typeof body.index !== 'number' || !Number.isInteger(body.index) || body.index < 0) {
      return NextResponse.json({ error: 'Index invalido' }, { status: 400 });
    }
  }

  // Validar index para SET_HYMN (entero no negativo)
  if (body.type === 'SET_HYMN') {
    if (!('index' in body) || typeof body.index !== 'number' || !Number.isInteger(body.index) || body.index < 0) {
      return NextResponse.json({ error: 'Index invalido' }, { status: 400 });
    }
  }

  // Validar trackField para SET_AUDIO_TRACK (solo lowercase y underscore)
  if (body.type === 'SET_AUDIO_TRACK') {
    if (!('trackField' in body) || typeof body.trackField !== 'string' || !/^[a-z_]+$/.test(body.trackField)) {
      return NextResponse.json({ error: 'trackField invalido' }, { status: 400 });
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
