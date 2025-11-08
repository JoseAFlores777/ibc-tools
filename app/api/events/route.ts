import { NextResponse } from 'next/server';
import { fetchChurchEvents } from '@/app/lib/directus/services/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 50;
    const events = await fetchChurchEvents({ limit });
    return NextResponse.json({ ok: true, data: events });
  } catch (error: any) {
    console.error('GET /api/events error:', error?.message || error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}
