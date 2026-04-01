import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/lib/directus/services/hymns', () => ({
  fetchAsset: vi.fn(),
  isValidUuid: vi.fn(),
}));

const { fetchAsset, isValidUuid } = await import('@/app/lib/directus/services/hymns');
const routeModule = await import('@/app/api/hymns/score/[fileId]/route');
const GET = routeModule.GET;

const mockFetchAsset = fetchAsset as ReturnType<typeof vi.fn>;
const mockIsValidUuid = isValidUuid as ReturnType<typeof vi.fn>;

function makeParams(fileId: string) {
  return { params: Promise.resolve({ fileId }) };
}

describe('GET /api/hymns/score/[fileId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid UUID', async () => {
    mockIsValidUuid.mockReturnValue(false);

    const res = await GET(new Request('http://localhost/api/hymns/score/bad-id'), makeParams('bad-id'));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('ID inv');
  });

  it('returns MusicXML with correct headers', async () => {
    mockIsValidUuid.mockReturnValue(true);
    mockFetchAsset.mockResolvedValue(
      new Response('<score-partwise/>', {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      }),
    );

    const fileId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const res = await GET(new Request(`http://localhost/api/hymns/score/${fileId}`), makeParams(fileId));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xml');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    const body = await res.text();
    expect(body).toBe('<score-partwise/>');
  });

  it('returns 500 on fetch error', async () => {
    mockIsValidUuid.mockReturnValue(true);
    mockFetchAsset.mockRejectedValue(new Error('network error'));

    const fileId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const res = await GET(new Request(`http://localhost/api/hymns/score/${fileId}`), makeParams(fileId));

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toContain('Error interno');
  });
});
