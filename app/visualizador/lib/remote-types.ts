/**
 * Tipos compartidos para el protocolo de control remoto SSE/POST.
 * El desktop crea una sala con PIN y el movil envia comandos via POST.
 */

/** Datos de una diapositiva para renderizar en el movil */
export interface RemoteSlide {
  label: string;
  text: string;
  isIntro: boolean;
}

/** Datos minimos de un himno en la playlist (para el movil) */
export interface RemotePlaylistHymn {
  id: string;
  name: string;
  hymnNumber: number | null;
  slideCount: number;
  slideLabels: string[];
  slides: RemoteSlide[];
  /** Pistas de audio disponibles (field names) */
  audioTracks: string[];
}

/** Comando enviado desde movil a desktop */
export type RemoteCommand =
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'SET_SLIDE'; index: number }
  | { type: 'SET_HYMN'; index: number }
  | { type: 'SET_PROJECTION_MODE'; mode: 'black' | 'clear' | 'logo' | 'slide' }
  | { type: 'SET_AUDIO_PLAYING'; playing: boolean }
  | { type: 'SET_AUDIO_TRACK'; trackField: string };

/** Snapshot de estado enviado desde desktop a la sala */
export interface RemoteState {
  activeHymnIndex: number;
  activeHymnName: string;
  activeSlideLabel: string;
  activeSlideIndex: number;
  totalSlides: number;
  projectionMode: string;
  audioPlaying: boolean;
  audioTrackField: string | null;
  /** Playlist completa con datos minimos */
  playlist: RemotePlaylistHymn[];
}

/** Tipos de evento SSE */
export type SSEEvent =
  | { event: 'state'; data: RemoteState }
  | { event: 'command'; data: RemoteCommand };
