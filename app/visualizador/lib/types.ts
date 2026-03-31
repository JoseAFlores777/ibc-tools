/**
 * TypeScript interfaces for the Visualizador de Himnos feature.
 * Defines state shape, actions, slides, themes, and playlist models.
 */

import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';

/** A single slide within a hymn presentation */
export interface SlideData {
  /** Display label (e.g. "Introduccion", "CORO") */
  label: string;
  /** Slide content text */
  text: string;
  /** Verse section label for sidebar grouping (e.g. "ESTROFA I", "CORO") */
  verseLabel: string;
}

/** A hymn in the playlist with pre-built slides */
export interface PlaylistHymn {
  id: string;
  hymnData: HymnForPdf;
  slides: SlideData[];
}

/** Font family preset for projection text */
export type FontPresetKey = 'sans' | 'serif' | 'condensed' | 'rounded';

/** Theme configuration for projection display */
export interface ThemeConfig {
  /** CSS background value (hex, gradient, or image URL) */
  background: string;
  /** Type of background */
  backgroundType: 'solid' | 'gradient' | 'image';
  /** Font size offset from auto-calculated base (px) */
  fontSizeOffset: number;
  /** Selected font family preset */
  fontPreset: FontPresetKey;
}

/** Current projection display mode */
export type ProjectionMode = 'slide' | 'black' | 'clear' | 'logo';

/** Audio playback state */
export interface AudioState {
  /** Currently loaded hymn ID */
  hymnId: string | null;
  /** Directus field name of the active track (e.g. 'track_only', 'soprano_voice') */
  trackField: string | null;
  /** Whether audio is currently playing */
  playing: boolean;
}

/** Full visualizador application state */
export interface VisualizadorState {
  playlist: PlaylistHymn[];
  activeHymnIndex: number;
  activeSlideIndex: number;
  projectionMode: ProjectionMode;
  projectionOpen: boolean;
  theme: ThemeConfig;
  audio: AudioState;
}

/** Discriminated union of all visualizador actions */
export type VisualizadorAction =
  | { type: 'ADD_HYMN'; hymn: HymnForPdf }
  | { type: 'REMOVE_HYMN'; index: number }
  | { type: 'REORDER_PLAYLIST'; from: number; to: number }
  | { type: 'SET_ACTIVE_HYMN'; index: number }
  | { type: 'SET_ACTIVE_SLIDE'; index: number }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'SET_PROJECTION_MODE'; mode: ProjectionMode }
  | { type: 'SET_PROJECTION_OPEN'; open: boolean }
  | { type: 'SET_THEME'; theme: Partial<ThemeConfig> }
  | { type: 'SET_AUDIO_TRACK'; hymnId: string; trackField: string }
  | { type: 'SET_AUDIO_PLAYING'; playing: boolean }
  | { type: 'FONT_SIZE_UP' }
  | { type: 'FONT_SIZE_DOWN' }
  | { type: 'SET_FONT_PRESET'; preset: FontPresetKey };
