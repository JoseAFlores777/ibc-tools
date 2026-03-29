import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del servicio de himnos
vi.mock('@/app/lib/directus/services/hymns', () => ({
  searchHymns: vi.fn(),
}));

describe('GET /api/hymns/search', () => {
  let GET: typeof import('@/app/api/hymns/search/route').GET;
  let mockSearchHymns: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    const routeModule = await import('@/app/api/hymns/search/route');
    GET = routeModule.GET;

    const hymnsService = await import('@/app/lib/directus/services/hymns');
    mockSearchHymns = hymnsService.searchHymns as ReturnType<typeof vi.fn>;
  });

  it('returns search results with ok: true', async () => {
    const mockResults = [
      { id: '1', name: 'Himno 1', hymn_number: 1, hasAnyAudio: true },
      { id: '2', name: 'Himno 2', hymn_number: 2, hasAnyAudio: false },
    ];
    mockSearchHymns.mockResolvedValue(mockResults);

    const request = new Request('http://localhost/api/hymns/search?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe('Himno 1');
  });

  it('passes query params to searchHymns correctly', async () => {
    mockSearchHymns.mockResolvedValue([]);

    const request = new Request(
      'http://localhost/api/hymns/search?q=fidelidad&hymnal=abc-uuid&category=5&limit=10&offset=20',
    );
    await GET(request);

    expect(mockSearchHymns).toHaveBeenCalledWith({
      query: 'fidelidad',
      hymnalId: 'abc-uuid',
      categoryId: 5,
      limit: 10,
      offset: 20,
    });
  });

  it('uses default limit 25 and offset 0 when not provided', async () => {
    mockSearchHymns.mockResolvedValue([]);

    const request = new Request('http://localhost/api/hymns/search');
    await GET(request);

    expect(mockSearchHymns).toHaveBeenCalledWith({
      query: undefined,
      hymnalId: undefined,
      categoryId: undefined,
      limit: 25,
      offset: 0,
    });
  });

  it('returns 500 on service error', async () => {
    mockSearchHymns.mockRejectedValue(new Error('Directus connection failed'));

    const request = new Request('http://localhost/api/hymns/search?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Error al buscar himnos');
  });
});
