import { NextResponse } from 'next/server';
import { fetchHymnForPdf } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await fetchHymnForPdf(id);
    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (error: any) {
    console.error('GET /api/hymns/[id] error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener himno' },
      { status: 500 },
    );
  }
}
