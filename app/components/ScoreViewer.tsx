'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { Skeleton, Separator } from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';
import { useVerovio } from '@/app/hooks/useVerovio';
import { useSpessaSynth } from '@/app/hooks/useSpessaSynth';
import { useScoreCursor } from '@/app/hooks/useScoreCursor';
import ScoreToolbar from './ScoreToolbar';
import ScoreViewerControls from './ScoreViewerControls';

interface ScoreViewerProps {
  musicxmlFileId: string;
  midiFileId?: string;
  className?: string;
}

const DEFAULT_SCALE = 40;
const MIN_SCALE = 20;
const MAX_SCALE = 80;
const SCALE_STEP = 10;
const SEEK_STEP = 5; // segundos

/** CSS para resaltar notas activas durante playback (per UI-SPEC) */
const CURSOR_CSS = `.score-container g.note.playing { fill: hsl(var(--primary)); transition: fill 0.05s ease; } .score-container g.note.playing rect { fill: hsl(var(--primary) / 0.15); }`;

export default function ScoreViewer({ musicxmlFileId, midiFileId, className }: ScoreViewerProps) {
  // ── Hooks ──
  const {
    toolkit,
    isLoading: verovioLoading,
    error: verovioError,
    loadScore,
    renderPage,
    getPageCount,
    setScale: setVerovioScale,
  } = useVerovio();

  const {
    synth,
    sequencer,
    isLoading: sfLoading,
    loadProgress,
    error: sfError,
    loadSoundFont,
    initSynth,
    loadMidi,
    play: spessaPlay,
    pause,
    seek,
    duration,
    currentTime,
    isPlaying,
  } = useSpessaSynth();

  // ── State ──
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [scoreLoaded, setScoreLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [xmlError, setXmlError] = useState<string | null>(null);

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreContainerRef = useRef<HTMLDivElement>(null);
  const midiBase64Ref = useRef<string | null>(null);

  // ── Page change callback para useScoreCursor ──
  const handlePageChange = useCallback((page: number) => {
    if (!toolkit) return;
    const svg = renderPage(page);
    setSvgContent(svg);
    setCurrentPage(page);
    // Auto-scroll al top de la pagina nueva
    scoreContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toolkit, renderPage]);

  // ── Cursor sync ──
  const { currentPage: cursorPage } = useScoreCursor({
    toolkit,
    sequencer,
    isPlaying,
    containerRef,
    onPageChange: handlePageChange,
  });

  // Sincronizar currentPage desde cursor durante playback
  useEffect(() => {
    if (isPlaying && cursorPage > 0) {
      setCurrentPage(cursorPage);
    }
  }, [cursorPage, isPlaying]);

  // ── Responsive scale con ResizeObserver ──
  useEffect(() => {
    const container = scoreContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      let newScale = DEFAULT_SCALE;
      if (width < 640) newScale = 30;
      else if (width <= 1024) newScale = 35;
      else newScale = 40;

      setScale(newScale);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── Fetch MusicXML cuando toolkit esta listo ──
  useEffect(() => {
    if (!toolkit || verovioLoading || scoreLoaded) return;

    let cancelled = false;

    async function fetchAndLoad() {
      setXmlLoading(true);
      setXmlError(null);

      try {
        const response = await fetch(`/api/hymns/score/${musicxmlFileId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xmlText = await response.text();

        if (cancelled) return;

        const loaded = loadScore(xmlText);
        if (!loaded) {
          setXmlError('No se pudo procesar el archivo MusicXML');
          setXmlLoading(false);
          return;
        }

        const firstSvg = renderPage(1);
        const pages = getPageCount();

        setSvgContent(firstSvg);
        setPageCount(pages);
        setCurrentPage(1);
        setScoreLoaded(true);
        setXmlLoading(false);

        // Precargar SoundFont en paralelo
        loadSoundFont();
      } catch (err) {
        if (cancelled) return;
        console.error('Error cargando MusicXML:', err);
        setXmlError('No se pudo cargar la partitura. Intenta recargar la pagina.');
        setXmlLoading(false);
      }
    }

    fetchAndLoad();
    return () => { cancelled = true; };
  }, [toolkit, verovioLoading, scoreLoaded, musicxmlFileId, loadScore, renderPage, getPageCount, loadSoundFont]);

  // ── Cargar MIDI del himno (Directus) en sequencer cuando SoundFont esta listo ──
  useEffect(() => {
    if (!synth || !scoreLoaded) return;

    if (!midiFileId) {
      console.warn('No hay archivo MIDI disponible para este himno');
      return;
    }

    fetch(`/api/hymns/audio/${midiFileId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        if (base64.startsWith('TVRoZA')) {
          loadMidi(base64);
        } else {
          console.warn('El archivo MIDI de Directus no tiene header válido');
        }
      })
      .catch((err) => console.warn('No se pudo cargar MIDI de Directus:', err));
  }, [synth, scoreLoaded, midiFileId, loadMidi]);

  // ── Zoom handlers ──
  const handleZoomIn = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.min(prev + SCALE_STEP, MAX_SCALE);
      if (scoreContainerRef.current && toolkit) {
        setVerovioScale(newScale, scoreContainerRef.current.clientWidth);
        const svg = renderPage(currentPage);
        setSvgContent(svg);
        setPageCount(getPageCount());
      }
      return newScale;
    });
  }, [toolkit, setVerovioScale, renderPage, currentPage, getPageCount]);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - SCALE_STEP, MIN_SCALE);
      if (scoreContainerRef.current && toolkit) {
        setVerovioScale(newScale, scoreContainerRef.current.clientWidth);
        const svg = renderPage(currentPage);
        setSvgContent(svg);
        setPageCount(getPageCount());
      }
      return newScale;
    });
  }, [toolkit, setVerovioScale, renderPage, currentPage, getPageCount]);

  const handleZoomReset = useCallback(() => {
    setScale(DEFAULT_SCALE);
    if (scoreContainerRef.current && toolkit) {
      setVerovioScale(DEFAULT_SCALE, scoreContainerRef.current.clientWidth);
      const svg = renderPage(currentPage);
      setSvgContent(svg);
      setPageCount(getPageCount());
    }
  }, [toolkit, setVerovioScale, renderPage, currentPage, getPageCount]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case ' ':
        e.preventDefault(); // Evitar scroll con espacio
        if (isPlaying) pause();
        else play();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seek(Math.max(0, currentTime - SEEK_STEP));
        break;
      case 'ArrowRight':
        e.preventDefault();
        seek(Math.min(duration, currentTime + SEEK_STEP));
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
      case '0':
        e.preventDefault();
        handleZoomReset();
        break;
    }
  }, [isPlaying, play, pause, seek, currentTime, duration, handleZoomIn, handleZoomOut, handleZoomReset]);

  // ── Render: WASM loading ──
  if (verovioLoading) {
    return (
      <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
        <Skeleton className="h-[400px] w-full bg-muted/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando motor de partitura...</p>
          </div>
        </Skeleton>
      </div>
    );
  }

  // ── Render: WASM error ──
  if (verovioError) {
    return (
      <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
        <div className="bg-destructive/10 border-destructive/20 border p-4 rounded-lg m-4">
          <p className="text-sm text-destructive">
            No se pudo cargar el visor de partituras. Intenta recargar la pagina.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: MusicXML loading ──
  if (xmlLoading) {
    return (
      <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
        <Skeleton className="h-[400px] w-full bg-muted/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando partitura...</p>
          </div>
        </Skeleton>
      </div>
    );
  }

  // ── Render: MusicXML error ──
  if (xmlError) {
    return (
      <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScrollText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{xmlError}</p>
        </div>
      </div>
    );
  }

  // ── Render: Score ──
  return (
    <div
      className={cn('flex flex-col border rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <ScoreToolbar
        scale={scale}
        pageCount={pageCount}
        currentPage={currentPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />
      <Separator />
      <div
        ref={scoreContainerRef}
        className="score-container relative overflow-y-auto"
        style={{ minHeight: '400px', maxHeight: '70vh' }}
      >
        <style>{CURSOR_CSS}</style>
        <div
          ref={containerRef}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
      <ScoreViewerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isLoading={sfLoading}
        loadProgress={loadProgress}
        error={sfError}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
      />
    </div>
  );
}
