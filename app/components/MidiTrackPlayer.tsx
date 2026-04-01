'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download, Loader2, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';
import type { AudioFileInfo } from '@/app/interfaces/Hymn.interface';

/**
 * Reproductor MIDI: descarga el .mid de Directus, lo parsea con @tonejs/midi,
 * renderiza cada track a AudioBuffer con Tone.Offline, y los reproduce
 * con Web Audio API (un GainNode por track para mute individual).
 */

interface MidiTrackPlayerProps {
  field: string;
  fileInfo: AudioFileInfo;
  label: string;
  colorClass: string;
}

interface MidiTrackInfo {
  index: number;
  name: string;
  instrument: string;
  family: string;
  channel: number;
  noteCount: number;
  muted: boolean;
}

const INSTRUMENT_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-lime-100 text-lime-700 border-lime-200',
];

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function MidiTrackPlayer({ field, fileInfo, label, colorClass }: MidiTrackPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tracks, setTracks] = useState<MidiTrackInfo[]>([]);
  const [showTracks, setShowTracks] = useState(false);

  // Audio buffers pre-renderizados (uno por track)
  const trackBuffersRef = useRef<AudioBuffer[]>([]);
  // Web Audio API nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<GainNode[]>([]);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const rafRef = useRef<number>(0);
  const playStartTimeRef = useRef(0);   // audioCtx.currentTime al iniciar
  const playOffsetRef = useRef(0);      // offset en segundos (para seek/resume)
  const durationRef = useRef(0);

  const audioUrl = `/api/hymns/audio/${fileInfo.id}`;

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopSources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopSources() {
    sourceNodesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
      try { s.disconnect(); } catch {}
    });
    sourceNodesRef.current = [];
  }

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  /** Descarga MIDI, parsea tracks, renderiza cada uno a AudioBuffer offline */
  const loadMidi = useCallback(async () => {
    if (trackBuffersRef.current.length > 0) return;
    setStatus('loading');
    try {
      const [ToneMod, MidiMod, response] = await Promise.all([
        import('tone'),
        import('@tonejs/midi'),
        fetch(audioUrl),
      ]);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { Midi } = MidiMod;
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      const midiDuration = midi.duration + 0.5; // pequeño margen para release
      durationRef.current = midi.duration;
      setDuration(midi.duration);

      // Extraer tracks con notas
      const activeTracks = midi.tracks.filter((t: any) => t.notes.length > 0);

      const trackInfos: MidiTrackInfo[] = activeTracks.map((track: any, i: number) => ({
        index: i,
        name: track.name || `Canal ${track.channel + 1}`,
        instrument: track.instrument?.name || 'Piano acústico',
        family: track.instrument?.family || 'piano',
        channel: track.channel,
        noteCount: track.notes.length,
        muted: false,
      }));

      setTracks(trackInfos);
      if (trackInfos.length > 1) setShowTracks(true);

      // Renderizar cada track a AudioBuffer offline
      const buffers = await Promise.all(
        activeTracks.map(async (track: any) => {
          const toneBuffer = await ToneMod.Offline(({ transport }: any) => {
            const synth = new ToneMod.PolySynth(ToneMod.Synth, {
              oscillator: { type: 'triangle8' as any },
              envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.2 },
              volume: -8,
            }).toDestination();
            synth.maxPolyphony = 32;

            // Programar todas las notas del track
            track.notes.forEach((note: any) => {
              synth.triggerAttackRelease(
                note.name,
                note.duration,
                note.time,
                note.velocity,
              );
            });
          }, midiDuration);

          // Convertir ToneAudioBuffer → AudioBuffer nativo
          return toneBuffer.get() as AudioBuffer;
        }),
      );

      trackBuffersRef.current = buffers;

      // Crear GainNodes persistentes (uno por track, para mute)
      const ctx = getAudioCtx();
      gainNodesRef.current = buffers.map(() => {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        return gain;
      });

      setStatus('ready');
    } catch (err) {
      console.error('Error cargando MIDI:', err);
      setStatus('error');
    }
  }, [audioUrl]);

  /** Inicia reproducción desde un offset en segundos */
  const startPlayback = useCallback((fromOffset: number = 0) => {
    const ctx = getAudioCtx();
    stopSources();

    const sources: AudioBufferSourceNode[] = [];
    trackBuffersRef.current.forEach((buffer, i) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNodesRef.current[i]);
      // offset = desde dónde empezar en el buffer
      source.start(0, fromOffset);
      sources.push(source);
    });

    sourceNodesRef.current = sources;
    playStartTimeRef.current = ctx.currentTime;
    playOffsetRef.current = fromOffset;

    // Detectar fin de reproducción
    if (sources.length > 0) {
      sources[0].onended = () => {
        // Solo si no fue interrumpido por stop/pause/seek
        const elapsed = playOffsetRef.current + (ctx.currentTime - playStartTimeRef.current);
        if (elapsed >= durationRef.current - 0.1) {
          cancelAnimationFrame(rafRef.current);
          setStatus('ready');
          setProgress(0);
          setCurrentTime(0);
          playOffsetRef.current = 0;
        }
      };
    }
  }, []);

  const updateProgress = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !durationRef.current) return;

    const elapsed = playOffsetRef.current + (ctx.currentTime - playStartTimeRef.current);
    const pct = Math.min((elapsed / durationRef.current) * 100, 100);
    setProgress(pct);
    setCurrentTime(Math.min(elapsed, durationRef.current));

    if (elapsed < durationRef.current) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (status === 'idle' || status === 'error') {
      await loadMidi();
    }

    if (trackBuffersRef.current.length === 0) return;

    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    if (status === 'playing') {
      // Pause: guardar posición y parar
      cancelAnimationFrame(rafRef.current);
      const elapsed = playOffsetRef.current + (ctx.currentTime - playStartTimeRef.current);
      playOffsetRef.current = Math.min(elapsed, durationRef.current);
      stopSources();
      setStatus('ready');
      return;
    }

    // Play o resume
    const offset = status === 'ready' && playOffsetRef.current > 0
      ? playOffsetRef.current
      : 0;

    startPlayback(offset);
    setStatus('playing');
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [status, loadMidi, startPlayback, updateProgress]);

  const handleStop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopSources();
    playOffsetRef.current = 0;
    setProgress(0);
    setCurrentTime(0);
    setStatus('ready');
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!durationRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = pct * durationRef.current;
    const wasPlaying = status === 'playing';

    cancelAnimationFrame(rafRef.current);
    stopSources();
    playOffsetRef.current = seekTo;
    setProgress(pct * 100);
    setCurrentTime(seekTo);

    if (wasPlaying) {
      startPlayback(seekTo);
      setStatus('playing');
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [status, startPlayback, updateProgress]);

  const toggleMute = useCallback((trackIdx: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.index !== trackIdx) return t;
        const nowMuted = !t.muted;
        const gain = gainNodesRef.current[trackIdx];
        if (gain) gain.gain.value = nowMuted ? 0 : 1;
        return { ...t, muted: nowMuted };
      }),
    );
  }, []);

  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isPaused = status === 'ready' && playOffsetRef.current > 0 && progress > 0;

  return (
    <div className={cn('rounded-xl border transition-all duration-200 overflow-hidden', colorClass)}>
      {/* Controles principales */}
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={isLoading}
          aria-label={
            isLoading ? 'Cargando MIDI...'
            : isPlaying ? `Pausar ${label}`
            : `Reproducir ${label}`
          }
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200',
            'bg-current/10 hover:bg-current/20',
            isLoading && 'opacity-50 cursor-wait',
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {(isPlaying || isPaused) && (
          <button
            type="button"
            onClick={handleStop}
            aria-label={`Detener ${label}`}
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-current/10 hover:bg-current/20 transition-colors duration-200"
          >
            <Square className="h-3 w-3" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] tabular-nums opacity-60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div
            className="py-2 -my-2 cursor-pointer"
            onClick={handleSeek}
            role="slider"
            aria-label={`Progreso de ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="h-1.5 rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-current transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <a
          href={audioUrl}
          download={fileInfo.filename_download || 'midi.mid'}
          aria-label={`Descargar ${label}`}
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-40 hover:opacity-100 hover:bg-black/5 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Panel de instrumentos detectados */}
      {tracks.length > 0 && (
        <div className="border-t border-current/10">
          <button
            type="button"
            onClick={() => setShowTracks(!showTracks)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-medium opacity-60 hover:opacity-100 transition-opacity"
          >
            <span>{tracks.length} instrumento{tracks.length !== 1 ? 's' : ''} detectado{tracks.length !== 1 ? 's' : ''}</span>
            <span>{showTracks ? '▲' : '▼'}</span>
          </button>

          {showTracks && (
            <div className="px-3 pb-3 space-y-1.5">
              {tracks.map((track) => (
                <div
                  key={track.index}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition-all',
                    INSTRUMENT_COLORS[track.index % INSTRUMENT_COLORS.length],
                    track.muted && 'opacity-40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleMute(track.index)}
                    aria-label={track.muted ? `Activar ${track.instrument}` : `Silenciar ${track.instrument}`}
                    className="flex-shrink-0 transition-colors"
                  >
                    {track.muted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <span className={cn('font-semibold truncate', track.muted && 'line-through')}>{track.instrument}</span>
                  {track.name && track.name !== `Canal ${track.channel + 1}` && (
                    <span className="opacity-50 truncate">({track.name})</span>
                  )}
                  <span className="ml-auto opacity-40 flex-shrink-0 tabular-nums">
                    {track.noteCount} notas · Ch {track.channel + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="text-[10px] opacity-60 px-3 pb-2">
          Error al cargar. Clic en play para reintentar.
        </p>
      )}
    </div>
  );
}
