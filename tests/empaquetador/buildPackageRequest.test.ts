import { describe, it, expect } from 'vitest';
import { buildPackageRequest } from '@/app/empaquetador/lib/build-package-request';
import { initialWizardState, WizardState } from '@/app/empaquetador/hooks/useWizardReducer';
import { packageRequestSchema } from '@/app/lib/zip/zip.schema';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';

function mockHymn(id: string): HymnSearchResult {
  return {
    id,
    name: `Himno ${id.slice(0, 4)}`,
    hymn_number: 1,
    hymnal: null,
    categories: [],
    audioFiles: {
      track_only: { id: 'f1', filename_download: 'track.mp3', filesize: 1000, type: 'audio/mpeg' },
      midi_file: null,
      soprano_voice: null,
      alto_voice: null,
      tenor_voice: null,
      bass_voice: null,
    },
    hasAnyAudio: true,
    musicxmlFileId: null,
    hasMusicXml: false,
  };
}

const UUID_A = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const UUID_B = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

describe('buildPackageRequest', () => {
  it('converts hymns with no audio selections to empty audioFiles arrays', () => {
    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A)],
    };
    const result = buildPackageRequest(state);
    expect(result.hymns).toHaveLength(1);
    expect(result.hymns[0].id).toBe(UUID_A);
    expect(result.hymns[0].audioFiles).toEqual([]);
  });

  it('converts Map/Set audio selections to plain string arrays', () => {
    const audioSelections = new Map<string, Set<string>>();
    audioSelections.set(UUID_A, new Set(['track_only', 'soprano_voice']));

    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A)],
      audioSelections,
    };
    const result = buildPackageRequest(state);
    expect(result.hymns[0].audioFiles).toEqual(
      expect.arrayContaining(['track_only', 'soprano_voice']),
    );
    expect(result.hymns[0].audioFiles).toHaveLength(2);
  });

  it('output validates against PackageRequest schema', () => {
    const audioSelections = new Map<string, Set<string>>();
    audioSelections.set(UUID_A, new Set(['track_only']));

    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A), mockHymn(UUID_B)],
      audioSelections,
      layout: 'two-per-page',
      style: 'plain',
    };
    const result = buildPackageRequest(state);
    // Should not throw
    const parsed = packageRequestSchema.parse(result);
    expect(parsed.hymns).toHaveLength(2);
    expect(parsed.layout).toBe('two-per-page');
    expect(parsed.style).toBe('plain');
  });

  it('includes layout and style from state', () => {
    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A)],
      layout: 'two-per-page',
      style: 'plain',
    };
    const result = buildPackageRequest(state);
    expect(result.layout).toBe('two-per-page');
    expect(result.style).toBe('plain');
  });

  // Phase 05: New field tests
  it('includes printMode, orientation, fontPreset, includeBibleRef from state', () => {
    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A)],
      printMode: 'booklet',
      orientation: 'landscape',
      fontPreset: 'legible',
      includeBibleRef: false,
    };
    const result = buildPackageRequest(state);
    expect(result.printMode).toBe('booklet');
    expect(result.orientation).toBe('landscape');
    expect(result.fontPreset).toBe('legible');
    expect(result.includeBibleRef).toBe(false);
  });

  it('Phase 05 fields validate against PackageRequest schema', () => {
    const state: WizardState = {
      ...initialWizardState,
      selectedHymns: [mockHymn(UUID_A)],
      printMode: 'booklet',
      orientation: 'landscape',
      fontPreset: 'moderna',
      includeBibleRef: false,
    };
    const result = buildPackageRequest(state);
    const parsed = packageRequestSchema.parse(result);
    expect(parsed.printMode).toBe('booklet');
    expect(parsed.orientation).toBe('landscape');
    expect(parsed.fontPreset).toBe('moderna');
    expect(parsed.includeBibleRef).toBe(false);
  });

  it('schema defaults Phase 05 fields when omitted', () => {
    // Simulate an old-style request without the new fields
    const oldRequest = {
      hymns: [{ id: UUID_A, audioFiles: [] }],
      layout: 'one-per-page' as const,
      style: 'decorated' as const,
    };
    const parsed = packageRequestSchema.parse(oldRequest);
    expect(parsed.printMode).toBe('simple');
    expect(parsed.orientation).toBe('portrait');
    expect(parsed.fontPreset).toBe('clasica');
    expect(parsed.includeBibleRef).toBe(true);
  });
});
