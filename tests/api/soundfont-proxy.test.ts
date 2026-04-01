import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/lib/directus/services/hymns', () => ({
  fetchAsset: vi.fn(),
  isValidUuid: vi.fn(),
}));

const { fetchAsset, isValidUuid } = await import('@/app/lib/directus/services/hymns');
const routeModule = await import('@/app/api/hymns/soundfont/route');
const GET = routeModule.GET;

const mockFetchAsset = fetchAsset as ReturnType<typeof vi.fn>;
const mockIsValidUuid = isValidUuid as ReturnType<typeof vi.fn>;

describe('GET /api/hymns/soundfont', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when SOUNDFONT_FILE_ID not set', async () => {
    delete process.env.SOUNDFONT_FILE_ID;

    const res = await GET(new Request('http://localhost/api/hymns/soundfont'));
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toContain('SOUNDFONT_FILE_ID no configurado');
  });

  it('returns SoundFont with immutable caching', async () => {
    process.env.SOUNDFONT_FILE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    mockIsValidUuid.mockReturnValue(true);
    mockFetchAsset.mockResolvedValue(
      new Response(new Uint8Array([0x52, 0x49, 0x46, 0x46]), {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': '4',
        },
      }),
    );

    const res = await GET(new Request('http://localhost/api/hymns/soundfont'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    const cacheControl = res.headers.get('Cache-Control') || '';
    expect(cacheControl).toContain('immutable');
  });

  it('returns 500 on fetch error', async () => {
    process.env.SOUNDFONT_FILE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    mockIsValidUuid.mockReturnValue(true);
    mockFetchAsset.mockRejectedValue(new Error('network error'));

    const res = await GET(new Request('http://localhost/api/hymns/soundfont'));
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toContain('Error interno');
  });
});
