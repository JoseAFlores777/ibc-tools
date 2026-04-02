import { NextResponse } from 'next/server';
import { searchHymns } from '@/app/lib/directus/services/hymns';
import type { HymnSearchField } from '@/app/interfaces/Hymn.interface';

export const dynamic = 'force-dynamic';

const VALID_FIELDS = new Set<HymnSearchField>(['name', 'number', 'letter']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const hymnal = searchParams.get('hymnal') || undefined;
    const category = searchParams.get('category');
    const limit = Number(searchParams.get('limit')) || 25;
    const offset = Number(searchParams.get('offset')) || 0;

    // Parsear campos de búsqueda: ?fields=name,letter
    const fieldsParam = searchParams.get('fields');
    let searchIn: HymnSearchField[] | undefined;
    if (fieldsParam) {
      searchIn = fieldsParam
        .split(',')
        .map((f) => f.trim() as HymnSearchField)
        .filter((f) => VALID_FIELDS.has(f));
      if (searchIn.length === 0) searchIn = undefined;
    }

    // Buscar por ID directo (para restaurar himno desde URL)
    const id = searchParams.get('id');
    if (id) {
      const results = await searchHymns({ query: undefined, limit: 500 });
      const found = results.filter((h) => h.id === id);
      return NextResponse.json(
        { ok: true, data: found },
        { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
      );
    }

    const results = await searchHymns({
      query: q,
      hymnalId: hymnal,
      categoryId: category ? Number(category) : undefined,
      searchIn,
      limit: Math.min(limit, 500),
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/hymns/search error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Error al buscar himnos' },
      { status: 500 },
    );
  }
}
