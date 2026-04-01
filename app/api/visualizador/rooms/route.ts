/**
 * POST /api/visualizador/rooms -- Crear una nueva sala de control remoto.
 * Retorna un PIN de 6 digitos y un roomId UUID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoom, checkIpRateLimit } from './room-store';

export async function POST(request: NextRequest) {
  // Rate limit por IP: maximo 5 salas por minuto
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkIpRateLimit(ip, 5)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intente de nuevo en un minuto.' },
      { status: 429 },
    );
  }

  const { pin, roomId } = createRoom();
  return NextResponse.json({ pin, roomId }, { status: 201 });
}
