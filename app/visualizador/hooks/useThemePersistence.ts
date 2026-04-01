'use client';

/**
 * IndexedDB persistence for visualizador settings.
 * Saves/loads ThemeConfig and playlist (hymn IDs) so user
 * preferences and song list survive page reloads.
 * Uses unified ibc-db service.
 */

import { useEffect, useCallback, useRef } from 'react';
import type { ThemeConfig, PlaylistHymn } from '../lib/types';
import { DEFAULT_THEME } from '../lib/theme-presets';
import { getKey, setKey } from '@/app/lib/ibc-db';

const STORE = 'visualizador';
const THEME_KEY = 'theme';
const PLAYLIST_KEY = 'playlist';

/** Load saved theme from IndexedDB. Returns DEFAULT_THEME if none saved. */
export async function loadTheme(): Promise<ThemeConfig> {
  const saved = await getKey<Partial<ThemeConfig>>(STORE, THEME_KEY);
  return saved ? { ...DEFAULT_THEME, ...saved } : { ...DEFAULT_THEME };
}

/** Load saved playlist hymn IDs from IndexedDB. */
export async function loadPlaylistIds(): Promise<string[]> {
  const saved = await getKey<string[]>(STORE, PLAYLIST_KEY);
  return Array.isArray(saved) ? saved : [];
}

/** Save playlist hymn IDs to IndexedDB. */
async function savePlaylistIds(ids: string[]): Promise<void> {
  await setKey(STORE, PLAYLIST_KEY, ids);
}

/** Save theme to IndexedDB. */
async function saveTheme(theme: ThemeConfig): Promise<void> {
  await setKey(STORE, THEME_KEY, theme);
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
