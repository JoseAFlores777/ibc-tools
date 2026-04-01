/**
 * POST /api/visualizador/rooms/[pin]/state
 * Recibe un snapshot de estado del desktop y lo retransmite a los moviles via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastToMobile } from '../../room-store';
import type { RemoteState } from '@/app/visualizador/lib/remote-types';

/** Modos de proyeccion validos */
const VALID_PROJECTION_MODES = new Set(['black', 'clear', 'logo', 'slide']);

/** Verifica que un string no contenga newlines (prevencion de inyeccion SSE) */
function hasNewlines(value: string): boolean {
  return /[\r\n]/.test(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;

  // Validar formato del PIN (4-6 digitos, compatible con transicion)
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'Formato de PIN invalido' }, { status: 400 });
  }

  let body: RemoteState;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  // Validar tipos de campos requeridos
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

  // Validar que campos numericos sean enteros no negativos
  if (
    !Number.isInteger(body.activeSlideIndex) ||
    body.activeSlideIndex < 0 ||
    !Number.isInteger(body.totalSlides) ||
    body.totalSlides < 0
  ) {
    return NextResponse.json(
      { error: 'Campos numericos deben ser enteros no negativos' },
      { status: 400 },
    );
  }

  // Validar activeHymnIndex si esta presente
  if (
    body.activeHymnIndex !== undefined &&
    (typeof body.activeHymnIndex !== 'number' ||
      !Number.isInteger(body.activeHymnIndex) ||
      body.activeHymnIndex < 0)
  ) {
    return NextResponse.json(
      { error: 'activeHymnIndex debe ser un entero no negativo' },
      { status: 400 },
    );
  }

  // Validar projectionMode contra whitelist
  if (!VALID_PROJECTION_MODES.has(body.projectionMode)) {
    return NextResponse.json(
      { error: 'projectionMode invalido' },
      { status: 400 },
    );
  }

  // Prevenir inyeccion SSE: strings no deben contener newlines
  if (hasNewlines(body.activeHymnName) || hasNewlines(body.activeSlideLabel)) {
    return NextResponse.json(
      { error: 'Campos de texto no pueden contener saltos de linea' },
      { status: 400 },
    );
  }

  const result = broadcastToMobile(pin, body);
  if (result === 'not_found') {
    return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
  }
  if (result === 'rate_limited') {
    return NextResponse.json({ error: 'Demasiadas actualizaciones de estado' }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
