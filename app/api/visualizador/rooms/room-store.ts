/**
 * Almacen en memoria para salas de control remoto del Visualizador.
 * Cada sala tiene un PIN de 6 digitos, listeners SSE separados para
 * desktop (recibe comandos) y mobile (recibe estado).
 */

import type { RemoteCommand, RemoteState } from '@/app/visualizador/lib/remote-types';

interface Room {
  id: string;
  pin: string;
  createdAt: number;
  lastActivity: number;
  state: RemoteState | null;
  desktopListeners: Set<WritableStreamDefaultWriter>;
  mobileListeners: Set<WritableStreamDefaultWriter>;
  /** Timestamps de los ultimos comandos para rate limiting */
  commandTimestamps: number[];
  /** Timestamps de los ultimos state broadcasts para rate limiting */
  stateTimestamps: number[];
}

/** Mapa global de salas por PIN */
const rooms = new Map<string, Room>();

/** Tiempo de expiracion: 4 horas */
const EXPIRY_MS = 4 * 60 * 60 * 1000;

/** Maximo de comandos por segundo */
const RATE_LIMIT = 10;

/** Maximo de state broadcasts por segundo */
const STATE_RATE_LIMIT = 30;

/** Maximo de listeners SSE por sala (desktop + mobile combinados) */
const MAX_LISTENERS_PER_ROOM = 50;

/** Encoder reutilizable */
const encoder = new TextEncoder();

/** Rate limiter por IP: mapa de IP a timestamps de acciones */
const ipRateLimits = new Map<string, number[]>();

/** Genera un PIN de 6 digitos que no este en uso */
function generatePin(): string {
  let pin: string;
  let attempts = 0;
  do {
    pin = String(100000 + Math.floor(Math.random() * 900000));
    attempts++;
    if (attempts > 100) {
      // Fallback: usar timestamp parcial
      pin = String(Date.now() % 900000 + 100000);
      break;
    }
  } while (rooms.has(pin));
  return pin;
}

/** Codifica un evento SSE como string */
function encodeSSE(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Verifica si una sala ha expirado y la elimina si es asi */
function checkExpiry(pin: string): Room | null {
  const room = rooms.get(pin);
  if (!room) return null;
  if (Date.now() - room.lastActivity > EXPIRY_MS) {
    rooms.delete(pin);
    return null;
  }
  return room;
}

/**
 * Verifica rate limit por IP. Retorna true si la accion esta permitida.
 * Limpia timestamps mayores a 60 segundos.
 */
export function checkIpRateLimit(ip: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const timestamps = ipRateLimits.get(ip) ?? [];

  // Limpiar timestamps mayores a 60 segundos
  const recent = timestamps.filter((t) => now - t < 60_000);

  if (recent.length >= maxPerMinute) {
    ipRateLimits.set(ip, recent);
    return false;
  }

  recent.push(now);
  ipRateLimits.set(ip, recent);
  return true;
}

/** Crea una nueva sala con PIN unico */
export function createRoom(): { pin: string; roomId: string } {
  const pin = generatePin();
  const roomId = crypto.randomUUID();
  const room: Room = {
    id: roomId,
    pin,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    state: null,
    desktopListeners: new Set(),
    mobileListeners: new Set(),
    commandTimestamps: [],
    stateTimestamps: [],
  };
  rooms.set(pin, room);
  return { pin, roomId };
}

/** Obtiene una sala por PIN, null si no existe o expiro */
export function getRoom(pin: string): Room | null {
  return checkExpiry(pin);
}

/**
 * Registra un writer SSE en la sala.
 * Retorna false si la sala no existe, expiro, o se alcanzo el limite de conexiones.
 */
export function addListener(
  pin: string,
  type: 'desktop' | 'mobile',
  writer: WritableStreamDefaultWriter,
): boolean {
  const room = checkExpiry(pin);
  if (!room) return false;

  // Verificar limite de listeners
  const totalListeners = room.desktopListeners.size + room.mobileListeners.size;
  if (totalListeners >= MAX_LISTENERS_PER_ROOM) return false;

  room.lastActivity = Date.now();
  const set = type === 'desktop' ? room.desktopListeners : room.mobileListeners;
  set.add(writer);
  return true;
}

/** Elimina un writer SSE de la sala */
export function removeListener(
  pin: string,
  type: 'desktop' | 'mobile',
  writer: WritableStreamDefaultWriter,
): void {
  const room = rooms.get(pin);
  if (!room) return;
  const set = type === 'desktop' ? room.desktopListeners : room.mobileListeners;
  set.delete(writer);
}

/** Obtiene el estado actual de la sala para late-joiners */
export function getRoomState(pin: string): RemoteState | null {
  const room = checkExpiry(pin);
  return room?.state ?? null;
}

/**
 * Envia un comando a todos los listeners desktop de la sala.
 * Retorna 'ok' si se envio, 'rate_limited' si excede 10/seg, 'not_found' si no existe.
 */
export function broadcastToDesktop(
  pin: string,
  command: RemoteCommand,
): 'ok' | 'rate_limited' | 'not_found' {
  const room = checkExpiry(pin);
  if (!room) return 'not_found';

  // Rate limiting: mantener solo timestamps del ultimo segundo
  const now = Date.now();
  room.commandTimestamps = room.commandTimestamps.filter((t) => now - t < 1000);
  if (room.commandTimestamps.length >= RATE_LIMIT) {
    return 'rate_limited';
  }
  room.commandTimestamps.push(now);
  room.lastActivity = now;

  const payload = encodeSSE('command', command);
  for (const writer of room.desktopListeners) {
    writer.write(payload).catch(() => {
      room.desktopListeners.delete(writer);
    });
  }
  return 'ok';
}

/**
 * Envia estado a todos los listeners mobile de la sala.
 * Rate limited a 30 actualizaciones por segundo por sala.
 */
export function broadcastToMobile(
  pin: string,
  state: RemoteState,
): 'ok' | 'rate_limited' | 'not_found' {
  const room = checkExpiry(pin);
  if (!room) return 'not_found';

  // Rate limiting: mantener solo timestamps del ultimo segundo
  const now = Date.now();
  room.stateTimestamps = room.stateTimestamps.filter((t) => now - t < 1000);
  if (room.stateTimestamps.length >= STATE_RATE_LIMIT) {
    return 'rate_limited';
  }
  room.stateTimestamps.push(now);

  room.state = state;
  room.lastActivity = now;

  const payload = encodeSSE('state', state);
  for (const writer of room.mobileListeners) {
    writer.write(payload).catch(() => {
      room.mobileListeners.delete(writer);
    });
  }
  return 'ok';
}

// Limpieza periodica de salas expiradas cada 5 minutos
if (typeof globalThis !== 'undefined') {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [pin, room] of rooms) {
      if (now - room.lastActivity > EXPIRY_MS) {
        rooms.delete(pin);
      }
    }
    // Limpiar IP rate limits inactivos
    for (const [ip, timestamps] of ipRateLimits) {
      const recent = timestamps.filter((t) => now - t < 60_000);
      if (recent.length === 0) {
        ipRateLimits.delete(ip);
      } else {
        ipRateLimits.set(ip, recent);
      }
    }
  }, CLEANUP_INTERVAL).unref?.();
}
