'use client';

import type { PlaylistHymn } from '../lib/types';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';

interface PlaylistColumnProps {
  playlist: PlaylistHymn[];
  activeHymnIndex: number;
  onSelectHymn: (index: number) => void;
  onRemoveHymn: (index: number) => void;
  onReorderPlaylist: (from: number, to: number) => void;
  onAddHymn: (hymn: HymnSearchResult) => void;
}

/**
 * Columna izquierda: busqueda de himnos y lista de reproduccion con drag-and-drop.
 * Implementacion completa en Task 2.
 */
export function PlaylistColumn(_props: PlaylistColumnProps) {
  return <div className="h-full" />;
}
