'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download, Loader2, Square, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';
import type { AudioFileInfo } from '@/app/interfaces/Hymn.interface';

interface MidiTrackPlayerProps {
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

// Sin multicolor — todas las voces usan la misma paleta neutral

const PIANO_SAMPLES: Record<string, string> = {
  A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', C8: 'C8.mp3',
};

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

/** Renderiza un track MIDI a AudioBuffer offline con Sampler Salamander */
async function renderTrack(Tone: any, track: any, dur: number): Promise<AudioBuffer> {
  const buf = await Tone.Offline(async (context: any) => {
    const sampler: any = await new Promise((res: any) => {
      const s = new Tone.Sampler({
        urls: PIANO_SAMPLES, release: 1.2,
        baseUrl: '/audio/salamander/', context,
        onload: () => res(s),
      }).toDestination();
    });
    track.notes.forEach((n: any) => {
      sampler.triggerAttackRelease(n.name, n.duration, n.time, n.velocity);
    });
  }, dur);
  return buf.get() as AudioBuffer;
}

/** Convierte AudioBuffer a WAV Blob para descarga */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const length = buffer.length * numCh * 2;
  const sr = buffer.sampleRate;
  const ab = new ArrayBuffer(44 + length);
  const view = new DataView(ab);

  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, length, true);

  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(off, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

export default function MidiTrackPlayer({ field, fileInfo, label, colorClass, hymnName }: MidiTrackPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tracks, setTracks] = useState<MidiTrackInfo[]>([]);
  const [showTracks, setShowTracks] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const trackBuffersRef = useRef<AudioBuffer[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<GainNode[]>([]);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const rafRef = useRef<number>(0);
  const playStartRef = useRef(0);
  const playOffsetRef = useRef(0);
  const durationRef = useRef(0);
  // Ref para status actual (evita closures stale en handlers)
  const isPlayingRef = useRef(false);
  // Guard contra double-click en play
  const playLockRef = useRef(false);
  // Ref para el slider drag
  const sliderRef = useRef<HTMLDivElement>(null);

  const audioUrl = `/api/hymns/audio/${fileInfo.id}`;

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); killSources(); }, []);

  function killSources() {
    sourceNodesRef.current.forEach((s) => {
      s.onended = null;
      try { s.stop(); } catch {}
      try { s.disconnect(); } catch {}
    });
    sourceNodesRef.current = [];
  }

  function getCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }

  // ── CARGA ──
  const loadMidi = useCallback(async () => {
    if (trackBuffersRef.current.length > 0) return;
    setStatus('loading');
    setLoadingMsg('Descargando MIDI…');
    try {
      const [Tone, { Midi }, res] = await Promise.all([
        import('tone'), import('@tonejs/midi'), fetch(audioUrl),
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setLoadingMsg('Parseando…');
      const midi = new Midi(await res.arrayBuffer());
      const midiDur = midi.duration + 2;
      durationRef.current = midi.duration;
      setDuration(midi.duration);

      const active = midi.tracks.filter((t: any) => t.notes.length > 0);
      const infos: MidiTrackInfo[] = active.map((t: any, i: number) => ({
        index: i,
        name: VOICE_BY_CHANNEL[t.channel] ?? t.name ?? `Voz ${i + 1}`,
        channel: t.channel, noteCount: t.notes.length, muted: false,
      }));
      setTracks(infos);
      if (infos.length > 1) setShowTracks(true);

      const buffers: AudioBuffer[] = [];
      for (let i = 0; i < active.length; i++) {
        setLoadingMsg(`Renderizando ${infos[i].name}… (${i + 1}/${active.length})`);
        buffers.push(await renderTrack(Tone, active[i], midiDur));
      }
      trackBuffersRef.current = buffers;

      const c = getCtx();
      gainNodesRef.current = buffers.map(() => {
        const g = c.createGain(); g.connect(c.destination); return g;
      });

      setLoadingMsg('');
      setStatus('ready');
    } catch (err) {
      console.error('Error cargando MIDI:', err);
      setLoadingMsg('');
      setStatus('error');
    }
  }, [audioUrl]);

  // ── Cleanup completo al terminar reproducción ──
  const finishPlayback = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    killSources();
    isPlayingRef.current = false;
    playOffsetRef.current = 0;
    setStatus('ready');
    setProgress(0);
    setCurrentTime(0);
  }, []);

  // ── PLAY ──
  const startPlayback = useCallback((offset: number) => {
    const c = getCtx();
    killSources();
    const sources: AudioBufferSourceNode[] = [];
    trackBuffersRef.current.forEach((buf, i) => {
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(gainNodesRef.current[i]);
      src.start(0, offset);
      sources.push(src);
    });
    sourceNodesRef.current = sources;
    playStartRef.current = performance.now() / 1000;
    playOffsetRef.current = offset;
  }, []);

  const tick = useCallback(() => {
    if (!durationRef.current || !isPlayingRef.current) return;
    const el = playOffsetRef.current + (performance.now() / 1000 - playStartRef.current);
    if (el >= durationRef.current) {
      // Llegamos al final — cleanup completo
      finishPlayback();
      return;
    }
    setProgress((el / durationRef.current) * 100);
    setCurrentTime(el);
    rafRef.current = requestAnimationFrame(tick);
  }, [finishPlayback]);

  const play = useCallback(async () => {
    // Guard contra double-click
    if (playLockRef.current) return;

    if (isPlayingRef.current) {
      // Pause
      cancelAnimationFrame(rafRef.current);
      playOffsetRef.current += performance.now() / 1000 - playStartRef.current;
      killSources();
      isPlayingRef.current = false;
      setStatus('ready');
      return;
    }

    playLockRef.current = true;
    try {
      if (status === 'idle' || status === 'error') await loadMidi();
      if (trackBuffersRef.current.length === 0) return;
      const c = getCtx();
      if (c.state === 'suspended') await c.resume();

      const off = playOffsetRef.current > 0 ? playOffsetRef.current : 0;
      startPlayback(off);
      isPlayingRef.current = true;
      setStatus('playing');
      rafRef.current = requestAnimationFrame(tick);
    } finally {
      playLockRef.current = false;
    }
  }, [status, loadMidi, startPlayback, tick]);

  const stop = useCallback(() => {
    finishPlayback();
  }, [finishPlayback]);

  // Seek visual: solo mueve la barra, sin tocar el audio (instantáneo)
  const seekVisual = useCallback((clientX: number) => {
    const el = sliderRef.current;
    if (!el || !durationRef.current) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    playOffsetRef.current = pct * durationRef.current;
    setProgress(pct * 100);
    setCurrentTime(pct * durationRef.current);
  }, []);

  // Seek commit: recrea el audio en la posición final (solo se llama al soltar)
  const seekCommit = useCallback(() => {
    if (!durationRef.current || trackBuffersRef.current.length === 0) return;
    if (isPlayingRef.current) {
      startPlayback(playOffsetRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [startPlayback, tick]);

  // Mouse down en slider: pausa audio, mueve visual, recrea al soltar
  const handleSliderDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!durationRef.current || trackBuffersRef.current.length === 0) return;
    e.preventDefault();
    // Pausar audio y RAF durante el drag
    cancelAnimationFrame(rafRef.current);
    killSources();
    seekVisual(e.clientX);

    const onMove = (ev: MouseEvent) => seekVisual(ev.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      seekCommit();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [seekVisual, seekCommit]);

  // Touch support para mobile
  const handleSliderTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!durationRef.current || trackBuffersRef.current.length === 0) return;
    cancelAnimationFrame(rafRef.current);
    killSources();
    seekVisual(e.touches[0].clientX);

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      seekVisual(ev.touches[0].clientX);
    };
    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      seekCommit();
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [seekVisual, seekCommit]);

  const toggleMute = useCallback((idx: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.index !== idx) return t;
        const muted = !t.muted;
        const g = gainNodesRef.current[idx];
        if (g) g.gain.value = muted ? 0 : 1;
        return { ...t, muted };
      }),
    );
  }, []);

  /** Descarga un track individual como WAV */
  const downloadTrack = useCallback((idx: number, name: string) => {
    const buf = trackBuffersRef.current[idx];
    if (!buf) return;
    const blob = audioBufferToWav(buf);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = hymnName ? `${hymnName} - ${name}.wav` : `${name}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [hymnName]);

  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isPaused = status === 'ready' && progress > 0;

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      'bg-slate-50/80 border-slate-200/80 text-slate-700',
    )}>
      {/* ── Controles ── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button type="button" onClick={play} disabled={isLoading}
          aria-label={isLoading ? 'Cargando…' : isPlaying ? 'Pausar' : 'Reproducir'}
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
          {/* Barra de progreso / seek con drag */}
          <div ref={sliderRef} className="py-1.5 -my-1.5 cursor-pointer group touch-none select-none"
            onMouseDown={handleSliderDown} onTouchStart={handleSliderTouch}
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

        <a href={audioUrl} download={hymnName ? `${hymnName} - MIDI.mid` : (fileInfo.filename_download || 'midi.mid')} aria-label="Descargar MIDI"
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 transition-all"
          onClick={(e) => e.stopPropagation()}>
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* ── Voces ── */}
      {tracks.length > 0 && (
        <div className="border-t border-slate-200/60">
          <button type="button" onClick={() => setShowTracks(!showTracks)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
            <Music className="h-3 w-3" />
            <span>{tracks.length} {tracks.length === 1 ? 'voz' : 'voces'}</span>
            <span className="ml-auto text-[9px]">{showTracks ? '▲' : '▼'}</span>
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
                  <button type="button"
                    onClick={() => downloadTrack(t.index, t.name)}
                    aria-label={`Descargar ${t.name}`}
                    className="ml-auto flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors">
                    <Download className="h-3 w-3" />
                  </button>
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
