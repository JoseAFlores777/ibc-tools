import { NextResponse } from 'next/server';
import { fetchChurchEvents } from '@/app/lib/directus/services/events';

// Este handler es dinámico por naturaleza y no se debe prerender
export const dynamic = 'force-dynamic';
// Cache del handler por 5 minutos para llamadas desde el cliente
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 100);
    const events = await fetchChurchEvents({ limit });
    return NextResponse.json({ ok: true, data: events }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/events error:', msg);
    return NextResponse.json({ ok: false, error: 'Error al obtener eventos' }, { status: 500 });
  }
}
