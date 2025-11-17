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
    const limit = limitParam ? Number(limitParam) : 50;
    const events = await fetchChurchEvents({ limit });
    return NextResponse.json({ ok: true, data: events }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } });
  } catch (error: any) {
    console.error('GET /api/events error:', error?.message || error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}
