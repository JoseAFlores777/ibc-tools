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
  style: 'decorated' | 'plain';
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
  | { type: 'SET_STYLE'; style: 'decorated' | 'plain' }
  | { type: 'TOGGLE_AUDIO'; hymnId: string; field: string }
  | { type: 'SELECT_ALL_AUDIO'; selectAll: boolean }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

/** Estado inicial del wizard */
export const initialWizardState: WizardState = {
  step: 1,
  selectedHymns: [],
  layout: 'one-per-page',
  style: 'decorated',
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

    case 'RESET':
      return {
        ...initialWizardState,
        audioSelections: new Map(),
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
