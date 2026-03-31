import { fetchAsset, isValidUuid } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

/** Proxy de audio — reenvía el asset de Directus con autenticación server-side */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;

    if (!isValidUuid(fileId)) {
      return new Response('ID inválido', { status: 400 });
    }

    const res = await fetchAsset(fileId);

    if (!res.ok) {
      return new Response('Audio no disponible', { status: res.status });
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': res.headers.get('Content-Length') || '',
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch {
    return new Response('Error interno', { status: 500 });
  }
}
