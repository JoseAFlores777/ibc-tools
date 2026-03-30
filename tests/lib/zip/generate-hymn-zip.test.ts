import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';
import type { PackageRequest } from '@/app/lib/zip/zip.schema';

/** Defaults para los campos nuevos de impresion */
const PRINT_DEFAULTS = {
  printMode: 'simple' as const,
  orientation: 'portrait' as const,
  fontPreset: 'clasica' as const,
  includeBibleRef: true,
  bookletTitle: '',
  bookletSubtitle: '',
  bookletDate: '',
  bookletBibleRef: '',
};

// Mock de renderHymnPdf
vi.mock('@/app/lib/pdf/render-hymn-pdf', () => ({
  renderHymnPdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
}));

// Mock de servicios de Directus
vi.mock('@/app/lib/directus/services/hymns', () => ({
  fetchHymnForPdf: vi.fn(),
  getAssetUrl: vi.fn((id: string) => `http://directus.test/assets/${id}`),
}));

// Fixture de himno para pruebas
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
      soprano_voice: null,
      alto_voice: null,
      tenor_voice: null,
      bass_voice: null,
    },
    ...overrides,
  };
}

describe('hymnFolderName', () => {
  let hymnFolderName: typeof import('@/app/lib/zip/generate-hymn-zip').hymnFolderName;

  beforeEach(async () => {
    const mod = await import('@/app/lib/zip/generate-hymn-zip');
    hymnFolderName = mod.hymnFolderName;
  });

  it('formats with number', () => {
    expect(hymnFolderName(42, 'Grande Es Tu Fidelidad', 'abc')).toBe(
      '42 - Grande Es Tu Fidelidad',
    );
  });

  it('formats without number', () => {
    expect(hymnFolderName(null, 'Test', 'abc-123')).toBe('himno-abc-123 - Test');
  });

  it('sanitizes special characters', () => {
    expect(hymnFolderName(1, 'Himno/Con:Chars*Bad?"<>|', 'x')).toBe(
      '1 - Himno_Con_Chars_Bad_____',
    );
  });
});

describe('createStreamingZip', () => {
  it('returns archive and webStream', async () => {
    const { createStreamingZip } = await import('@/app/lib/zip/generate-hymn-zip');

    const { archive, webStream } = createStreamingZip();

    expect(archive).toBeDefined();
    expect(typeof archive.append).toBe('function');
    expect(typeof archive.finalize).toBe('function');
    expect(webStream).toBeDefined();
    expect(typeof webStream.getReader).toBe('function');

    // Limpiar: finalizar el archive para no dejar streams abiertos
    archive.abort();
  });
});

describe('assembleHymnPackage', () => {
  let assembleHymnPackage: typeof import('@/app/lib/zip/generate-hymn-zip').assembleHymnPackage;
  let mockFetchHymnForPdf: ReturnType<typeof vi.fn>;
  let mockRenderHymnPdf: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    const mod = await import('@/app/lib/zip/generate-hymn-zip');
    assembleHymnPackage = mod.assembleHymnPackage;

    const hymnsService = await import('@/app/lib/directus/services/hymns');
    mockFetchHymnForPdf = hymnsService.fetchHymnForPdf as ReturnType<typeof vi.fn>;

    const pdfMod = await import('@/app/lib/pdf/render-hymn-pdf');
    mockRenderHymnPdf = pdfMod.renderHymnPdf as ReturnType<typeof vi.fn>;
    mockRenderHymnPdf.mockResolvedValue(Buffer.from('fake-pdf-content'));
  });

  it('adds PDF entries to archive', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    const archiver = await import('archiver');
    const archive = archiver.default('zip', { zlib: { level: 5 } });
    const { PassThrough } = await import('stream');
    const pass = new PassThrough();
    archive.pipe(pass);

    // Consumir el stream para evitar backpressure
    const chunks: Buffer[] = [];
    pass.on('data', (chunk: Buffer) => chunks.push(chunk));

    const request: PackageRequest = {
      ...PRINT_DEFAULTS,
      hymns: [{ id: 'abc-123', audioFiles: [] }],
      layout: 'one-per-page',
      style: 'decorated',
    };

    const result = await assembleHymnPackage(archive, request);

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(mockRenderHymnPdf).toHaveBeenCalled();
  });

  it('handles PDF render error with ERROR.txt', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);
    mockRenderHymnPdf.mockRejectedValue(new Error('PDF render failed'));

    const archiver = await import('archiver');
    const archive = archiver.default('zip', { zlib: { level: 5 } });
    const appendSpy = vi.spyOn(archive, 'append');
    const { PassThrough } = await import('stream');
    const pass = new PassThrough();
    archive.pipe(pass);
    pass.on('data', () => {});

    const request: PackageRequest = {
      ...PRINT_DEFAULTS,
      hymns: [{ id: 'abc-123', audioFiles: [] }],
      layout: 'one-per-page',
      style: 'plain',
    };

    const result = await assembleHymnPackage(archive, request);

    expect(result.errorCount).toBe(1);

    // Verificar que se agrego ERROR.txt con el mensaje de error
    const errorCall = appendSpy.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Error al generar PDF'),
    );
    expect(errorCall).toBeDefined();
  });

  it('handles audio download error with ERROR.txt', async () => {
    const hymn = makeHymnFixture();
    mockFetchHymnForPdf.mockResolvedValue(hymn);

    // Mock fetch global para simular error 404
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      body: null,
    });

    const archiver = await import('archiver');
    const archive = archiver.default('zip', { zlib: { level: 5 } });
    const appendSpy = vi.spyOn(archive, 'append');
    const { PassThrough } = await import('stream');
    const pass = new PassThrough();
    archive.pipe(pass);
    pass.on('data', () => {});

    const request: PackageRequest = {
      ...PRINT_DEFAULTS,
      hymns: [{ id: 'abc-123', audioFiles: ['track_only'] }],
      layout: 'one-per-page',
      style: 'decorated',
    };

    const result = await assembleHymnPackage(archive, request);

    // PDF exito + audio error = success (parcial) pero con ERROR.txt
    const errorCall = appendSpy.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Error al descargar audio'),
    );
    expect(errorCall).toBeDefined();

    // Restaurar fetch
    globalThis.fetch = originalFetch;
  });

  it('returns correct successCount and errorCount', async () => {
    const hymn1 = makeHymnFixture({ id: 'hymn-1', name: 'Himno 1', hymn_number: 1 });
    const hymn2 = makeHymnFixture({ id: 'hymn-2', name: 'Himno 2', hymn_number: 2 });

    mockFetchHymnForPdf
      .mockResolvedValueOnce(hymn1)
      .mockRejectedValueOnce(new Error('Not found'));

    const archiver = await import('archiver');
    const archive = archiver.default('zip', { zlib: { level: 5 } });
    const { PassThrough } = await import('stream');
    const pass = new PassThrough();
    archive.pipe(pass);
    pass.on('data', () => {});

    const request: PackageRequest = {
      ...PRINT_DEFAULTS,
      hymns: [
        { id: 'hymn-1', audioFiles: [] },
        { id: 'hymn-2', audioFiles: [] },
      ],
      layout: 'one-per-page',
      style: 'plain',
    };

    const result = await assembleHymnPackage(archive, request);

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
  });
});
