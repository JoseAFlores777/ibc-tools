import {
  createStreamingZip,
  assembleHymnPackage,
} from '@/app/lib/zip/generate-hymn-zip';
import { packageRequestSchema } from '@/app/lib/zip/zip.schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Paso 1: Parsear y validar el body con Zod
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
        error: 'Solicitud invalida',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const packageRequest = parsed.data;

  // Paso 2: Crear streaming ZIP (archiver -> PassThrough -> Web ReadableStream)
  const { archive, webStream } = createStreamingZip();

  // Paso 3: Iniciar ensamblaje concurrentemente -- NO hacer await
  // El Response se retorna inmediatamente mientras el assembly escribe entradas
  // al archive que fluyen por el stream ya retornado.
  assembleHymnPackage(archive, packageRequest)
    .then(({ successCount, errorCount }) => {
      if (successCount === 0) {
        // D-09: si TODOS fallaron, no podemos cambiar el status code
        // (headers ya enviados). El ZIP contendra solo archivos ERROR.txt.
        console.error(
          `POST /api/hymns/package: all ${errorCount} hymns failed. ZIP contains only error files.`,
        );
      }
    })
    .catch((err) => {
      console.error('POST /api/hymns/package assembly error:', err);
      archive.abort();
    });

  // Paso 4: Retornar streaming response inmediatamente (D-02, D-10, D-11)
  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="himnos.zip"',
      'X-Hymn-Count': String(packageRequest.hymns.length),
    },
  });
}
