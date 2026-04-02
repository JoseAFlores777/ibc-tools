'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const SF_DB_NAME = 'ibc-audio-cache';
const SF_STORE_NAME = 'files';
const SF_CACHE_KEY = 'ibc-soundfont-v1';

// ── IndexedDB helpers ──

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

/**
 * Hook que encapsula SpessaSynth: carga de SoundFont con cache IndexedDB,
 * creacion de synth/sequencer, controles de playback, y actualizacion de tiempo.
 */
export function useSpessaSynth() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sequencerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const onEndedRef = useRef<(() => void) | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { sequencerRef.current?.pause(); } catch {}
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, []);

  /** RAF loop para actualizar currentTime mientras se reproduce */
  const startTimeLoop = useCallback(() => {
    const tick = () => {
      const seq = sequencerRef.current;
      if (seq) {
        setCurrentTime(seq.currentHighResolutionTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimeLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  const sfBufferRef = useRef<ArrayBuffer | null>(null);

  /**
   * Pre-descarga el SoundFont (cache IndexedDB o fetch con progreso).
   * Se puede llamar sin interaccion del usuario — no crea AudioContext.
   */
  const loadSoundFont = useCallback(async () => {
    if (sfBufferRef.current || synthRef.current) return;
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      let sfBuffer = await getCachedSoundFont();

      if (!sfBuffer) {
        const response = await fetch('/api/hymns/soundfont');
        if (!response.ok) throw new Error(`HTTP ${response.status} al descargar SoundFont`);

        const contentLength = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No se pudo leer el stream de SoundFont');

        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            setLoadProgress(Math.round((received / contentLength) * 100));
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
          console.warn('No se pudo cachear SoundFont en IndexedDB:', e),
        );
      } else {
        setLoadProgress(100);
      }

      sfBufferRef.current = sfBuffer;
      setIsLoading(false);
    } catch (err) {
      console.error('Error descargando SoundFont:', err);
      setError(err instanceof Error ? err.message : 'Error al descargar SoundFont');
      setIsLoading(false);
    }
  }, []);

  /**
   * Inicializa AudioContext, worklet y synth.
   * DEBE llamarse desde interaccion del usuario (click en play).
   */
  const initSynth = useCallback(async () => {
    if (synthRef.current) return;
    const sfBuffer = sfBufferRef.current;
    if (!sfBuffer) {
      await loadSoundFont();
      if (!sfBufferRef.current) return;
      return initSynth();
    }

    try {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;
      await ctx.audioWorklet.addModule('/spessasynth_processor.min.js');

      const { WorkletSynthesizer } = await import('spessasynth_lib');
      const synth = new WorkletSynthesizer(ctx);
      synth.connect(ctx.destination);
      await synth.soundBankManager.addSoundBank(sfBuffer, 'main');
      await synth.isReady;

      synthRef.current = synth;
      setLoadProgress(100);
    } catch (err) {
      console.error('Error inicializando synth:', err);
      setError(err instanceof Error ? err.message : 'Error al inicializar audio');
    }
  }, [loadSoundFont]);

  /**
   * Carga un MIDI base64 (generado por Verovio) en el sequencer.
   */
  const loadMidi = useCallback(async (midiBase64: string) => {
    const synth = synthRef.current;
    if (!synth) {
      console.error('SoundFont no cargado. Llama loadSoundFont primero.');
      return;
    }

    try {
      // Decodificar base64 a Uint8Array
      const midiBytes = Uint8Array.from(atob(midiBase64), (c) => c.charCodeAt(0));

      // Crear sequencer si no existe
      if (!sequencerRef.current) {
        const { Sequencer } = await import('spessasynth_lib');
        const seq = new Sequencer(synth);
        sequencerRef.current = seq;

        // Registrar evento de fin de cancion
        seq.eventHandler.addEvent('songEnded', 'ibc-ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
          stopTimeLoop();
          onEndedRef.current?.();
        });

        // Registrar evento de cambio de cancion para leer duracion real
        // (loadNewSongList es asincrono — la duracion no esta disponible de inmediato)
        seq.eventHandler.addEvent('songChange', 'ibc-song-change', () => {
          setDuration(seq.duration);
        });
      }

      const seq = sequencerRef.current;
      seq.loadNewSongList([{ binary: midiBytes.buffer }]);

      setCurrentTime(0);
      setIsPlaying(false);
    } catch (err) {
      console.error('Error cargando MIDI:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar MIDI');
    }
  }, [stopTimeLoop]);

  const play = useCallback(() => {
    const seq = sequencerRef.current;
    const ctx = audioCtxRef.current;
    if (!seq) return;

    // Reanudar AudioContext si esta suspendido (autoplay policy)
    if (ctx?.state === 'suspended') ctx.resume();

    seq.play();
    setIsPlaying(true);
    startTimeLoop();
  }, [startTimeLoop]);

  const pause = useCallback(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.pause();
    setIsPlaying(false);
    stopTimeLoop();
  }, [stopTimeLoop]);

  const seek = useCallback((timeSeconds: number) => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.currentTime = timeSeconds;
    setCurrentTime(timeSeconds);
  }, []);

  return {
    synth: synthRef.current,
    sequencer: sequencerRef.current,
    isLoading,
    loadProgress,
    error,
    loadSoundFont,
    initSynth,
    loadMidi,
    play,
    pause,
    seek,
    duration,
    currentTime,
    isPlaying,
    onEnded: onEndedRef,
  };
}
