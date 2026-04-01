/**
 * IndexedDB service para persistir historial de paquetes de himnos.
 * Almacena configuracion completa para poder re-generar o modificar paquetes anteriores.
 * Usa la base de datos unificada ibc-tools via ibc-db.
 */

import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { openIbcDB, txStore as ibcTxStore } from '@/app/lib/ibc-db';

export interface SavedPackage {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  hymns: Array<{
    id: string;
    name: string;
    hymn_number: number | null;
    hymnalName: string | null;
  }>;
  layout: 'one-per-page' | 'two-per-page';
  style: 'decorated' | 'decorated-eco' | 'plain';
  /** hymn ID -> array of audio field names (serializable version of Map<string, Set<string>>) */
  audioSelections: Record<string, string[]>;
  status: 'completed' | 'draft';
  hymnCount: number;
  audioCount: number;
}

const STORE = 'empaquetador';

function txStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return ibcTxStore(db, STORE, mode);
}

/** Genera un ID corto basado en timestamp */
export function generateId(): string {
  return `pkg-${Date.now().toString(36)}`;
}

/** Genera un nombre descriptivo para el paquete */
export function generateName(hymns: SavedPackage['hymns']): string {
  if (hymns.length === 0) return 'Paquete vacío';
  if (hymns.length === 1) return hymns[0].name;
  if (hymns.length <= 3) return hymns.map((h) => h.hymn_number ?? h.name).join(', ');
  return `${hymns.length} himnos`;
}

/** Convierte Map<string, Set<string>> a Record serializable */
export function serializeAudioSelections(map: Map<string, Set<string>>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, set] of map) {
    if (set.size > 0) result[key] = Array.from(set);
  }
  return result;
}

/** Convierte Record serializable a Map<string, Set<string>> */
export function deserializeAudioSelections(record: Record<string, string[]>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [key, arr] of Object.entries(record)) {
    map.set(key, new Set(arr));
  }
  return map;
}

/** Guarda un paquete nuevo */
export async function savePackage(
  hymns: HymnSearchResult[],
  layout: SavedPackage['layout'],
  style: SavedPackage['style'],
  audioSelections: Map<string, Set<string>>,
  status: SavedPackage['status'] = 'completed',
): Promise<SavedPackage> {
  const db = await openIbcDB();
  const now = new Date().toISOString();

  let audioCount = 0;
  for (const set of audioSelections.values()) audioCount += set.size;

  const pkg: SavedPackage = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    name: generateName(hymns.map((h) => ({
      id: h.id,
      name: h.name,
      hymn_number: h.hymn_number,
      hymnalName: h.hymnal?.name ?? null,
    }))),
    hymns: hymns.map((h) => ({
      id: h.id,
      name: h.name,
      hymn_number: h.hymn_number,
      hymnalName: h.hymnal?.name ?? null,
    })),
    layout,
    style,
    audioSelections: serializeAudioSelections(audioSelections),
    status,
    hymnCount: hymns.length,
    audioCount,
  };

  return new Promise((resolve, reject) => {
    const request = txStore(db, 'readwrite').put(pkg);
    request.onsuccess = () => resolve(pkg);
    request.onerror = () => reject(request.error);
  });
}

/** Actualiza un paquete existente */
export async function updatePackage(pkg: SavedPackage): Promise<void> {
  const db = await openIbcDB();
  pkg.updatedAt = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const request = txStore(db, 'readwrite').put(pkg);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Obtiene todos los paquetes ordenados por fecha (mas reciente primero) */
export async function getAllPackages(): Promise<SavedPackage[]> {
  const db = await openIbcDB();
  return new Promise((resolve, reject) => {
    const request = txStore(db, 'readonly').index('createdAt').getAll();
    request.onsuccess = () => {
      const results = request.result as SavedPackage[];
      results.reverse(); // Mas reciente primero
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Obtiene un paquete por ID */
export async function getPackage(id: string): Promise<SavedPackage | null> {
  const db = await openIbcDB();
  return new Promise((resolve, reject) => {
    const request = txStore(db, 'readonly').get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Elimina un paquete */
export async function deletePackage(id: string): Promise<void> {
  const db = await openIbcDB();
  return new Promise((resolve, reject) => {
    const request = txStore(db, 'readwrite').delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
