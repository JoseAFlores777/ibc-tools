'use client';

/**
 * BroadcastChannel hook for cross-window projection communication.
 * Creates channel on mount, closes on unmount. Accepts optional onMessage callback.
 * Automatically recreates the channel if postMessage fails (silent disconnect).
 */

import { useRef, useEffect, useCallback } from 'react';
import { CHANNEL_NAME } from '../lib/projection-channel';
import type { ProjectionMessage } from '../lib/projection-channel';

interface UseBroadcastChannelOptions {
  /** Callback invoked when a message is received from another window */
  onMessage?: (msg: ProjectionMessage) => void;
}

/** Hook that abstracts BroadcastChannel lifecycle and messaging */
export function useBroadcastChannel(options?: UseBroadcastChannelOptions) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(options?.onMessage);

  // Mantener referencia actualizada del callback sin recrear el channel
  onMessageRef.current = options?.onMessage;

  const createChannel = useCallback(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<ProjectionMessage>) => {
      onMessageRef.current?.(event.data);
    };
    channelRef.current = channel;
    return channel;
  }, []);

  useEffect(() => {
    createChannel();

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [createChannel]);

  const send = useCallback((msg: ProjectionMessage) => {
    try {
      channelRef.current?.postMessage(msg);
    } catch {
      // Canal cerrado silenciosamente — recrear y reintentar
      try { channelRef.current?.close(); } catch { /* ignore */ }
      createChannel();
      try {
        channelRef.current?.postMessage(msg);
      } catch {
        // Si aun falla, no hay nada mas que hacer
      }
    }
  }, [createChannel]);

  return { send };
}
