'use client';

/**
 * IndexedDB persistence for visualizador settings.
 * Saves/loads ThemeConfig and playlist (hymn IDs) so user
 * preferences and song list survive page reloads.
 */

import { useEffect, useCallback, useRef } from 'react';
import type { ThemeConfig, PlaylistHymn } from '../lib/types';
import { DEFAULT_THEME } from '../lib/theme-presets';

const DB_NAME = 'ibc-visualizador';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const THEME_KEY = 'theme';
const PLAYLIST_KEY = 'playlist';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getKey<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setKey(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
  } catch {
    // Best-effort
  }
}

/** Load saved theme from IndexedDB. Returns DEFAULT_THEME if none saved. */
export async function loadTheme(): Promise<ThemeConfig> {
  const saved = await getKey<Partial<ThemeConfig>>(THEME_KEY);
  return saved ? { ...DEFAULT_THEME, ...saved } : { ...DEFAULT_THEME };
}

/** Load saved playlist hymn IDs from IndexedDB. */
export async function loadPlaylistIds(): Promise<string[]> {
  const saved = await getKey<string[]>(PLAYLIST_KEY);
  return Array.isArray(saved) ? saved : [];
}

/** Save playlist hymn IDs to IndexedDB. */
async function savePlaylistIds(ids: string[]): Promise<void> {
  await setKey(PLAYLIST_KEY, ids);
}

/** Save theme to IndexedDB. */
async function saveTheme(theme: ThemeConfig): Promise<void> {
  await setKey(THEME_KEY, theme);
}

/**
 * Hook that auto-saves theme changes to IndexedDB.
 */
export function useThemePersistence(theme: ThemeConfig) {
  const save = useCallback(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(save, 500);
    return () => clearTimeout(timer);
  }, [save]);
}

/**
 * Hook that auto-saves playlist hymn IDs to IndexedDB.
 */
export function usePlaylistPersistence(playlist: PlaylistHymn[]) {
  const prevIdsRef = useRef('');

  useEffect(() => {
    const ids = playlist.map((h) => h.id);
    const key = ids.join(',');
    // Solo guardar si cambio
    if (key === prevIdsRef.current) return;
    prevIdsRef.current = key;

    const timer = setTimeout(() => savePlaylistIds(ids), 500);
    return () => clearTimeout(timer);
  }, [playlist]);
}
