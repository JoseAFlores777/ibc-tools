import { NextResponse } from 'next/server';
import { searchHymns } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const hymnal = searchParams.get('hymnal') || undefined;
    const category = searchParams.get('category');
    const limit = Number(searchParams.get('limit')) || 25;
    const offset = Number(searchParams.get('offset')) || 0;

    const results = await searchHymns({
      query: q,
      hymnalId: hymnal,
      categoryId: category ? Number(category) : undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      { ok: true, data: results },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
        },
      },
    );
  } catch (error: any) {
    console.error('GET /api/hymns/search error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Error al buscar himnos' },
      { status: 500 },
    );
  }
}
