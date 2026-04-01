// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { visualizadorReducer, initialState } from './useVisualizador';
import type { VisualizadorState, PlaylistHymn, SlideData } from '../lib/types';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';

/** Helper to create a mock PlaylistHymn with pre-built slides */
function mockPlaylistHymn(
  id: string,
  slideCount: number = 3
): PlaylistHymn {
  const slides: SlideData[] = Array.from({ length: slideCount }, (_, i) => ({
    label: `Slide ${i}`,
    text: `Content ${i}`,
    verseLabel: `Verse ${i}`,
  }));
  return {
    id,
    hymnData: {
      id,
      name: `Himno ${id}`,
      hymn_number: parseInt(id) || 1,
      hymn_time_signature: '4/4',
      letter_hymn: '<p>I</p><p>Test</p>',
      bible_text: null,
      bible_reference: null,
      hymnal: null,
      authors: [],
      audioFiles: {
        track_only: null,
        midi_file: null,
        soprano_voice: null,
        alto_voice: null,
        tenor_voice: null,
        bass_voice: null,
      },
    },
    slides,
  };
}

/** Helper: state with hymns already in playlist */
function stateWithHymns(hymns: PlaylistHymn[], activeHymn = 0, activeSlide = 0): VisualizadorState {
  return {
    ...initialState,
    playlist: hymns,
    activeHymnIndex: hymns.length > 0 ? activeHymn : -1,
    activeSlideIndex: activeSlide,
  };
}

describe('visualizadorReducer', () => {
  describe('ADD_HYMN', () => {
    it('appends hymn to empty playlist and sets activeHymnIndex to 0', () => {
      const hymn = mockPlaylistHymn('1');
      const result = visualizadorReducer(initialState, {
        type: 'ADD_HYMN',
        hymn: hymn.hymnData,
      });
      expect(result.playlist.length).toBe(1);
      expect(result.playlist[0].id).toBe('1');
      expect(result.activeHymnIndex).toBe(0);
    });

    it('appends hymn to existing playlist', () => {
      const state = stateWithHymns([mockPlaylistHymn('1')]);
      const result = visualizadorReducer(state, {
        type: 'ADD_HYMN',
        hymn: mockPlaylistHymn('2').hymnData,
      });
      expect(result.playlist.length).toBe(2);
      // activeHymnIndex stays at 0 (the originally active hymn)
      expect(result.activeHymnIndex).toBe(0);
    });
  });

  describe('REMOVE_HYMN', () => {
    it('removes hymn at given index', () => {
      const state = stateWithHymns([mockPlaylistHymn('1'), mockPlaylistHymn('2')]);
      const result = visualizadorReducer(state, { type: 'REMOVE_HYMN', index: 0 });
      expect(result.playlist.length).toBe(1);
      expect(result.playlist[0].id).toBe('2');
    });

    it('adjusts activeHymnIndex when removing before active', () => {
      const state = stateWithHymns(
        [mockPlaylistHymn('1'), mockPlaylistHymn('2'), mockPlaylistHymn('3')],
        2
      );
      const result = visualizadorReducer(state, { type: 'REMOVE_HYMN', index: 0 });
      expect(result.activeHymnIndex).toBe(1);
    });

    it('sets activeHymnIndex to -1 when playlist becomes empty', () => {
      const state = stateWithHymns([mockPlaylistHymn('1')]);
      const result = visualizadorReducer(state, { type: 'REMOVE_HYMN', index: 0 });
      expect(result.playlist.length).toBe(0);
      expect(result.activeHymnIndex).toBe(-1);
    });
  });

  describe('REORDER_PLAYLIST', () => {
    it('moves hymn from index `from` to index `to`', () => {
      const state = stateWithHymns([
        mockPlaylistHymn('1'),
        mockPlaylistHymn('2'),
        mockPlaylistHymn('3'),
      ]);
      const result = visualizadorReducer(state, {
        type: 'REORDER_PLAYLIST',
        from: 0,
        to: 2,
      });
      expect(result.playlist.map((h) => h.id)).toEqual(['2', '3', '1']);
    });
  });

  describe('NEXT_SLIDE', () => {
    it('increments activeSlideIndex within current hymn', () => {
      const state = stateWithHymns([mockPlaylistHymn('1', 5)], 0, 1);
      const result = visualizadorReducer(state, { type: 'NEXT_SLIDE' });
      expect(result.activeSlideIndex).toBe(2);
    });

    it('advances to next hymn when on last slide (D-07)', () => {
      const state = stateWithHymns(
        [mockPlaylistHymn('1', 3), mockPlaylistHymn('2', 3)],
        0,
        2 // last slide of first hymn
      );
      const result = visualizadorReducer(state, { type: 'NEXT_SLIDE' });
      expect(result.activeHymnIndex).toBe(1);
      expect(result.activeSlideIndex).toBe(0);
    });

    it('does nothing on last slide of last hymn', () => {
      const state = stateWithHymns([mockPlaylistHymn('1', 3)], 0, 2);
      const result = visualizadorReducer(state, { type: 'NEXT_SLIDE' });
      expect(result.activeHymnIndex).toBe(0);
      expect(result.activeSlideIndex).toBe(2);
    });
  });

  describe('PREV_SLIDE', () => {
    it('decrements activeSlideIndex within current hymn', () => {
      const state = stateWithHymns([mockPlaylistHymn('1', 5)], 0, 3);
      const result = visualizadorReducer(state, { type: 'PREV_SLIDE' });
      expect(result.activeSlideIndex).toBe(2);
    });

    it('goes to last slide of previous hymn when on first slide', () => {
      const state = stateWithHymns(
        [mockPlaylistHymn('1', 3), mockPlaylistHymn('2', 4)],
        1,
        0 // first slide of second hymn
      );
      const result = visualizadorReducer(state, { type: 'PREV_SLIDE' });
      expect(result.activeHymnIndex).toBe(0);
      expect(result.activeSlideIndex).toBe(2); // last slide of first hymn (0-indexed)
    });
  });

  describe('SET_PROJECTION_MODE', () => {
    it('changes projectionMode', () => {
      const result = visualizadorReducer(initialState, {
        type: 'SET_PROJECTION_MODE',
        mode: 'black',
      });
      expect(result.projectionMode).toBe('black');
    });
  });

  describe('FONT_SIZE_UP / FONT_SIZE_DOWN', () => {
    it('increments fontSizeOffset by 2', () => {
      const result = visualizadorReducer(initialState, { type: 'FONT_SIZE_UP' });
      expect(result.theme.fontSizeOffset).toBe(2);
    });

    it('decrements fontSizeOffset by 2', () => {
      const result = visualizadorReducer(initialState, { type: 'FONT_SIZE_DOWN' });
      expect(result.theme.fontSizeOffset).toBe(-2);
    });

    it('caps fontSizeOffset at +40', () => {
      let state = initialState;
      for (let i = 0; i < 25; i++) {
        state = visualizadorReducer(state, { type: 'FONT_SIZE_UP' });
      }
      expect(state.theme.fontSizeOffset).toBe(40);
    });

    it('caps fontSizeOffset at -20', () => {
      let state = initialState;
      for (let i = 0; i < 10; i++) {
        state = visualizadorReducer(state, { type: 'FONT_SIZE_DOWN' });
      }
      expect(state.theme.fontSizeOffset).toBe(-20);
    });
  });

  describe('SET_AUDIO_TRACK', () => {
    it('sets audio.playing to false when hymnId changes (D-20)', () => {
      const state: VisualizadorState = {
        ...initialState,
        audio: { hymnId: 'old-hymn', trackField: 'track_only', playing: true },
      };
      const result = visualizadorReducer(state, {
        type: 'SET_AUDIO_TRACK',
        hymnId: 'new-hymn',
        trackField: 'soprano_voice',
      });
      expect(result.audio.hymnId).toBe('new-hymn');
      expect(result.audio.trackField).toBe('soprano_voice');
      expect(result.audio.playing).toBe(false);
    });

    it('keeps audio.playing unchanged when hymnId is the same', () => {
      const state: VisualizadorState = {
        ...initialState,
        audio: { hymnId: 'same-hymn', trackField: 'track_only', playing: true },
      };
      const result = visualizadorReducer(state, {
        type: 'SET_AUDIO_TRACK',
        hymnId: 'same-hymn',
        trackField: 'soprano_voice',
      });
      expect(result.audio.playing).toBe(true);
    });
  });
});
