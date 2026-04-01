import {
  createStreamingZip,
  assembleHymnPackage,
} from '@/app/lib/zip/generate-hymn-zip';
import { packageRequestSchema } from '@/app/lib/zip/zip.schema';

export const dynamic = 'force-dynamic';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

/** Máximo de paquetes ZIP generándose simultáneamente */
const MAX_CONCURRENT = 3;
let activeCount = 0;

export async function POST(request: Request) {
  // Paso 0: Verificar concurrencia
  if (activeCount >= MAX_CONCURRENT) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'El servidor está procesando otros paquetes. Intente de nuevo en unos segundos.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '10' } },
    );
  }

  // Paso 1: Verificar tamaño del body
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Solicitud demasiado grande' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Paso 2: Parsear y validar el body con Zod
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Request body must be valid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const parsed = packageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Solicitud inválida',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const packageRequest = parsed.data;

  // Paso 3: Crear streaming ZIP (archiver -> PassThrough -> Web ReadableStream)
  const { archive, webStream } = createStreamingZip();

  // Paso 4: Reservar slot de concurrencia e iniciar ensamblaje
  activeCount++;
  assembleHymnPackage(archive, packageRequest)
    .then(({ successCount, errorCount }) => {
      if (successCount === 0) {
        console.error(
          `POST /api/hymns/package: all ${errorCount} hymns failed. ZIP contains only error files.`,
        );
      }
    })
    .catch((err) => {
      console.error('POST /api/hymns/package assembly error:', err);
      archive.abort();
    })
    .finally(() => {
      activeCount--;
    });

  // Paso 5: Retornar streaming response inmediatamente
  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="himnos.zip"',
      'X-Hymn-Count': String(packageRequest.hymns.length),
    },
  });
}
