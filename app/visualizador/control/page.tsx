'use client';

/**
 * Pagina de control remoto movil para el Visualizador de Himnos.
 * Conecta a una sala via PIN y permite controlar diapositivas,
 * modos de proyeccion y audio desde un telefono/tablet.
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
} from 'lucide-react';
import type { RemoteCommand, RemoteState } from '../lib/remote-types';

/** Wrapper con Suspense requerido por useSearchParams en Next.js */
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

/** Envia un comando POST a la sala (fire-and-forget) */
function sendCommand(pin: string, cmd: RemoteCommand) {
  fetch(`/api/visualizador/rooms/${pin}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  }).catch((err) => {
    console.error('Error al enviar comando:', err);
  });
}

function ControlPage() {
  const searchParams = useSearchParams();
  const urlPin = searchParams.get('pin');

  const [pin, setPin] = useState(urlPin ?? '');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [remoteState, setRemoteState] = useState<RemoteState | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const activePin = useRef<string | null>(null);

  // Conectar a la sala via SSE
  const connect = useCallback((targetPin: string) => {
    // Cerrar conexion anterior si existe
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
        const state = JSON.parse(e.data) as RemoteState;
        setRemoteState(state);
      } catch (err) {
        console.error('Error al parsear estado:', err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      // Si el EventSource se cierra permanentemente, la sala no existe
      if (es.readyState === EventSource.CLOSED) {
        setIsConnecting(false);
        setRoomNotFound(true);
        activePin.current = null;
      }
    };
  }, []);

  // Auto-conectar si hay PIN en URL
  useEffect(() => {
    if (urlPin && urlPin.length === 4) {
      connect(urlPin);
    }
    return () => {
      eventSourceRef.current?.close();
    };
  }, [urlPin, connect]);

  // Manejar envio de PIN manual
  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length === 4) {
      connect(pin);
    }
  }

  // Desconectar y volver al formulario de PIN
  function handleDisconnect() {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    activePin.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setRoomNotFound(false);
    setRemoteState(null);
  }

  // Vista de entrada de PIN
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
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full h-16 text-center text-3xl font-mono tracking-[0.5em] bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={pin.length !== 4}
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

  // Vista de conexion en progreso
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

  // Controles principales
  const currentPin = activePin.current!;
  const st = remoteState;

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex flex-col p-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Header: info del himno actual */}
      <div className="space-y-1 mb-6">
        <h1 className="text-lg font-semibold truncate">
          {st?.activeHymnName || 'Sin himno'}
        </h1>
        <p className="text-sm text-zinc-400 truncate">
          {st?.activeSlideLabel || 'Sin diapositiva'}
        </p>
        {st && st.totalSlides > 0 && (
          <p className="text-xs text-zinc-500">
            {st.activeSlideIndex + 1} / {st.totalSlides}
          </p>
        )}
      </div>

      {/* Controles */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Navegacion: Anterior / Siguiente */}
        <div className="flex gap-2">
          <button
            onClick={() => sendCommand(currentPin, { type: 'PREV_SLIDE' })}
            className="flex-1 h-14 rounded-xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Anterior
          </button>
          <button
            onClick={() => sendCommand(currentPin, { type: 'NEXT_SLIDE' })}
            className="flex-1 h-14 rounded-xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            Siguiente
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Modos: Negro, Limpiar, Logo */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              sendCommand(currentPin, {
                type: 'SET_PROJECTION_MODE',
                mode: 'black',
              })
            }
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
              st?.projectionMode === 'black'
                ? 'bg-zinc-600'
                : 'bg-zinc-800 active:bg-zinc-700'
            }`}
          >
            <EyeOff className="h-4 w-4" />
            Negro
          </button>
          <button
            onClick={() =>
              sendCommand(currentPin, {
                type: 'SET_PROJECTION_MODE',
                mode: 'clear',
              })
            }
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
              st?.projectionMode === 'clear'
                ? 'bg-zinc-600'
                : 'bg-zinc-800 active:bg-zinc-700'
            }`}
          >
            <Type className="h-4 w-4" />
            Limpiar
          </button>
          <button
            onClick={() =>
              sendCommand(currentPin, {
                type: 'SET_PROJECTION_MODE',
                mode: 'logo',
              })
            }
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
              st?.projectionMode === 'logo'
                ? 'bg-zinc-600'
                : 'bg-zinc-800 active:bg-zinc-700'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Logo
          </button>
        </div>

        {/* Mostrar diapositiva (cuando esta en otro modo) */}
        {st?.projectionMode && st.projectionMode !== 'slide' && (
          <button
            onClick={() =>
              sendCommand(currentPin, {
                type: 'SET_PROJECTION_MODE',
                mode: 'slide',
              })
            }
            className="h-12 w-full rounded-xl bg-blue-600 active:bg-blue-500 font-medium transition-colors"
          >
            Mostrar diapositiva
          </button>
        )}

        {/* Audio: play/pause */}
        <button
          onClick={() =>
            sendCommand(currentPin, {
              type: 'SET_AUDIO_PLAYING',
              playing: !st?.audioPlaying,
            })
          }
          className={`h-12 w-full rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
            st?.audioPlaying
              ? 'bg-amber-700 active:bg-amber-600'
              : 'bg-zinc-800 active:bg-zinc-700'
          }`}
        >
          {st?.audioPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Reproducir
            </>
          )}
        </button>
      </div>

      {/* Footer: estado de conexion */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-xs text-zinc-400">
            {isConnected ? 'Conectado' : 'Reconectando...'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">PIN: {currentPin}</span>
          <button
            onClick={handleDisconnect}
            className="text-xs text-zinc-500 underline"
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* Sala no encontrada */}
      {roomNotFound && (
        <div className="mt-3 text-center">
          <p className="text-sm text-red-400">
            Sala no encontrada. Verifique el PIN.
          </p>
          <button
            onClick={handleDisconnect}
            className="mt-2 text-sm text-blue-400 underline"
          >
            Reingresar PIN
          </button>
        </div>
      )}
    </div>
  );
}
