'use client';

/**
 * Main state management hook for the Visualizador de Himnos.
 * Uses useReducer with a pure reducer function (exported for testing).
 */

import { useReducer } from 'react';
import type {
  VisualizadorState,
  VisualizadorAction,
  PlaylistHymn,
} from '../lib/types';
import { DEFAULT_THEME } from '../lib/theme-presets';
import {
  parseHymnHtmlClient,
  buildSlideGroups,
} from '../lib/build-slides-client';

/** Initial state for the visualizador */
export const initialState: VisualizadorState = {
  playlist: [],
  activeHymnIndex: -1,
  activeSlideIndex: 0,
  projectionMode: 'slide',
  projectionOpen: false,
  theme: { ...DEFAULT_THEME },
  audio: { hymnId: null, trackField: null, playing: false, volume: 1 },
};

/**
 * Pure reducer function for all visualizador state transitions.
 * Exported for direct testing without React hooks.
 */
export function visualizadorReducer(
  state: VisualizadorState,
  action: VisualizadorAction
): VisualizadorState {
  switch (action.type) {
    case 'CLEAR_PLAYLIST':
      return {
        ...state,
        playlist: [],
        activeHymnIndex: -1,
        activeSlideIndex: 0,
        audio: { ...state.audio, playing: false, hymnId: null, trackField: null },
      };

    case 'ADD_HYMN': {
      const verses = parseHymnHtmlClient(action.hymn.letter_hymn ?? '');
      const slides = buildSlideGroups(verses, action.hymn);
      const newHymn: PlaylistHymn = {
        id: action.hymn.id,
        hymnData: action.hymn,
        slides,
      };
      const newPlaylist = [...state.playlist, newHymn];
      return {
        ...state,
        playlist: newPlaylist,
        // Si la playlist estaba vacia, activar el primer himno
        activeHymnIndex:
          state.activeHymnIndex === -1 ? 0 : state.activeHymnIndex,
      };
    }

    case 'REMOVE_HYMN': {
      const newPlaylist = state.playlist.filter((_, i) => i !== action.index);
      let newActiveIndex = state.activeHymnIndex;

      if (newPlaylist.length === 0) {
        newActiveIndex = -1;
      } else if (action.index < state.activeHymnIndex) {
        // Ajustar indice si se removio antes del activo
        newActiveIndex = state.activeHymnIndex - 1;
      } else if (action.index === state.activeHymnIndex) {
        // Si se removio el activo, clampar al ultimo disponible
        newActiveIndex = Math.min(
          state.activeHymnIndex,
          newPlaylist.length - 1
        );
      }

      return {
        ...state,
        playlist: newPlaylist,
        activeHymnIndex: newActiveIndex,
        activeSlideIndex: 0,
      };
    }

    case 'REORDER_PLAYLIST': {
      const newPlaylist = [...state.playlist];
      const [moved] = newPlaylist.splice(action.from, 1);
      newPlaylist.splice(action.to, 0, moved);

      // Ajustar activeHymnIndex si fue movido
      let newActiveIndex = state.activeHymnIndex;
      if (state.activeHymnIndex === action.from) {
        newActiveIndex = action.to;
      } else if (
        action.from < state.activeHymnIndex &&
        action.to >= state.activeHymnIndex
      ) {
        newActiveIndex = state.activeHymnIndex - 1;
      } else if (
        action.from > state.activeHymnIndex &&
        action.to <= state.activeHymnIndex
      ) {
        newActiveIndex = state.activeHymnIndex + 1;
      }

      return {
        ...state,
        playlist: newPlaylist,
        activeHymnIndex: newActiveIndex,
      };
    }

    case 'SET_ACTIVE_HYMN': {
      const newAudio = { ...state.audio };
      // Per D-20: detener audio si cambia el himno
      if (
        state.playlist[action.index] &&
        newAudio.hymnId !== state.playlist[action.index].id
      ) {
        newAudio.playing = false;
      }
      return {
        ...state,
        activeHymnIndex: action.index,
        activeSlideIndex: 0,
        audio: newAudio,
      };
    }

    case 'SET_ACTIVE_SLIDE':
      return { ...state, activeSlideIndex: action.index, projectionMode: 'slide' };

    case 'NEXT_SLIDE': {
      if (state.activeHymnIndex < 0) return state;
      const currentHymn = state.playlist[state.activeHymnIndex];
      if (!currentHymn) return state;

      if (state.activeSlideIndex < currentHymn.slides.length - 1) {
        return { ...state, activeSlideIndex: state.activeSlideIndex + 1, projectionMode: 'slide' };
      }
      // Auto-advance al siguiente himno en la playlist (D-07)
      if (state.activeHymnIndex < state.playlist.length - 1) {
        return {
          ...state,
          activeHymnIndex: state.activeHymnIndex + 1,
          activeSlideIndex: 0,
          projectionMode: 'slide',
        };
      }
      return state;
    }

    case 'PREV_SLIDE': {
      if (state.activeHymnIndex < 0) return state;

      if (state.activeSlideIndex > 0) {
        return { ...state, activeSlideIndex: state.activeSlideIndex - 1, projectionMode: 'slide' };
      }
      // Ir al ultimo slide del himno anterior
      if (state.activeHymnIndex > 0) {
        const prevHymn = state.playlist[state.activeHymnIndex - 1];
        return {
          ...state,
          activeHymnIndex: state.activeHymnIndex - 1,
          activeSlideIndex: prevHymn.slides.length - 1,
          projectionMode: 'slide',
        };
      }
      return state;
    }

    case 'SET_PROJECTION_MODE':
      return { ...state, projectionMode: action.mode };

    case 'SET_PROJECTION_OPEN':
      return { ...state, projectionOpen: action.open };

    case 'SET_THEME':
      return { ...state, theme: { ...state.theme, ...action.theme } };

    case 'SET_AUDIO_TRACK': {
      const playing =
        action.hymnId === state.audio.hymnId ? state.audio.playing : false;
      return {
        ...state,
        audio: {
          ...state.audio,
          hymnId: action.hymnId,
          trackField: action.trackField,
          playing,
        },
      };
    }

    case 'SET_AUDIO_PLAYING':
      return {
        ...state,
        audio: { ...state.audio, playing: action.playing },
      };

    case 'SET_AUDIO_VOLUME':
      return {
        ...state,
        audio: { ...state.audio, volume: Math.max(0, Math.min(1, action.volume)) },
      };

    case 'FONT_SIZE_UP':
      return {
        ...state,
        theme: {
          ...state.theme,
          fontSizeOffset: Math.min(state.theme.fontSizeOffset + 2, 40),
        },
      };

    case 'FONT_SIZE_DOWN':
      return {
        ...state,
        theme: {
          ...state.theme,
          fontSizeOffset: Math.max(state.theme.fontSizeOffset - 2, -20),
        },
      };

    case 'SET_FONT_PRESET':
      return {
        ...state,
        theme: { ...state.theme, fontPreset: action.preset },
      };

    case 'LOAD_THEME':
      return {
        ...state,
        theme: action.theme,
      };

    default:
      return state;
  }
}

/** Main hook: wraps visualizadorReducer with useReducer */
export function useVisualizador() {
  const [state, dispatch] = useReducer(visualizadorReducer, initialState);
  return { state, dispatch };
}
