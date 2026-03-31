'use client';

import { useReducer } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';

/** Campos de audio disponibles en un himno */
export const AUDIO_FIELD_NAMES = [
  'track_only',
  'midi_file',
  'soprano_voice',
  'alto_voice',
  'tenor_voice',
  'bass_voice',
] as const;

export type AudioFieldName = (typeof AUDIO_FIELD_NAMES)[number];

/** Estado completo del wizard del Empaquetador */
export interface WizardState {
  step: 1 | 2 | 3;
  selectedHymns: HymnSearchResult[];
  layout: 'one-per-page' | 'two-per-page';
  style: 'decorated' | 'decorated-eco' | 'plain';
  printMode: 'simple' | 'booklet';
  orientation: 'portrait' | 'landscape';
  fontPreset: 'clasica' | 'moderna' | 'legible';
  includeBibleRef: boolean;
  bookletTitle: string;
  bookletSubtitle: string;
  bookletDate: string;
  bookletBibleRef: string;
  copiesPerPage: 1 | 2 | 4;
  copiesFontSize: number;
  audioSelections: Map<string, Set<string>>;
  isGenerating: boolean;
  error: string | null;
}

/** Acciones del wizard */
export type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'ADD_HYMN'; hymn: HymnSearchResult }
  | { type: 'REMOVE_HYMN'; hymnId: string }
  | { type: 'SET_LAYOUT'; layout: 'one-per-page' | 'two-per-page' }
  | { type: 'SET_STYLE'; style: 'decorated' | 'decorated-eco' | 'plain' }
  | { type: 'TOGGLE_AUDIO'; hymnId: string; field: string }
  | { type: 'SELECT_ALL_AUDIO'; selectAll: boolean }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PRINT_MODE'; printMode: 'simple' | 'booklet' }
  | { type: 'SET_ORIENTATION'; orientation: 'portrait' | 'landscape' }
  | { type: 'SET_FONT_PRESET'; fontPreset: 'clasica' | 'moderna' | 'legible' }
  | { type: 'SET_INCLUDE_BIBLE_REF'; includeBibleRef: boolean }
  | { type: 'SET_BOOKLET_TITLE'; bookletTitle: string }
  | { type: 'SET_BOOKLET_SUBTITLE'; bookletSubtitle: string }
  | { type: 'SET_BOOKLET_DATE'; bookletDate: string }
  | { type: 'SET_BOOKLET_BIBLE_REF'; bookletBibleRef: string }
  | { type: 'SET_COPIES_PER_PAGE'; copiesPerPage: 1 | 2 | 4 }
  | { type: 'SET_COPIES_FONT_SIZE'; copiesFontSize: number }
  | { type: 'RESET' }
  | { type: 'LOAD_PACKAGE'; hymns: HymnSearchResult[]; layout: WizardState['layout']; style: WizardState['style']; audioSelections: Map<string, Set<string>>; printMode?: WizardState['printMode']; orientation?: WizardState['orientation']; fontPreset?: WizardState['fontPreset']; includeBibleRef?: boolean; bookletTitle?: string; bookletSubtitle?: string; bookletDate?: string; bookletBibleRef?: string; copiesPerPage?: 1 | 2 | 4; copiesFontSize?: number };

/** Estado inicial del wizard */
export const initialWizardState: WizardState = {
  step: 1,
  selectedHymns: [],
  layout: 'one-per-page',
  style: 'decorated',
  printMode: 'simple',
  orientation: 'portrait',
  fontPreset: 'clasica',
  includeBibleRef: true,
  bookletTitle: '',
  bookletSubtitle: '',
  bookletDate: '',
  bookletBibleRef: '',
  copiesPerPage: 1,
  copiesFontSize: 9,
  audioSelections: new Map(),
  isGenerating: false,
  error: null,
};

/** Reducer principal del wizard del Empaquetador */
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };

    case 'ADD_HYMN': {
      // Deduplicar por id
      if (state.selectedHymns.some((h) => h.id === action.hymn.id)) {
        return state;
      }
      return { ...state, selectedHymns: [...state.selectedHymns, action.hymn] };
    }

    case 'REMOVE_HYMN': {
      const newSelections = new Map(state.audioSelections);
      newSelections.delete(action.hymnId);
      return {
        ...state,
        selectedHymns: state.selectedHymns.filter((h) => h.id !== action.hymnId),
        audioSelections: newSelections,
      };
    }

    case 'SET_LAYOUT':
      return { ...state, layout: action.layout };

    case 'SET_STYLE':
      return { ...state, style: action.style };

    case 'TOGGLE_AUDIO': {
      const newSelections = new Map(state.audioSelections);
      const hymnSet = new Set(newSelections.get(action.hymnId) ?? []);

      if (hymnSet.has(action.field)) {
        hymnSet.delete(action.field);
      } else {
        hymnSet.add(action.field);
      }

      newSelections.set(action.hymnId, hymnSet);
      return { ...state, audioSelections: newSelections };
    }

    case 'SELECT_ALL_AUDIO': {
      if (!action.selectAll) {
        return { ...state, audioSelections: new Map() };
      }

      const newSelections = new Map<string, Set<string>>();
      for (const hymn of state.selectedHymns) {
        const fields = new Set<string>();
        for (const field of AUDIO_FIELD_NAMES) {
          if (hymn.audioFiles[field] !== null) {
            fields.add(field);
          }
        }
        if (fields.size > 0) {
          newSelections.set(hymn.id, fields);
        }
      }
      return { ...state, audioSelections: newSelections };
    }

    case 'SET_GENERATING':
      return { ...state, isGenerating: action.isGenerating };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_PRINT_MODE':
      return { ...state, printMode: action.printMode };

    case 'SET_ORIENTATION':
      return { ...state, orientation: action.orientation };

    case 'SET_FONT_PRESET':
      return { ...state, fontPreset: action.fontPreset };

    case 'SET_INCLUDE_BIBLE_REF':
      return { ...state, includeBibleRef: action.includeBibleRef };

    case 'SET_BOOKLET_TITLE':
      return { ...state, bookletTitle: action.bookletTitle };

    case 'SET_BOOKLET_SUBTITLE':
      return { ...state, bookletSubtitle: action.bookletSubtitle };

    case 'SET_BOOKLET_DATE':
      return { ...state, bookletDate: action.bookletDate };

    case 'SET_BOOKLET_BIBLE_REF':
      return { ...state, bookletBibleRef: action.bookletBibleRef };

    case 'SET_COPIES_PER_PAGE':
      return { ...state, copiesPerPage: action.copiesPerPage };

    case 'SET_COPIES_FONT_SIZE':
      return { ...state, copiesFontSize: action.copiesFontSize };

    case 'RESET':
      return {
        ...initialWizardState,
        audioSelections: new Map(),
      };

    case 'LOAD_PACKAGE':
      return {
        step: 2,
        selectedHymns: action.hymns,
        layout: action.layout,
        style: action.style,
        printMode: action.printMode ?? 'simple',
        orientation: action.orientation ?? 'portrait',
        fontPreset: action.fontPreset ?? 'clasica',
        includeBibleRef: action.includeBibleRef ?? true,
        bookletTitle: action.bookletTitle ?? '',
        bookletSubtitle: action.bookletSubtitle ?? '',
        bookletDate: action.bookletDate ?? '',
        bookletBibleRef: action.bookletBibleRef ?? '',
        copiesPerPage: action.copiesPerPage ?? 1,
        copiesFontSize: action.copiesFontSize ?? 9,
        audioSelections: action.audioSelections,
        isGenerating: false,
        error: null,
      };

    default:
      return state;
  }
}

/** Hook que encapsula useReducer con el wizard reducer */
export function useWizardReducer(): [WizardState, React.Dispatch<WizardAction>] {
  return useReducer(wizardReducer, {
    ...initialWizardState,
    audioSelections: new Map(),
  });
}
