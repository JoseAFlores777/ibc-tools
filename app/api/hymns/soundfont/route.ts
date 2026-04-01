import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { fetchAsset, isValidUuid } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

/**
 * Proxy de SoundFont — sirve el archivo SF2.
 * Prioridad: SOUNDFONT_FILE_ID (Directus) > archivo local en public/soundfont/
 */
export async function GET() {
  try {
    const soundfontFileId = process.env.SOUNDFONT_FILE_ID;

    // Opción 1: SoundFont desde Directus (si está configurado)
    if (soundfontFileId && isValidUuid(soundfontFileId)) {
      const res = await fetchAsset(soundfontFileId);
      if (res.ok) {
        return new Response(res.body, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': res.headers.get('Content-Length') || '',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }
    }

    // Opción 2: SoundFont local bundled en public/soundfont/
    const localPath = path.join(process.cwd(), 'public', 'soundfont', 'TimGM6mb.sf2');
    const buffer = await readFile(localPath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (error) {
    console.error('Error sirviendo SoundFont:', error);
    return new Response('SoundFont no disponible', { status: 500 });
  }
}
