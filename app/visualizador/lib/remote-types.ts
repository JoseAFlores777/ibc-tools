/**
 * Tipos compartidos para el protocolo de control remoto SSE/POST.
 * El desktop crea una sala con PIN y el movil envia comandos via POST.
 */

/** Comando enviado desde movil a desktop */
export type RemoteCommand =
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'SET_PROJECTION_MODE'; mode: 'black' | 'clear' | 'logo' | 'slide' }
  | { type: 'SET_AUDIO_PLAYING'; playing: boolean };

/** Snapshot de estado enviado desde desktop a la sala (ligero para movil) */
export interface RemoteState {
  activeHymnName: string;
  activeSlideLabel: string;
  activeSlideIndex: number;
  totalSlides: number;
  projectionMode: string;
  audioPlaying: boolean;
}

/** Tipos de evento SSE */
export type SSEEvent =
  | { event: 'state'; data: RemoteState }
  | { event: 'command'; data: RemoteCommand };
