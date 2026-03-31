'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';
import { useVisualizador } from './hooks/useVisualizador';
import { PlaylistColumn } from './components/PlaylistColumn';
import { SlideGridColumn } from './components/SlideGridColumn';

/**
 * Pagina principal del Visualizador de Himnos.
 * Panel de control con layout de 3 columnas:
 *   - Izquierda (280px): playlist con busqueda y drag-and-drop
 *   - Centro (flex): grilla de diapositivas del himno activo
 *   - Derecha (320px): vista previa en vivo (Plan 03)
 * Barra inferior (72px): controles de audio (Plan 04)
 */
export default function VisualizadorPage() {
  const { state, dispatch } = useVisualizador();
  const detailsCache = useRef<Map<string, HymnForPdf>>(new Map());
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Detectar viewport minimo de 1024px
  useEffect(() => {
    const checkWidth = () => setIsSmallScreen(window.innerWidth < 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Agregar himno: buscar detalle completo, luego dispatch ADD_HYMN
  const handleAddHymn = useCallback(
    async (result: HymnSearchResult) => {
      // Evitar duplicados en la playlist
      if (state.playlist.some((h) => h.id === result.id)) return;

      try {
        let hymnData = detailsCache.current.get(result.id);
        if (!hymnData) {
          const res = await fetch(`/api/hymns/${result.id}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          hymnData = json.data as HymnForPdf;
          detailsCache.current.set(result.id, hymnData);
        }
        dispatch({ type: 'ADD_HYMN', hymn: hymnData });
      } catch (err) {
        console.error('Error al obtener detalle del himno:', err);
      }
    },
    [state.playlist, dispatch],
  );

  const handleSelectHymn = useCallback(
    (index: number) => dispatch({ type: 'SET_ACTIVE_HYMN', index }),
    [dispatch],
  );

  const handleRemoveHymn = useCallback(
    (index: number) => dispatch({ type: 'REMOVE_HYMN', index }),
    [dispatch],
  );

  const handleReorderPlaylist = useCallback(
    (from: number, to: number) =>
      dispatch({ type: 'REORDER_PLAYLIST', from, to }),
    [dispatch],
  );

  const handleSelectSlide = useCallback(
    (index: number) => dispatch({ type: 'SET_ACTIVE_SLIDE', index }),
    [dispatch],
  );

  // Guardia de viewport minimo
  if (isSmallScreen) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-foreground">
            Pantalla muy pequena
          </h1>
          <p className="text-muted-foreground">
            El visualizador requiere una pantalla de al menos 1024px de ancho.
            Use una computadora de escritorio o portatil.
          </p>
        </div>
      </div>
    );
  }

  const activeHymn =
    state.activeHymnIndex >= 0
      ? state.playlist[state.activeHymnIndex]
      : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Area principal: 3 columnas */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Columna izquierda: Playlist */}
        <div className="w-[280px] flex-shrink-0 border-r border-border">
          <PlaylistColumn
            playlist={state.playlist}
            activeHymnIndex={state.activeHymnIndex}
            onSelectHymn={handleSelectHymn}
            onRemoveHymn={handleRemoveHymn}
            onReorderPlaylist={handleReorderPlaylist}
            onAddHymn={handleAddHymn}
          />
        </div>

        {/* Columna central: Grilla de diapositivas */}
        <div className="flex-1 min-w-0 border-r border-border">
          <SlideGridColumn
            slides={activeHymn?.slides ?? []}
            activeSlideIndex={state.activeSlideIndex}
            onSelectSlide={handleSelectSlide}
            hymnName={activeHymn?.hymnData.name ?? ''}
          />
        </div>

        {/* Columna derecha: Vista previa en vivo (Plan 03) */}
        <div className="w-[320px] flex-shrink-0 flex items-center justify-center text-muted-foreground text-sm">
          Vista previa en vivo
        </div>
      </div>

      {/* Barra inferior: Controles de audio (Plan 04) */}
      <div className="h-[72px] flex-shrink-0 border-t border-border flex items-center justify-center text-muted-foreground text-sm">
        Barra de audio
      </div>
    </div>
  );
}
