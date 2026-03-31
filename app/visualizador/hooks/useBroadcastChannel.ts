'use client';

/**
 * BroadcastChannel hook for cross-window projection communication.
 * Creates channel on mount, closes on unmount. Accepts optional onMessage callback.
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

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ProjectionMessage>) => {
      onMessageRef.current?.(event.data);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const send = useCallback((msg: ProjectionMessage) => {
    channelRef.current?.postMessage(msg);
  }, []);

  return { send };
}
