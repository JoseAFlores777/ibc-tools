/**
 * POST /api/visualizador/rooms — Crear una nueva sala de control remoto.
 * Retorna un PIN de 4 digitos y un roomId UUID.
 */

import { NextResponse } from 'next/server';
import { createRoom } from './room-store';

export async function POST() {
  const { pin, roomId } = createRoom();
  return NextResponse.json({ pin, roomId }, { status: 201 });
}
