import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';

// Mock de renderHymnPdf
vi.mock('@/app/lib/pdf/render-hymn-pdf', () => ({
  renderHymnPdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
}));

// Mock de servicios de Directus
vi.mock('@/app/lib/directus/services/hymns', () => ({
  fetchHymnForPdf: vi.fn(),
  getAssetUrl: vi.fn((id: string) => `http://directus.test/assets/${id}`),
}));

/** Fixture de himno para pruebas */
function makeHymnFixture(overrides: Partial<HymnForPdf> = {}): HymnForPdf {
  return {
    id: 'abc-123',
    name: 'Grande Es Tu Fidelidad',
    hymn_number: 42,
    hymn_time_signature: '4/4',
    letter_hymn: '<p>Grande es tu fidelidad</p>',
    bible_text: null,
    bible_reference: null,
    hymnal: { name: 'Himnario Bautista', publisher: null },
    authors: [],
    audioFiles: {
      track_only: {
        id: 'audio-uuid-1',
        filename_download: 'track.mp3',
        filesize: 1024,
        type: 'audio/mpeg',
      },
      midi_file: null,
      soprano_voice: {
        id: 'audio-uuid-2',
        filename_download: 'soprano.mp3',
        filesize: 2048,
        type: 'audio/mpeg',
      },
      alto_voice: null,
      tenor_voice: null,
      bass_voice: null,
    },
    ...overrides,
  };
}

describe('POST /api/hymns/package', () => {
  let POST: typeof import('@/app/api/hymns/package/route').POST;
  let mockFetchHymnForPdf: ReturnType<typeof vi.fn>;
  let mockRenderHymnPdf: ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    vi.resetAllMocks();

    const routeModule = await import('@/app/api/hymns/package/route');
    POST = routeModule.POST;

    const hymnsService = await import('@/app/lib/directus/services/hymns');
    mockFetchHymnForPdf = hymnsService.fetchHymnForPdf as ReturnType<
      typeof vi.fn
    >;

    const pdfMod = await import('@/app/lib/pdf/render-hymn-pdf');
    mockRenderHymnPdf = pdfMod.renderHymnPdf as ReturnType<typeof vi.fn>;
    mockRenderHymnPdf.mockResolvedValue(Buffer.from('fake-pdf-content'));

    // Mock fetch global para descargas de audio
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(Buffer.from('fake-audio'), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/hymns/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost/api/hymns/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toContain('valid JSON');
  });

  it('returns 400 for invalid request (missing hymns)', async () => {
    const request = makeRequest({
      layout: 'one-per-page',
      style: 'plain',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Solicitud invalida');
    expect(json.details).toBeDefined();
  });

  it('returns 400 for empty hymns array', async () => {
    const request = makeRequest({
      hymns: [],
      layout: 'one-per-page',
      style: 'plain',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it('returns streaming response with correct headers', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    const request = makeRequest({
      hymns: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
      layout: 'one-per-page',
      style: 'decorated',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="himnos.zip"',
    );
    expect(response.headers.get('X-Hymn-Count')).toBe('1');
  });

  it('X-Hymn-Count reflects number of requested hymns', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    const request = makeRequest({
      hymns: [
        { id: '550e8400-e29b-41d4-a716-446655440001' },
        { id: '550e8400-e29b-41d4-a716-446655440002' },
        { id: '550e8400-e29b-41d4-a716-446655440003' },
      ],
      layout: 'two-per-page',
      style: 'plain',
    });

    const response = await POST(request);

    expect(response.headers.get('X-Hymn-Count')).toBe('3');
  });

  it('response body is a ReadableStream', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    const request = makeRequest({
      hymns: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
      layout: 'one-per-page',
      style: 'decorated',
    });

    const response = await POST(request);

    expect(response.body).not.toBeNull();
    expect(typeof response.body!.getReader).toBe('function');
  });

  it('generates valid ZIP content', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    const request = makeRequest({
      hymns: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
      layout: 'one-per-page',
      style: 'plain',
    });

    const response = await POST(request);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // ZIP magic bytes: PK\x03\x04
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });
});
