'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download, Loader2, Square, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';
import type { AudioFileInfo } from '@/app/interfaces/Hymn.interface';

interface MidiPlayerProps {
  field: string;
  fileInfo: AudioFileInfo;
  label: string;
  colorClass: string;
  hymnName?: string;
}

interface MidiTrackInfo {
  index: number;
  name: string;
  channel: number;
  noteCount: number;
  muted: boolean;
}

const VOICE_BY_CHANNEL: Record<number, string> = {
  0: 'Soprano', 1: 'Contralto', 2: 'Tenor', 3: 'Bajo',
};

const SF_DB_NAME = 'ibc-audio-cache';
const SF_STORE_NAME = 'files';
const SF_CACHE_KEY = 'ibc-soundfont-v1';

// ── IndexedDB helpers (mismas que useSpessaSynth) ──

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SF_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SF_STORE_NAME)) {
        db.createObjectStore(SF_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getCachedSoundFont(): Promise<ArrayBuffer | null> {
  return openCacheDB().then(
    (db) =>
      new Promise((resolve) => {
        const tx = db.transaction(SF_STORE_NAME, 'readonly');
        const store = tx.objectStore(SF_STORE_NAME);
        const req = store.get(SF_CACHE_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      }),
  );
}

function cacheSoundFont(buffer: ArrayBuffer): Promise<void> {
  return openCacheDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(SF_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SF_STORE_NAME);
        const req = store.put(buffer, SF_CACHE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

/**
 * Reproductor MIDI usando SpessaSynth como motor.
 * Drop-in replacement para MidiTrackPlayer — misma interfaz visual,
 * motor interno cambiado de Tone.js a SpessaSynth.
 */
export default function MidiPlayer({ field, fileInfo, label, colorClass, hymnName }: MidiPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tracks, setTracks] = useState<MidiTrackInfo[]>([]);
  const [showTracks, setShowTracks] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sequencerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);
  const midiBufferRef = useRef<ArrayBuffer | null>(null);

  const audioUrl = `/api/hymns/audio/${fileInfo.id}`;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { sequencerRef.current?.pause(); } catch {}
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, []);

  // ── CARGA ──
  const loadMidi = useCallback(async () => {
    if (sequencerRef.current) return;
    setStatus('loading');
    setLoadingMsg('Descargando SoundFont...');

    try {
      // 1. Cargar SoundFont (cache o fetch)
      let sfBuffer = await getCachedSoundFont();

      if (!sfBuffer) {
        const sfRes = await fetch('/api/hymns/soundfont');
        if (!sfRes.ok) throw new Error(`HTTP ${sfRes.status} al descargar SoundFont`);

        const contentLength = Number(sfRes.headers.get('content-length') ?? 0);
        const reader = sfRes.body?.getReader();
        if (!reader) throw new Error('No se pudo leer el stream de SoundFont');

        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            const pct = Math.round((received / contentLength) * 100);
            setLoadingMsg(`SoundFont ${pct}%...`);
          }
        }
        const combined = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        sfBuffer = combined.buffer;
        await cacheSoundFont(sfBuffer).catch((e) =>
          console.warn('No se pudo cachear SoundFont:', e),
        );
      }

      // 2. Crear AudioContext y worklet
      setLoadingMsg('Inicializando audio...');
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      await ctx.audioWorklet.addModule('/spessasynth_processor.min.js');

      // 3. Crear synth y cargar SoundFont
      const { WorkletSynthesizer, Sequencer } = await import('spessasynth_lib');
      const synth = new WorkletSynthesizer(ctx);
      await synth.soundBankManager.addSoundBank(sfBuffer, 'main');
      await synth.isReady;
      synthRef.current = synth;

      // 4. Descargar MIDI
      setLoadingMsg('Descargando MIDI...');
      const midiRes = await fetch(audioUrl);
      if (!midiRes.ok) throw new Error(`HTTP ${midiRes.status}`);
      const midiBuffer = await midiRes.arrayBuffer();
      midiBufferRef.current = midiBuffer;

      // 5. Crear sequencer y cargar MIDI
      setLoadingMsg('Parseando MIDI...');
      const seq = new Sequencer(synth);
      sequencerRef.current = seq;
      seq.loadNewSongList([midiBuffer]);

      // Leer duracion
      durationRef.current = seq.duration;
      setDuration(seq.duration);

      // Extraer info de tracks/canales para UI de voces
      // SpessaSynth no expone tracks directamente como Tone.js,
      // pero podemos inspeccionar los canales activos del synth
      const trackInfos: MidiTrackInfo[] = [];
      if (synth.channelProperties) {
        for (let ch = 0; ch < synth.channelProperties.length; ch++) {
          const props = synth.channelProperties[ch];
          if (props) {
            trackInfos.push({
              index: ch,
              name: VOICE_BY_CHANNEL[ch] ?? `Canal ${ch + 1}`,
              channel: ch,
              noteCount: 0,
              muted: props.isMuted ?? false,
            });
          }
        }
      }
      // Si hay mas de 1 canal activo, mostrar controles de voces
      if (trackInfos.length > 1) {
        setTracks(trackInfos);
        setShowTracks(true);
      }

      // Registrar evento de fin
      seq.eventHandler.addEvent('songEnded', 'midi-player-ended', () => {
        cancelAnimationFrame(rafRef.current);
        isPlayingRef.current = false;
        setStatus('ready');
        setProgress(0);
        setCurrentTime(0);
      });

      setLoadingMsg('');
      setStatus('ready');
    } catch (err) {
      console.error('Error cargando MIDI:', err);
      setLoadingMsg('');
      setStatus('error');
    }
  }, [audioUrl]);

  // ── TICK (RAF) ──
  const tick = useCallback(() => {
    const seq = sequencerRef.current;
    if (!seq || !durationRef.current) return;
    const el = seq.currentHighResolutionTime;
    setProgress(Math.min((el / durationRef.current) * 100, 100));
    setCurrentTime(Math.min(el, durationRef.current));
    if (el < durationRef.current && isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  // ── PLAY / PAUSE ──
  const play = useCallback(async () => {
    if (status === 'idle' || status === 'error') await loadMidi();
    const seq = sequencerRef.current;
    const ctx = audioCtxRef.current;
    if (!seq) return;

    if (ctx?.state === 'suspended') await ctx.resume();

    if (isPlayingRef.current) {
      // Pause
      cancelAnimationFrame(rafRef.current);
      seq.pause();
      isPlayingRef.current = false;
      setStatus('ready');
      return;
    }

    seq.play();
    isPlayingRef.current = true;
    setStatus('playing');
    rafRef.current = requestAnimationFrame(tick);
  }, [status, loadMidi, tick]);

  // ── STOP ──
  const stop = useCallback(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    cancelAnimationFrame(rafRef.current);
    seq.pause();
    seq.currentTime = 0;
    isPlayingRef.current = false;
    setProgress(0);
    setCurrentTime(0);
    setStatus('ready');
  }, []);

  // ── SEEK ──
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const seq = sequencerRef.current;
    if (!durationRef.current || !seq) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const to = pct * durationRef.current;

    seq.currentTime = to;
    setProgress(pct * 100);
    setCurrentTime(to);
  }, []);

  // ── MUTE ──
  const toggleMute = useCallback((idx: number) => {
    const synth = synthRef.current;
    if (!synth) return;

    setTracks((prev) =>
      prev.map((t) => {
        if (t.index !== idx) return t;
        const muted = !t.muted;
        // SpessaSynth: mutar/desmutar canal
        if (synth.channelProperties && synth.channelProperties[idx]) {
          synth.channelProperties[idx].isMuted = muted;
        }
        return { ...t, muted };
      }),
    );
  }, []);

  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isPaused = status === 'ready' && progress > 0;

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      'bg-slate-50/80 border-slate-200/80 text-slate-700',
    )}>
      {/* -- Controles -- */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button type="button" onClick={play} disabled={isLoading}
          aria-label={isLoading ? 'Cargando...' : isPlaying ? 'Pausar' : 'Reproducir'}
          className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200',
            isPlaying ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
              : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300/80',
            isLoading && 'opacity-50 cursor-wait',
          )}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" />
            : isPlaying ? <Pause className="h-3.5 w-3.5" />
            : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>

        {(isPlaying || isPaused) && (
          <button type="button" onClick={stop} aria-label="Detener"
            className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200/80 text-slate-500 hover:bg-slate-300/80 transition-colors">
            <Square className="h-3 w-3" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Music className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-700 truncate">{label}</span>
            {isLoading && loadingMsg && (
              <span className="text-[9px] text-slate-400 truncate">{loadingMsg}</span>
            )}
            <span className="text-[10px] tabular-nums text-slate-400 ml-auto flex-shrink-0">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          {/* Barra de progreso / seek */}
          <div className="py-1.5 -my-1.5 cursor-pointer group" onClick={seek}
            role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors">
              <div className="h-full rounded-full bg-primary transition-[width] duration-75 relative"
                style={{ width: `${progress}%` }}>
                <div className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary ring-2 ring-white shadow transition-opacity',
                  progress > 0 ? 'opacity-100' : 'opacity-0',
                )} />
              </div>
            </div>
          </div>
        </div>

        <a href={audioUrl} download={fileInfo.filename_download || 'midi.mid'} aria-label="Descargar MIDI"
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 transition-all"
          onClick={(e) => e.stopPropagation()}>
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* -- Voces -- */}
      {tracks.length > 0 && (
        <div className="border-t border-slate-200/60">
          <button type="button" onClick={() => setShowTracks(!showTracks)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
            <Music className="h-3 w-3" />
            <span>{tracks.length} {tracks.length === 1 ? 'voz' : 'voces'}</span>
            <span className="ml-auto text-[9px]">{showTracks ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showTracks && (
            <div className="px-3 pb-2.5 grid grid-cols-2 gap-1.5">
              {tracks.map((t) => (
                <div key={t.index}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] transition-all',
                    'bg-white border-slate-200 text-slate-600',
                    t.muted && 'opacity-35',
                  )}>
                  <button type="button" onClick={() => toggleMute(t.index)}
                    aria-label={t.muted ? `Activar ${t.name}` : `Silenciar ${t.name}`}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
                    {t.muted
                      ? <VolumeX className="h-3.5 w-3.5" />
                      : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <span className={cn('font-medium truncate', t.muted && 'line-through')}>{t.name}</span>
                  <span className="text-[9px] opacity-40 tabular-nums flex-shrink-0">{t.noteCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-red-500">Error al cargar. Clic en play para reintentar.</p>
        </div>
      )}
    </div>
  );
}
