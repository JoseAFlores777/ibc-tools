import { fetchAsset, isValidUuid } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

/** Proxy de SoundFont — sirve el archivo SF2 desde Directus con cache inmutable */
export async function GET() {
  try {
    const soundfontFileId = process.env.SOUNDFONT_FILE_ID;

    if (!soundfontFileId) {
      return new Response('SOUNDFONT_FILE_ID no configurado', { status: 500 });
    }

    if (!isValidUuid(soundfontFileId)) {
      return new Response('SOUNDFONT_FILE_ID inválido', { status: 500 });
    }

    const res = await fetchAsset(soundfontFileId);

    if (!res.ok) {
      return new Response('SoundFont no disponible', { status: res.status });
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': res.headers.get('Content-Length') || '',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new Response('Error interno', { status: 500 });
  }
}
