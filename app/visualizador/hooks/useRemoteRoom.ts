'use client';

/**
 * Hook que gestiona el ciclo de vida de una sala de control remoto.
 * Crea sala al montar, conecta SSE para recibir comandos, y expone
 * pushState() para enviar estado a los moviles conectados.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RemoteCommand, RemoteState } from '../lib/remote-types';

interface UseRemoteRoomOptions {
  onCommand: (cmd: RemoteCommand) => void;
}

interface UseRemoteRoomResult {
  pin: string | null;
  connected: boolean;
  error: string | null;
  pushState: (state: RemoteState) => void;
}

export function useRemoteRoom({ onCommand }: UseRemoteRoomOptions): UseRemoteRoomResult {
  const [pin, setPin] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinRef = useRef<string | null>(null);

  // Crear sala al montar
  useEffect(() => {
    let cancelled = false;

    async function createRoom() {
      try {
        const res = await fetch('/api/visualizador/rooms', { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setPin(data.pin);
        pinRef.current = data.pin;
      } catch (err) {
        if (cancelled) return;
        console.error('Error al crear sala remota:', err);
        setError('No se pudo crear la sala');
      }
    }

    createRoom();

    return () => {
      cancelled = true;
    };
  }, []);

  // Conectar SSE cuando tenemos PIN
  useEffect(() => {
    if (!pin) return;

    const es = new EventSource(`/api/visualizador/rooms/${pin}/stream?role=desktop`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.addEventListener('command', (e) => {
      try {
        const cmd = JSON.parse(e.data) as RemoteCommand;
        onCommandRef.current(cmd);
      } catch (err) {
        console.error('Error al parsear comando remoto:', err);
      }
    });

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconecta por defecto
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [pin]);

  // pushState con debounce de 100ms
  const pushState = useCallback((state: RemoteState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const currentPin = pinRef.current;
      if (!currentPin) return;

      fetch(`/api/visualizador/rooms/${currentPin}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch((err) => {
        console.error('Error al enviar estado remoto:', err);
      });
    }, 100);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { pin, connected, error, pushState };
}
