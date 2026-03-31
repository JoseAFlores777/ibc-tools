'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';
import { useVisualizador } from './hooks/useVisualizador';
import { useBroadcastChannel } from './hooks/useBroadcastChannel';
import { PlaylistColumn } from './components/PlaylistColumn';
import { SlideGridColumn } from './components/SlideGridColumn';
import LivePreviewColumn from './components/LivePreviewColumn';
import type { ProjectionMessage } from './lib/projection-channel';

/**
 * Pagina principal del Visualizador de Himnos.
 * Panel de control con layout de 3 columnas:
 *   - Izquierda (280px): playlist con busqueda y drag-and-drop
 *   - Centro (flex): grilla de diapositivas del himno activo
 *   - Derecha (320px): vista previa en vivo con controles de proyeccion
 * Barra inferior (72px): controles de audio (Plan 04)
 */
export default function VisualizadorPage() {
  const { state, dispatch } = useVisualizador();
  const detailsCache = useRef<Map<string, HymnForPdf>>(new Map());
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Refs para la ventana de proyeccion y su monitoreo
  const projWindowRef = useRef<Window | null>(null);
  const projIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolver la diapositiva activa
  const activeHymn =
    state.activeHymnIndex >= 0
      ? state.playlist[state.activeHymnIndex]
      : null;

  const currentSlide =
    activeHymn && state.activeSlideIndex >= 0
      ? activeHymn.slides[state.activeSlideIndex] ?? null
      : null;

  // Ref para acceder al estado actual en el callback del BroadcastChannel
  const stateRef = useRef(state);
  stateRef.current = state;
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  // Manejar mensajes entrantes (PING del projection window)
  const handleChannelMessage = useCallback(
    (msg: ProjectionMessage) => {
      if (msg.type === 'PING') {
        // Responder con estado actual para sincronizar la ventana de proyeccion
        channelSendRef.current?.({
          type: 'PONG',
          slide: currentSlideRef.current,
          theme: stateRef.current.theme,
          mode: stateRef.current.projectionMode,
          fontSize: stateRef.current.theme.fontSizeOffset,
        });
      }
    },
    [],
  );

  const { send } = useBroadcastChannel({ onMessage: handleChannelMessage });
  const channelSendRef = useRef(send);
  channelSendRef.current = send;

  // Detectar viewport minimo de 1024px
  useEffect(() => {
    const checkWidth = () => setIsSmallScreen(window.innerWidth < 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Enviar estado al projection window cuando cambian los datos relevantes
  useEffect(() => {
    if (!state.projectionOpen) return;

    if (state.projectionMode === 'black') {
      send({ type: 'BLACK_SCREEN' });
    } else if (state.projectionMode === 'clear') {
      send({ type: 'CLEAR_TEXT', theme: state.theme });
    } else if (state.projectionMode === 'logo') {
      send({ type: 'SHOW_LOGO', theme: state.theme });
    } else if (currentSlide) {
      send({
        type: 'SHOW_SLIDE',
        slide: currentSlide,
        theme: state.theme,
        fontSize: state.theme.fontSizeOffset,
      });
    }
  }, [
    state.projectionOpen,
    state.projectionMode,
    state.activeSlideIndex,
    state.activeHymnIndex,
    state.theme,
    currentSlide,
    send,
  ]);

  // Limpiar intervalo de monitoreo al desmontar
  useEffect(() => {
    return () => {
      if (projIntervalRef.current) {
        clearInterval(projIntervalRef.current);
      }
    };
  }, []);

  // Abrir/cerrar ventana de proyeccion
  // IMPORTANTE: window.open se llama sincronicamente en el click handler
  // para evitar bloqueadores de popup (Research pitfall 1)
  const handleProjectToggle = useCallback(() => {
    if (state.projectionOpen) {
      // Cerrar ventana de proyeccion
      projWindowRef.current?.close();
      projWindowRef.current = null;
      if (projIntervalRef.current) {
        clearInterval(projIntervalRef.current);
        projIntervalRef.current = null;
      }
      dispatch({ type: 'SET_PROJECTION_OPEN', open: false });
    } else {
      // Abrir ventana de proyeccion (sincronico para evitar popup blocker)
      const win = window.open(
        '/visualizador/proyeccion',
        'ibc-projection',
        'popup=true',
      );
      projWindowRef.current = win;
      dispatch({ type: 'SET_PROJECTION_OPEN', open: true });

      // Monitorear si la ventana se cerro manualmente
      projIntervalRef.current = setInterval(() => {
        if (projWindowRef.current?.closed) {
          projWindowRef.current = null;
          if (projIntervalRef.current) {
            clearInterval(projIntervalRef.current);
            projIntervalRef.current = null;
          }
          dispatch({ type: 'SET_PROJECTION_OPEN', open: false });
        }
      }, 1000);
    }
  }, [state.projectionOpen, dispatch]);

  // Toggle de modos de proyeccion: si ya esta activo, volver a 'slide'
  const handleBlack = useCallback(() => {
    const newMode = state.projectionMode === 'black' ? 'slide' : 'black';
    dispatch({ type: 'SET_PROJECTION_MODE', mode: newMode });
  }, [state.projectionMode, dispatch]);

  const handleClear = useCallback(() => {
    const newMode = state.projectionMode === 'clear' ? 'slide' : 'clear';
    dispatch({ type: 'SET_PROJECTION_MODE', mode: newMode });
  }, [state.projectionMode, dispatch]);

  const handleLogo = useCallback(() => {
    const newMode = state.projectionMode === 'logo' ? 'slide' : 'logo';
    dispatch({ type: 'SET_PROJECTION_MODE', mode: newMode });
  }, [state.projectionMode, dispatch]);

  const handleFontSizeUp = useCallback(() => {
    dispatch({ type: 'FONT_SIZE_UP' });
  }, [dispatch]);

  const handleFontSizeDown = useCallback(() => {
    dispatch({ type: 'FONT_SIZE_DOWN' });
  }, [dispatch]);

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

        {/* Columna derecha: Vista previa en vivo */}
        <div className="w-[320px] flex-shrink-0">
          <LivePreviewColumn
            currentSlide={currentSlide}
            projectionMode={state.projectionMode}
            projectionOpen={state.projectionOpen}
            theme={state.theme}
            onProjectToggle={handleProjectToggle}
            onBlack={handleBlack}
            onClear={handleClear}
            onLogo={handleLogo}
            onFontSizeUp={handleFontSizeUp}
            onFontSizeDown={handleFontSizeDown}
          />
        </div>
      </div>

      {/* Barra inferior: Controles de audio (Plan 04) */}
      <div className="h-[72px] flex-shrink-0 border-t border-border flex items-center justify-center text-muted-foreground text-sm">
        Barra de audio
      </div>
    </div>
  );
}
