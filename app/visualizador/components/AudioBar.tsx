'use client';

/**
 * Barra inferior de audio para el Visualizador de Himnos.
 * Contiene play/pause, selector de pistas, barra de progreso (seek) y tiempo.
 * El elemento <audio> persiste durante la vida del componente para evitar
 * remontajes al cambiar diapositivas dentro del mismo himno (Research pitfall 5).
 */

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Music } from 'lucide-react';
import type { HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import {
  Button,
  Slider,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/shadcn/ui';

/** Etiquetas en espanol para cada campo de audio */
const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

/** Campos de audio que no son reproducibles directamente en el navegador */
const NON_PLAYABLE = new Set(['midi_file']);

/** Orden preferido de pistas (track_only primero per D-18) */
const TRACK_PREFERENCE = [
  'track_only',
  'soprano_voice',
  'alto_voice',
  'tenor_voice',
  'bass_voice',
];

/** Formatea segundos a m:ss */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Obtiene las pistas disponibles (no-null, reproducibles) de un HymnAudioFiles */
function getAvailableTracks(
  audio: HymnAudioFiles | null
): { field: string; label: string }[] {
  if (!audio) return [];
  return Object.entries(audio)
    .filter(
      ([field, info]) => info !== null && !NON_PLAYABLE.has(field)
    )
    .map(([field]) => ({ field, label: AUDIO_LABELS[field] ?? field }));
}

interface AudioBarProps {
  /** Archivos de audio del himno actual, null si no hay himno seleccionado */
  hymnAudio: HymnAudioFiles | null;
  /** ID del himno actual (para detectar cambios de himno per D-20) */
  hymnId: string | null;
  /** Campo de pista activa (e.g. 'track_only') */
  activeTrackField: string | null;
  /** Si el audio esta reproduciendose */
  playing: boolean;
  /** Callback cuando se cambia de pista */
  onTrackChange: (trackField: string) => void;
  /** Callback cuando cambia el estado de reproduccion */
  onPlayingChange: (playing: boolean) => void;
}

/** Handle expuesto via ref para controlar el audio desde el padre */
export interface AudioBarHandle {
  restart: () => void;
}

const AudioBar = forwardRef<AudioBarHandle, AudioBarProps>(function AudioBar({
  hymnAudio,
  hymnId,
  activeTrackField,
  playing,
  onTrackChange,
  onPlayingChange,
}, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevHymnIdRef = useRef<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const availableTracks = getAvailableTracks(hymnAudio);
  const hasAudio = availableTracks.length > 0;
  const hasHymn = hymnId !== null;

  // Detectar cambio de himno: pausar, resetear progreso, seleccionar pista default
  useEffect(() => {
    if (hymnId === prevHymnIdRef.current) return;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    onPlayingChange(false);

    prevHymnIdRef.current = hymnId;

    // Seleccionar pista por defecto si hay audio disponible
    if (hymnId && hymnAudio) {
      const tracks = getAvailableTracks(hymnAudio);
      if (tracks.length > 0) {
        // Preferir track_only primero (D-18), luego el orden definido
        const defaultTrack =
          TRACK_PREFERENCE.find(
            (f) =>
              hymnAudio[f as keyof HymnAudioFiles] !== null &&
              !NON_PLAYABLE.has(f)
          ) ?? tracks[0].field;
        onTrackChange(defaultTrack);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hymnId, hymnAudio]);

  // Actualizar src del audio cuando cambia la pista activa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (
      activeTrackField &&
      hymnAudio &&
      hymnAudio[activeTrackField as keyof HymnAudioFiles]
    ) {
      const fileInfo =
        hymnAudio[activeTrackField as keyof HymnAudioFiles]!;
      const newSrc = `/api/hymns/audio/${fileInfo.id}`;
      if (audio.src !== newSrc && !audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
        audio.load();
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [activeTrackField, hymnAudio]);

  // Sincronizar play/pause con el prop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (playing) {
      audio.play().catch(() => {
        // Autoplay bloqueado por el navegador
        onPlayingChange(false);
      });
    } else {
      audio.pause();
    }
  }, [playing, onPlayingChange]);

  // Handlers de eventos del elemento audio
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  }, []);

  const handleEnded = useCallback(() => {
    onPlayingChange(false);
    setProgress(0);
    setCurrentTime(0);
  }, [onPlayingChange]);

  const handlePlay = useCallback(() => {
    onPlayingChange(true);
  }, [onPlayingChange]);

  const handlePause = useCallback(() => {
    onPlayingChange(false);
  }, [onPlayingChange]);

  // Seek: cuando el usuario mueve el slider
  const handleSeek = useCallback(
    (value: number[]) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setProgress(value[0]);
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Reiniciar pista al inicio
  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
  }, []);

  // Exponer restart via ref para control remoto
  useImperativeHandle(ref, () => ({ restart: handleRestart }), [handleRestart]);

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    onPlayingChange(!playing);
  }, [playing, onPlayingChange]);

  // Pista activa label
  const activeLabel =
    activeTrackField ? (AUDIO_LABELS[activeTrackField] ?? activeTrackField) : 'Seleccionar';

  const isDisabled = !hasHymn || !hasAudio;

  return (
    <motion.div
      initial={{ y: 72 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-[72px] flex-shrink-0 border-t border-border bg-card"
    >
      {/* Elemento audio persistente (sin UI nativa) */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      <div
        className={`flex h-full items-center px-4 gap-4 ${
          isDisabled ? 'opacity-50' : ''
        }`}
      >
        {/* Restart + Play/Pause */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={handleRestart}
                  aria-label="Reiniciar pista"
                  className="h-9 w-9"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Reiniciar pista</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={handleTogglePlay}
                  aria-label={playing ? 'Pausar' : 'Reproducir'}
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{playing ? 'Pausar' : 'Reproducir'} (P)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Track selector */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground leading-none">
            Pista de audio
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDisabled}
                className="h-7 text-xs min-w-[120px] justify-between"
              >
                <Music className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{activeLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableTracks.map((track) => (
                <DropdownMenuItem
                  key={track.field}
                  onClick={() => onTrackChange(track.field)}
                  className={
                    track.field === activeTrackField ? 'bg-accent' : ''
                  }
                >
                  {track.label}
                </DropdownMenuItem>
              ))}
              {availableTracks.length === 0 && (
                <DropdownMenuItem disabled>
                  Sin pistas disponibles
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Seek bar */}
        <div className="flex-1 min-w-0 flex items-center h-[44px]">
          {hasHymn && !hasAudio ? (
            <span className="text-xs text-muted-foreground">
              Sin pistas de audio disponibles para este himno.
            </span>
          ) : (
            <Slider
              min={0}
              max={100}
              step={0.1}
              value={[progress]}
              onValueChange={handleSeek}
              disabled={isDisabled}
              aria-label="Progreso de audio"
              className="w-full"
            />
          )}
        </div>

        {/* Time display */}
        <span className="text-xs tabular-nums text-muted-foreground flex-shrink-0 min-w-[70px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </motion.div>
  );
});

export default AudioBar;
