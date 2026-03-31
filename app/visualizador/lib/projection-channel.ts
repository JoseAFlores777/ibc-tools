/**
 * BroadcastChannel protocol for cross-window projection communication.
 * The control panel sends messages to the projection window via this channel.
 * Per D-09: BroadcastChannel for same-origin cross-window sync.
 */

import type { SlideData, ThemeConfig, ProjectionMode } from './types';

/** Channel name constant for BroadcastChannel instances */
export const CHANNEL_NAME = 'ibc-visualizador';

/** Discriminated union of all messages sent between control panel and projection window */
export type ProjectionMessage =
  | { type: 'SHOW_SLIDE'; slide: SlideData; theme: ThemeConfig; fontSize: number }
  | { type: 'BLACK_SCREEN' }
  | { type: 'CLEAR_TEXT'; theme: ThemeConfig }
  | { type: 'SHOW_LOGO'; theme: ThemeConfig }
  | { type: 'PING' }
  | {
      type: 'PONG';
      slide: SlideData | null;
      theme: ThemeConfig;
      mode: ProjectionMode;
      fontSize: number;
    };
