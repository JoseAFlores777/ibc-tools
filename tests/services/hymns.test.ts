import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  HymnSearchResult,
  HymnForPdf,
  HymnSearchFilters,
  AudioFileInfo,
} from '@/app/interfaces/Hymn.interface';

// Mock @directus/sdk
const mockReadItems = vi.fn();
const mockReadItem = vi.fn();
vi.mock('@directus/sdk', () => ({
  readItems: (...args: any[]) => mockReadItems(...args),
  readItem: (...args: any[]) => mockReadItem(...args),
}));

// Mock Directus client
const mockRequest = vi.fn();
vi.mock('@/app/lib/directus', () => ({
  default: vi.fn(() => ({ request: mockRequest })),
  getDirectus: vi.fn(() => ({ request: mockRequest })),
}));

// Mock data
const mockAudioFile: AudioFileInfo = {
  id: 'file-uuid-1',
  filename_download: 'track.mp3',
  filesize: 5242880,
  type: 'audio/mpeg',
};

const mockHymnRaw = {
  id: 'hymn-uuid-1',
  name: 'Alabemos al Senor',
  hymn_number: 42,
  hymnal: { id: 'hymnal-uuid', name: 'Himnario Bautista' },
  categories: [{ hymn_categories_id: { id: 1, name: 'Alabanza' } }],
  track_only: { ...mockAudioFile },
  midi_file: null,
  soprano_voice: null,
  alto_voice: null,
  tenor_voice: null,
  bass_voice: null,
};

const mockHymnForPdfRaw = {
  id: 'hymn-uuid-1',
  name: 'Alabemos al Senor',
  hymn_number: 42,
  hymn_time_signature: '4/4',
  letter_hymn: '<p>Alabemos al Senor</p>',
  bible_text: 'Cantad al Senor cantico nuevo',
  bible_reference: 'Salmo 96:1',
  hymnal: { name: 'Himnario Bautista', publisher: 'Editorial Bautista' },
  authors: [
    {
      authors_id: { name: 'Juan Perez' },
      author_roles: [
        { author_roles_id: { description: 'Compositor', rol_abbr: 'C' } },
      ],
    },
  ],
  track_only: { ...mockAudioFile },
  midi_file: { id: 'midi-uuid', filename_download: 'hymn.mid', filesize: 1024, type: 'audio/midi' },
  soprano_voice: null,
  alto_voice: null,
  tenor_voice: null,
  bass_voice: null,
};

// Import after mocks
import { searchHymns, fetchHymnForPdf, getAssetUrl } from '@/app/lib/directus/services/hymns';

describe('searchHymns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadItems.mockReturnValue('readItems-query');
    mockRequest.mockResolvedValue([mockHymnRaw]);
  });

  it('returns results matching name query with _icontains', async () => {
    const results = await searchHymns({ query: 'Alabemos' });

    expect(mockReadItems).toHaveBeenCalledWith(
      'hymn',
      expect.objectContaining({
        filter: expect.objectContaining({
          name: { _icontains: 'Alabemos' },
          status: { _eq: 'published' },
        }),
      }),
    );
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alabemos al Senor');
  });

  it('returns exact match on hymn number', async () => {
    await searchHymns({ hymnNumber: 42 });

    expect(mockReadItems).toHaveBeenCalledWith(
      'hymn',
      expect.objectContaining({
        filter: expect.objectContaining({
          hymn_number: { _eq: 42 },
        }),
      }),
    );
  });

  it('filters by hymnal ID', async () => {
    await searchHymns({ hymnalId: 'test-hymnal-uuid' });

    expect(mockReadItems).toHaveBeenCalledWith(
      'hymn',
      expect.objectContaining({
        filter: expect.objectContaining({
          hymnal: { _eq: 'test-hymnal-uuid' },
        }),
      }),
    );
  });

  it('filters by category through M2M junction', async () => {
    await searchHymns({ categoryId: 1 });

    expect(mockReadItems).toHaveBeenCalledWith(
      'hymn',
      expect.objectContaining({
        filter: expect.objectContaining({
          categories: { hymn_categories_id: { _eq: 1 } },
        }),
      }),
    );
  });

  it('includes audio availability flags with file metadata', async () => {
    const results = await searchHymns({ query: 'Alabemos' });

    expect(results[0].audioFiles.track_only).toEqual(mockAudioFile);
    expect(results[0].audioFiles.midi_file).toBeNull();
    expect(results[0].audioFiles.soprano_voice).toBeNull();
    expect(results[0].hasAnyAudio).toBe(true);
  });

  it('defaults to limit 25 when no limit specified', async () => {
    await searchHymns({});

    expect(mockReadItems).toHaveBeenCalledWith(
      'hymn',
      expect.objectContaining({
        limit: 25,
      }),
    );
  });
});

describe('fetchHymnForPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadItem.mockReturnValue('readItem-query');
    mockRequest.mockResolvedValue(mockHymnForPdfRaw);
  });

  it('returns complete hymn data with lyrics and metadata', async () => {
    const result = await fetchHymnForPdf('hymn-uuid-1');

    expect(mockRequest).toHaveBeenCalled();
    expect(result.id).toBe('hymn-uuid-1');
    expect(result.name).toBe('Alabemos al Senor');
    expect(result.letter_hymn).toBe('<p>Alabemos al Senor</p>');
    expect(result.hymn_number).toBe(42);
    expect(result.hymn_time_signature).toBe('4/4');
    expect(result.bible_text).toBe('Cantad al Senor cantico nuevo');
    expect(result.bible_reference).toBe('Salmo 96:1');
    expect(result.hymnal).toEqual({ name: 'Himnario Bautista', publisher: 'Editorial Bautista' });
  });

  it('resolves author names and roles', async () => {
    const result = await fetchHymnForPdf('hymn-uuid-1');

    expect(result.authors).toHaveLength(1);
    expect(result.authors[0].authors_id?.name).toBe('Juan Perez');
    expect(result.authors[0].author_roles[0].author_roles_id?.description).toBe('Compositor');
    expect(result.authors[0].author_roles[0].author_roles_id?.rol_abbr).toBe('C');
  });

  it('resolves audio file metadata from directus_files', async () => {
    const result = await fetchHymnForPdf('hymn-uuid-1');

    expect(result.audioFiles.track_only).toEqual(mockAudioFile);
    expect(result.audioFiles.midi_file).toEqual({
      id: 'midi-uuid',
      filename_download: 'hymn.mid',
      filesize: 1024,
      type: 'audio/midi',
    });
  });

  it('handles null audio fields gracefully', async () => {
    const result = await fetchHymnForPdf('hymn-uuid-1');

    expect(result.audioFiles.soprano_voice).toBeNull();
    expect(result.audioFiles.alto_voice).toBeNull();
    expect(result.audioFiles.tenor_voice).toBeNull();
    expect(result.audioFiles.bass_voice).toBeNull();
  });
});

describe('getAssetUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('constructs correct Directus asset URL from file ID', () => {
    process.env.DIRECTUS_URL = 'https://cms.example.com';
    const url = getAssetUrl('abc-123');
    expect(url).toBe('https://cms.example.com/assets/abc-123');
  });

  it('falls back to NEXT_PUBLIC_DIRECTUS_URL when DIRECTUS_URL is not set', () => {
    delete process.env.DIRECTUS_URL;
    process.env.NEXT_PUBLIC_DIRECTUS_URL = 'https://public-cms.example.com';
    const url = getAssetUrl('def-456');
    expect(url).toBe('https://public-cms.example.com/assets/def-456');
  });
});
