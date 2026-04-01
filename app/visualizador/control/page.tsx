'use client';

/**
 * Pagina de control remoto movil para el Visualizador de Himnos.
 * Conecta a una sala via PIN. Incluye:
 *   - Grid de diapositivas con slider de tamano
 *   - Sidebar de himnos
 *   - Selector de pistas de audio
 *   - Controles de proyeccion y navegacion
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Type,
  ImageIcon,
  Play,
  Pause,
  Square,
  Music,
  List,
  X,
  Minus,
  Plus,
} from 'lucide-react';
import type { RemoteCommand, RemoteState, RemotePlaylistHymn } from '../lib/remote-types';

export default function ControlPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <div className="inline-block h-6 w-6 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
        </div>
      }
    >
      <ControlPage />
    </Suspense>
  );
}

function sendCommand(pin: string, cmd: RemoteCommand) {
  fetch(`/api/visualizador/rooms/${pin}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  }).catch((err) => console.error('Error al enviar comando:', err));
}

const TRACK_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

function ControlPage() {
  const searchParams = useSearchParams();
  const urlPin = searchParams.get('pin');

  const [pin, setPin] = useState(urlPin ?? '');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [remoteState, setRemoteState] = useState<RemoteState | null>(null);
  const [showHymnList, setShowHymnList] = useState(false);
  const [expandedHymnIndex, setExpandedHymnIndex] = useState<number | null>(null);
  const [thumbScale, setThumbScale] = useState(50); // 30-100%

  const eventSourceRef = useRef<EventSource | null>(null);
  const activePin = useRef<string | null>(null);

  const connect = useCallback((targetPin: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnecting(true);
    setRoomNotFound(false);
    activePin.current = targetPin;

    const es = new EventSource(
      `/api/visualizador/rooms/${targetPin}/stream?role=mobile`,
    );
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
    };

    es.addEventListener('state', (e) => {
      try {
        setRemoteState(JSON.parse(e.data) as RemoteState);
      } catch {}
    });

    es.onerror = () => {
      setIsConnected(false);
      if (es.readyState === EventSource.CLOSED) {
        setIsConnecting(false);
        setRoomNotFound(true);
        activePin.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (urlPin && urlPin.length >= 4 && urlPin.length <= 6) connect(urlPin);
    return () => { eventSourceRef.current?.close(); };
  }, [urlPin, connect]);

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length === 4) connect(pin);
  }

  function handleDisconnect() {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    activePin.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setRoomNotFound(false);
    setRemoteState(null);
  }

  // --- PIN entry ---
  if (!activePin.current && !isConnecting) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold">Control Remoto</h1>
            <p className="text-sm text-zinc-400">
              Ingrese el PIN que aparece en la pantalla del Visualizador
            </p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full h-16 text-center text-3xl font-mono tracking-[0.5em] bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={pin.length < 4 || pin.length > 6}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed active:bg-blue-500 transition-colors"
            >
              Conectar
            </button>
          </form>
          {roomNotFound && (
            <p className="text-center text-sm text-red-400">
              Sala no encontrada. Verifique el PIN.
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Connecting ---
  if (isConnecting && !isConnected) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
          <p className="text-zinc-400">Conectando...</p>
        </div>
      </div>
    );
  }

  // --- Main controls ---
  const currentPin = activePin.current!;
  const st = remoteState;
  const activeHymn = st?.playlist[st.activeHymnIndex] ?? null;
  const availableTracks = activeHymn?.audioTracks ?? [];

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex flex-col"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
        <button
          onClick={() => setShowHymnList(true)}
          className="h-9 w-9 rounded-lg bg-zinc-800 active:bg-zinc-700 flex items-center justify-center flex-shrink-0"
        >
          <List className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            {st?.activeHymnName || 'Sin himno'}
          </h1>
          <p className="text-xs text-zinc-400 truncate">
            {st?.activeSlideLabel || '—'}
            {st && st.totalSlides > 0 && (
              <span className="text-zinc-600 ml-1.5">
                {st.activeSlideIndex + 1}/{st.totalSlides}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-[10px] text-zinc-500">{currentPin}</span>
        </div>
      </div>

      {/* Slide grid */}
      <div className="flex-1 overflow-auto p-2">
        {activeHymn && activeHymn.slideCount > 0 ? (
          <>
            {/* Thumb scale slider */}
            <div className="flex items-center gap-2 px-1 mb-2">
              <Minus className="h-3 w-3 text-zinc-500" />
              <input
                type="range"
                min={30}
                max={100}
                value={thumbScale}
                onChange={(e) => setThumbScale(Number(e.target.value))}
                className="flex-1 h-1 accent-blue-500"
              />
              <Plus className="h-3 w-3 text-zinc-500" />
            </div>
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${thumbScale === 100 ? '100%' : `${Math.max(80, thumbScale * 1.6)}px`}, 1fr))`,
              }}
            >
              {activeHymn.slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sendCommand(currentPin, { type: 'SET_SLIDE', index: i });
                    sendCommand(currentPin, { type: 'SET_PROJECTION_MODE', mode: 'slide' });
                  }}
                  className={`aspect-video rounded-lg overflow-hidden text-left transition-all relative ${
                    i === st?.activeSlideIndex
                      ? 'ring-[3px] ring-[#eaba1c] shadow-[0_0_10px_rgba(234,186,28,0.35)]'
                      : 'ring-1 ring-zinc-700/50 active:ring-zinc-600'
                  }`}
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  {/* Slide label badge */}
                  <span className={`absolute top-1 left-1.5 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded z-10 ${
                    i === st?.activeSlideIndex
                      ? 'bg-[#eaba1c] text-black'
                      : 'bg-black/50 text-white/70'
                  }`}>
                    {slide.label}
                  </span>
                  {/* Slide content */}
                  <div className="absolute inset-0 flex items-center justify-center p-3 pt-5">
                    <p className="text-[7px] leading-tight text-white/90 text-center font-bold line-clamp-6 whitespace-pre-line">
                      {slide.text}
                    </p>
                  </div>
                  {/* Slide number */}
                  <span className="absolute bottom-0.5 right-1 text-[7px] text-white/25">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-zinc-600">Sin diapositivas</p>
          </div>
        )}
      </div>

      {/* Audio track selector */}
      {availableTracks.length > 0 && (
        <div className="px-2 pb-1">
          <div className="flex gap-1 overflow-x-auto py-1">
            {availableTracks.map((track) => (
              <button
                key={track}
                onClick={() => sendCommand(currentPin, { type: 'SET_AUDIO_TRACK', trackField: track })}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  st?.audioTrackField === track
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
                }`}
              >
                <Music className="inline h-3 w-3 mr-1" />
                {TRACK_LABELS[track] ?? track}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex-shrink-0 px-2 pb-2 space-y-1.5">
        {/* Nav: prev / play / next */}
        <div className="flex gap-1.5">
          <button
            onClick={() => sendCommand(currentPin, { type: 'PREV_SLIDE' })}
            className="flex-1 h-14 rounded-xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center gap-1.5 font-medium transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Anterior
          </button>
          <button
            onClick={() =>
              sendCommand(currentPin, {
                type: 'SET_AUDIO_PLAYING',
                playing: !st?.audioPlaying,
              })
            }
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              st?.audioPlaying
                ? 'bg-amber-700 active:bg-amber-600'
                : 'bg-zinc-800 active:bg-zinc-700'
            }`}
          >
            {st?.audioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button
            onClick={() => sendCommand(currentPin, { type: 'NEXT_SLIDE' })}
            className="flex-1 h-14 rounded-xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center gap-1.5 font-medium transition-colors"
          >
            Siguiente
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Modes: Negro, Limpiar, Logo */}
        <div className="flex gap-1.5">
          {([
            { mode: 'black' as const, icon: EyeOff, label: 'Negro' },
            { mode: 'clear' as const, icon: Type, label: 'Limpiar' },
            { mode: 'logo' as const, icon: ImageIcon, label: 'Logo' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => sendCommand(currentPin, { type: 'SET_PROJECTION_MODE', mode })}
              className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                st?.projectionMode === mode
                  ? 'bg-zinc-600'
                  : 'bg-zinc-800 active:bg-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hymn list sidebar */}
      {showHymnList && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => { setShowHymnList(false); setExpandedHymnIndex(null); }}
          />
          <div className="relative w-[88%] max-w-sm bg-zinc-900 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-semibold">Himnos</h2>
              <button
                onClick={() => { setShowHymnList(false); setExpandedHymnIndex(null); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 active:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {st?.playlist.map((hymn, i) => {
                const isExpanded = expandedHymnIndex === i;
                const isActive = i === st.activeHymnIndex;
                return (
                  <div key={hymn.id} className={isActive ? 'bg-zinc-800/50' : ''}>
                    {/* Hymn row */}
                    <button
                      onClick={() => setExpandedHymnIndex(isExpanded ? null : i)}
                      className={`w-full px-4 py-3 text-left border-b border-zinc-800/50 transition-colors ${
                        isActive ? 'border-l-2 border-l-[#eaba1c]' : 'active:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {hymn.hymnNumber != null && (
                          <span className="text-xs font-mono text-zinc-500 w-8 text-right flex-shrink-0">
                            {hymn.hymnNumber}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{hymn.name}</span>
                          <span className="text-[10px] text-zinc-500">
                            {hymn.slideCount} diapositivas
                            {hymn.audioTracks.length > 0 && (
                              <> · <Music className="inline h-2.5 w-2.5" /> {hymn.audioTracks.length} pistas</>
                            )}
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-zinc-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded slide preview */}
                    {isExpanded && (
                      <div className="px-3 py-2 bg-zinc-950/50 border-b border-zinc-800/50">
                        <div className="grid grid-cols-2 gap-1.5">
                          {hymn.slides.map((slide, si) => (
                            <button
                              key={si}
                              onClick={() => {
                                sendCommand(currentPin, { type: 'SET_HYMN', index: i });
                                // Pequeño delay para que el himno se cargue primero
                                setTimeout(() => {
                                  sendCommand(currentPin, { type: 'SET_SLIDE', index: si });
                                  sendCommand(currentPin, { type: 'SET_PROJECTION_MODE', mode: 'slide' });
                                }, 100);
                                setShowHymnList(false);
                                setExpandedHymnIndex(null);
                              }}
                              className={`aspect-video rounded overflow-hidden relative transition-all ${
                                isActive && si === st.activeSlideIndex
                                  ? 'ring-2 ring-[#eaba1c] shadow-[0_0_6px_rgba(234,186,28,0.3)]'
                                  : 'ring-1 ring-zinc-700/40 active:ring-zinc-500'
                              }`}
                              style={{ backgroundColor: '#1a1a2e' }}
                            >
                              <span className={`absolute top-0.5 left-1 text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded ${
                                isActive && si === st.activeSlideIndex
                                  ? 'bg-[#eaba1c] text-black'
                                  : 'bg-black/50 text-white/60'
                              }`}>
                                {slide.label}
                              </span>
                              <div className="absolute inset-0 flex items-center justify-center p-2 pt-4">
                                <p className="text-[6px] leading-tight text-white/80 text-center font-bold line-clamp-4 whitespace-pre-line">
                                  {slide.text}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!st?.playlist || st.playlist.length === 0) && (
                <div className="p-8 text-center text-sm text-zinc-600">
                  Sin himnos en la playlist
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room not found */}
      {roomNotFound && (
        <div className="fixed inset-x-0 bottom-4 text-center">
          <p className="text-sm text-red-400">Sala no encontrada.</p>
          <button onClick={handleDisconnect} className="mt-1 text-sm text-blue-400 underline">
            Reingresar PIN
          </button>
        </div>
      )}
    </div>
  );
}
