import { NextResponse } from 'next/server';
import { readItems } from '@directus/sdk';
import { getDirectus } from '@/app/lib/directus';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getDirectus();
    const items = await client.request(
      // @ts-expect-error — Directus SDK typing con generics no resuelve bien las colecciones custom
      readItems('hymn_categories', {
        fields: ['id', 'name'],
        sort: ['name'],
      }),
    );

    return NextResponse.json(
      { ok: true, data: items },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/categories error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener categorias' },
      { status: 500 },
    );
  }
}
