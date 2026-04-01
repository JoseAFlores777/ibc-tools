'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import type { HymnForPdf, HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import { useVisualizador } from './hooks/useVisualizador';
import { useBroadcastChannel } from './hooks/useBroadcastChannel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemePersistence, usePlaylistPersistence, loadTheme, loadPlaylistIds } from './hooks/useThemePersistence';
import { useRemoteRoom } from './hooks/useRemoteRoom';
import type { ThemeConfig } from './lib/types';
import type { RemoteCommand, RemoteState, RemotePlaylistHymn, RemoteSlide } from './lib/remote-types';
import { PlaylistColumn } from './components/PlaylistColumn';
import { SlideGridColumn } from './components/SlideGridColumn';
import LivePreviewColumn from './components/LivePreviewColumn';
import AudioBar from './components/AudioBar';
import LocalStorageWarning from '@/app/components/LocalStorageWarning';
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

  // Persistir tema y playlist en IndexedDB (debounced 500ms)
  useThemePersistence(state.theme);
  usePlaylistPersistence(state.playlist);

  // Restaurar tema y playlist desde IndexedDB al montar
  useEffect(() => {
    loadTheme().then((savedTheme) => {
      dispatch({ type: 'LOAD_THEME', theme: savedTheme });
    });

    loadPlaylistIds().then(async (ids) => {
      if (ids.length === 0) return;
      for (const id of ids) {
        try {
          let hymnData = detailsCache.current.get(id);
          if (!hymnData) {
            const res = await fetch(`/api/hymns/${id}`);
            if (!res.ok) continue;
            const json = await res.json();
            hymnData = json.data as HymnForPdf;
            detailsCache.current.set(id, hymnData);
          }
          dispatch({ type: 'ADD_HYMN', hymn: hymnData });
        } catch {
          // Skip hymns that fail to load
        }
      }
    });
  }, [dispatch]);

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

  // Modos de proyeccion: mutuamente excluyentes, seleccionar diapositiva vuelve a 'slide'
  const handleBlack = useCallback(() => {
    dispatch({ type: 'SET_PROJECTION_MODE', mode: 'black' });
  }, [dispatch]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'SET_PROJECTION_MODE', mode: 'clear' });
  }, [dispatch]);

  const handleLogo = useCallback(() => {
    dispatch({ type: 'SET_PROJECTION_MODE', mode: 'logo' });
  }, [dispatch]);

  const handleFontSizeUp = useCallback(() => {
    dispatch({ type: 'FONT_SIZE_UP' });
  }, [dispatch]);

  const handleFontSizeDown = useCallback(() => {
    dispatch({ type: 'FONT_SIZE_DOWN' });
  }, [dispatch]);

  const handleThemeChange = useCallback(
    (partial: Partial<ThemeConfig>) => {
      dispatch({ type: 'SET_THEME', theme: partial });
    },
    [dispatch],
  );

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

  // Audio: derivar datos del himno activo
  const currentHymnAudio: HymnAudioFiles | null =
    activeHymn?.hymnData.audioFiles ?? null;
  const currentHymnId: string | null = activeHymn?.id ?? null;

  const handleTrackChange = useCallback(
    (trackField: string) => {
      if (!currentHymnId) return;
      dispatch({ type: 'SET_AUDIO_TRACK', hymnId: currentHymnId, trackField });
    },
    [currentHymnId, dispatch],
  );

  const handlePlayingChange = useCallback(
    (playing: boolean) => {
      dispatch({ type: 'SET_AUDIO_PLAYING', playing });
    },
    [dispatch],
  );

  // Toggle play/pause para atajos de teclado
  const togglePlayPause = useCallback(() => {
    dispatch({ type: 'SET_AUDIO_PLAYING', playing: !state.audio.playing });
  }, [state.audio.playing, dispatch]);

  // Registrar atajos de teclado globales
  useKeyboardShortcuts({
    dispatch,
    togglePlayPause,
    projectionOpen: state.projectionOpen,
  });

  // Control remoto: mapear comandos del movil a dispatch
  const handleRemoteCommand = useCallback(
    (cmd: RemoteCommand) => {
      switch (cmd.type) {
        case 'NEXT_SLIDE':
          dispatch({ type: 'NEXT_SLIDE' });
          break;
        case 'PREV_SLIDE':
          dispatch({ type: 'PREV_SLIDE' });
          break;
        case 'SET_SLIDE':
          dispatch({ type: 'SET_ACTIVE_SLIDE', index: cmd.index });
          break;
        case 'SET_HYMN':
          dispatch({ type: 'SET_ACTIVE_HYMN', index: cmd.index });
          break;
        case 'SET_PROJECTION_MODE':
          dispatch({ type: 'SET_PROJECTION_MODE', mode: cmd.mode });
          break;
        case 'SET_AUDIO_PLAYING':
          dispatch({ type: 'SET_AUDIO_PLAYING', playing: cmd.playing });
          break;
        case 'SET_AUDIO_TRACK': {
          const hymnId = state.playlist[state.activeHymnIndex]?.id;
          if (hymnId) dispatch({ type: 'SET_AUDIO_TRACK', hymnId, trackField: cmd.trackField });
          break;
        }
      }
    },
    [dispatch, state.activeHymnIndex, state.playlist],
  );

  const { pin, connected, pushState } = useRemoteRoom({
    onCommand: handleRemoteCommand,
  });

  // Enviar estado remoto a moviles cuando cambia
  useEffect(() => {
    const AUDIO_FIELDS = ['track_only', 'soprano_voice', 'alto_voice', 'tenor_voice', 'bass_voice'] as const;

    const playlist: RemotePlaylistHymn[] = state.playlist.map((h) => ({
      id: h.id,
      name: h.hymnData.name,
      hymnNumber: h.hymnData.hymn_number,
      slideCount: h.slides.length,
      slideLabels: h.slides.map((s) => s.verseLabel),
      slides: h.slides.map((s): RemoteSlide => ({
        label: s.verseLabel,
        text: s.text,
        isIntro: !!s.intro,
      })),
      audioTracks: AUDIO_FIELDS.filter((f) => {
        const files = h.hymnData.audioFiles;
        return files && (files as unknown as Record<string, unknown>)[f] != null;
      }),
    }));

    const remoteState: RemoteState = {
      activeHymnIndex: state.activeHymnIndex,
      activeHymnName: activeHymn?.hymnData.name ?? '',
      activeSlideLabel: currentSlide?.label ?? '',
      activeSlideIndex: state.activeSlideIndex,
      totalSlides: activeHymn?.slides.length ?? 0,
      projectionMode: state.projectionMode,
      audioPlaying: state.audio.playing,
      audioTrackField: state.audio.trackField,
      playlist,
    };
    pushState(remoteState);
  }, [
    state.activeHymnIndex,
    state.activeSlideIndex,
    state.projectionMode,
    state.audio.playing,
    state.audio.trackField,
    state.playlist,
    activeHymn,
    currentSlide,
    pushState,
  ]);

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
      <LocalStorageWarning tool="visualizador" />
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
            theme={state.theme}
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
            onThemeChange={handleThemeChange}
            remotePin={pin}
            remoteConnected={connected}
          />
        </div>
      </div>

      {/* Barra inferior: Controles de audio */}
      <AudioBar
        hymnAudio={currentHymnAudio}
        hymnId={currentHymnId}
        activeTrackField={state.audio.trackField}
        playing={state.audio.playing}
        onTrackChange={handleTrackChange}
        onPlayingChange={handlePlayingChange}
      />
    </div>
  );
}
