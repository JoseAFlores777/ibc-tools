'use client';

/**
 * IndexedDB persistence for visualizador theme settings.
 * Saves/loads ThemeConfig so user preferences survive page reloads.
 */

import { useEffect, useCallback } from 'react';
import type { ThemeConfig } from '../lib/types';
import { DEFAULT_THEME } from '../lib/theme-presets';

const DB_NAME = 'ibc-visualizador';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const THEME_KEY = 'theme';

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

/** Load saved theme from IndexedDB. Returns DEFAULT_THEME if none saved. */
export async function loadTheme(): Promise<ThemeConfig> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(THEME_KEY);
      req.onsuccess = () => {
        const saved = req.result;
        if (saved && typeof saved === 'object') {
          // Merge with defaults to handle new fields added after save
          resolve({ ...DEFAULT_THEME, ...saved });
        } else {
          resolve({ ...DEFAULT_THEME });
        }
      };
      req.onerror = () => resolve({ ...DEFAULT_THEME });
    });
  } catch {
    return { ...DEFAULT_THEME };
  }
}

/** Save theme to IndexedDB */
async function saveTheme(theme: ThemeConfig): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(theme, THEME_KEY);
  } catch {
    // Silently fail — persistence is best-effort
  }
}

/**
 * Hook that auto-saves theme changes to IndexedDB.
 * Call loadTheme() separately on mount to restore.
 */
export function useThemePersistence(theme: ThemeConfig) {
  const save = useCallback(() => {
    saveTheme(theme);
  }, [theme]);

  // Debounce saves: wait 500ms after last change
  useEffect(() => {
    const timer = setTimeout(save, 500);
    return () => clearTimeout(timer);
  }, [save]);
}
