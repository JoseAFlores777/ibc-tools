import { describe, it, expect } from 'vitest';
import {
  wizardReducer,
  initialWizardState,
  WizardState,
  WizardAction,
} from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';

/** Helper: crea un HymnSearchResult mock */
function mockHymn(overrides: Partial<HymnSearchResult> = {}): HymnSearchResult {
  return {
    id: overrides.id ?? 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    name: overrides.name ?? 'Himno de Prueba',
    hymn_number: overrides.hymn_number ?? 1,
    hymnal: overrides.hymnal ?? { id: '11111111-2222-3333-4444-555555555555', name: 'Himnario Bautista' },
    categories: overrides.categories ?? [
      { hymn_categories_id: { id: 1, name: 'Adoracion' } },
    ],
    audioFiles: overrides.audioFiles ?? {
      track_only: { id: 'f1', filename_download: 'track.mp3', filesize: 1000, type: 'audio/mpeg' },
      midi_file: null,
      soprano_voice: { id: 'f2', filename_download: 'soprano.mp3', filesize: 2000, type: 'audio/mpeg' },
      alto_voice: null,
      tenor_voice: null,
      bass_voice: null,
    },
    hasAnyAudio: overrides.hasAnyAudio ?? true,
    musicxmlFileId: overrides.musicxmlFileId ?? null,
    hasMusicXml: overrides.hasMusicXml ?? false,
  };
}

const hymn1 = mockHymn({ id: '11111111-0000-0000-0000-000000000001', name: 'Himno 1' });
const hymn2 = mockHymn({ id: '22222222-0000-0000-0000-000000000002', name: 'Himno 2' });

describe('wizardReducer', () => {
  it('initialWizardState has correct defaults', () => {
    expect(initialWizardState.step).toBe(1);
    expect(initialWizardState.selectedHymns).toEqual([]);
    expect(initialWizardState.layout).toBe('one-per-page');
    expect(initialWizardState.style).toBe('decorated');
    expect(initialWizardState.audioSelections).toBeInstanceOf(Map);
    expect(initialWizardState.audioSelections.size).toBe(0);
    expect(initialWizardState.isGenerating).toBe(false);
    expect(initialWizardState.error).toBeNull();
  });

  it('ADD_HYMN adds hymn to selectedHymns', () => {
    const state = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    expect(state.selectedHymns).toHaveLength(1);
    expect(state.selectedHymns[0].id).toBe(hymn1.id);
  });

  it('ADD_HYMN deduplicates by id', () => {
    const state1 = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    const state2 = wizardReducer(state1, { type: 'ADD_HYMN', hymn: hymn1 });
    expect(state2.selectedHymns).toHaveLength(1);
  });

  it('REMOVE_HYMN removes hymn and its audio selections', () => {
    let state = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    state = wizardReducer(state, { type: 'TOGGLE_AUDIO', hymnId: hymn1.id, field: 'track_only' });
    state = wizardReducer(state, { type: 'REMOVE_HYMN', hymnId: hymn1.id });
    expect(state.selectedHymns).toHaveLength(0);
    expect(state.audioSelections.has(hymn1.id)).toBe(false);
  });

  it('SET_STEP changes step', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_STEP', step: 2 });
    expect(state.step).toBe(2);
  });

  it('SET_LAYOUT changes layout', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_LAYOUT', layout: 'two-per-page' });
    expect(state.layout).toBe('two-per-page');
  });

  it('SET_STYLE changes style', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_STYLE', style: 'plain' });
    expect(state.style).toBe('plain');
  });

  it('TOGGLE_AUDIO adds field when not present', () => {
    const state = wizardReducer(initialWizardState, { type: 'TOGGLE_AUDIO', hymnId: hymn1.id, field: 'track_only' });
    expect(state.audioSelections.get(hymn1.id)?.has('track_only')).toBe(true);
  });

  it('TOGGLE_AUDIO removes field when present', () => {
    let state = wizardReducer(initialWizardState, { type: 'TOGGLE_AUDIO', hymnId: hymn1.id, field: 'track_only' });
    state = wizardReducer(state, { type: 'TOGGLE_AUDIO', hymnId: hymn1.id, field: 'track_only' });
    expect(state.audioSelections.get(hymn1.id)?.has('track_only')).toBe(false);
  });

  it('SELECT_ALL_AUDIO true populates all non-null audio fields per hymn', () => {
    let state = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    state = wizardReducer(state, { type: 'SELECT_ALL_AUDIO', selectAll: true });
    const selected = state.audioSelections.get(hymn1.id);
    expect(selected).toBeDefined();
    // hymn1 has track_only and soprano_voice non-null
    expect(selected!.has('track_only')).toBe(true);
    expect(selected!.has('soprano_voice')).toBe(true);
    // null fields should NOT be selected
    expect(selected!.has('midi_file')).toBe(false);
    expect(selected!.has('alto_voice')).toBe(false);
  });

  it('SELECT_ALL_AUDIO false clears all selections', () => {
    let state = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    state = wizardReducer(state, { type: 'SELECT_ALL_AUDIO', selectAll: true });
    state = wizardReducer(state, { type: 'SELECT_ALL_AUDIO', selectAll: false });
    expect(state.audioSelections.size).toBe(0);
  });

  it('SET_GENERATING toggles isGenerating', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_GENERATING', isGenerating: true });
    expect(state.isGenerating).toBe(true);
  });

  it('SET_ERROR sets error string or null', () => {
    const state1 = wizardReducer(initialWizardState, { type: 'SET_ERROR', error: 'Something failed' });
    expect(state1.error).toBe('Something failed');
    const state2 = wizardReducer(state1, { type: 'SET_ERROR', error: null });
    expect(state2.error).toBeNull();
  });

  it('RESET returns initial state', () => {
    let state = wizardReducer(initialWizardState, { type: 'ADD_HYMN', hymn: hymn1 });
    state = wizardReducer(state, { type: 'SET_STEP', step: 3 });
    state = wizardReducer(state, { type: 'RESET' });
    expect(state.step).toBe(1);
    expect(state.selectedHymns).toEqual([]);
    expect(state.audioSelections.size).toBe(0);
  });

  // Phase 05: New field tests
  it('initialWizardState has correct Phase 05 defaults', () => {
    expect(initialWizardState.printMode).toBe('simple');
    expect(initialWizardState.orientation).toBe('portrait');
    expect(initialWizardState.fontPreset).toBe('clasica');
    expect(initialWizardState.includeBibleRef).toBe(true);
  });

  it('SET_PRINT_MODE sets printMode to booklet', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_PRINT_MODE', printMode: 'booklet' });
    expect(state.printMode).toBe('booklet');
  });

  it('SET_ORIENTATION sets orientation to landscape', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_ORIENTATION', orientation: 'landscape' });
    expect(state.orientation).toBe('landscape');
  });

  it('SET_FONT_PRESET sets fontPreset to legible', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_FONT_PRESET', fontPreset: 'legible' });
    expect(state.fontPreset).toBe('legible');
  });

  it('SET_INCLUDE_BIBLE_REF sets includeBibleRef to false', () => {
    const state = wizardReducer(initialWizardState, { type: 'SET_INCLUDE_BIBLE_REF', includeBibleRef: false });
    expect(state.includeBibleRef).toBe(false);
  });

  it('RESET resets Phase 05 fields to defaults', () => {
    let state = wizardReducer(initialWizardState, { type: 'SET_PRINT_MODE', printMode: 'booklet' });
    state = wizardReducer(state, { type: 'SET_ORIENTATION', orientation: 'landscape' });
    state = wizardReducer(state, { type: 'SET_FONT_PRESET', fontPreset: 'legible' });
    state = wizardReducer(state, { type: 'SET_INCLUDE_BIBLE_REF', includeBibleRef: false });
    state = wizardReducer(state, { type: 'RESET' });
    expect(state.printMode).toBe('simple');
    expect(state.orientation).toBe('portrait');
    expect(state.fontPreset).toBe('clasica');
    expect(state.includeBibleRef).toBe(true);
  });
});
