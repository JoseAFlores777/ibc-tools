import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  HymnSearchResult,
  HymnForPdf,
  HymnSearchFilters,
  AudioFileInfo,
} from '@/app/interfaces/Hymn.interface';

// These imports will fail until Plan 02 creates the service file
// import { searchHymns, fetchHymnForPdf, getAssetUrl } from '@/app/lib/directus/services/hymns';

describe('searchHymns', () => {
  it('returns results matching name query with _icontains', async () => {
    // SC-1: searchHymns({ query: 'Alabemos' }) returns hymns with 'Alabemos' in name
    const filters: HymnSearchFilters = { query: 'Alabemos' };
    // TODO: implement when service exists
    expect(true).toBe(false); // RED: force fail
  });

  it('returns exact match on hymn number', async () => {
    // SC-1: searchHymns({ hymnNumber: 42 }) returns hymn #42
    const filters: HymnSearchFilters = { hymnNumber: 42 };
    expect(true).toBe(false); // RED
  });

  it('filters by hymnal ID', async () => {
    // SC-1: searchHymns({ hymnalId: 'uuid-here' }) returns only hymns from that hymnal
    const filters: HymnSearchFilters = { hymnalId: 'test-hymnal-uuid' };
    expect(true).toBe(false); // RED
  });

  it('filters by category through M2M junction', async () => {
    // SC-1: searchHymns({ categoryId: 1 }) uses deep filter on categories.hymn_categories_id
    const filters: HymnSearchFilters = { categoryId: 1 };
    expect(true).toBe(false); // RED
  });

  it('includes audio availability flags with file metadata', async () => {
    // SC-4: Each result has audioFiles with AudioFileInfo | null per field
    // SC-4: hasAnyAudio is true when at least one audio field is non-null
    expect(true).toBe(false); // RED
  });

  it('defaults to limit 25 when no limit specified', async () => {
    const filters: HymnSearchFilters = {};
    expect(true).toBe(false); // RED
  });
});

describe('fetchHymnForPdf', () => {
  it('returns complete hymn data with lyrics and metadata', async () => {
    // SC-2: fetchHymnForPdf('uuid') returns HymnForPdf with letter_hymn, name, hymn_number, etc.
    expect(true).toBe(false); // RED
  });

  it('resolves author names and roles', async () => {
    // SC-2: authors array contains authors_id.name and author_roles with description and rol_abbr
    expect(true).toBe(false); // RED
  });

  it('resolves audio file metadata from directus_files', async () => {
    // SC-2, SC-4: audioFiles contains resolved AudioFileInfo with id, filename_download, filesize, type
    expect(true).toBe(false); // RED
  });

  it('handles null audio fields gracefully', async () => {
    // SC-4: When audio UUID is null, corresponding audioFiles field is null (not error)
    expect(true).toBe(false); // RED
  });
});

describe('getAssetUrl', () => {
  it('constructs correct Directus asset URL from file ID', () => {
    // getAssetUrl('abc-123') returns '{DIRECTUS_URL}/assets/abc-123'
    expect(true).toBe(false); // RED
  });
});
