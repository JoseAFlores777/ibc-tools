import { NextResponse } from 'next/server';
import { fetchHymnForPdf, isValidUuid } from '@/app/lib/directus/services/hymns';
import { parseHymnHtml } from '@/app/lib/pdf/html-to-pdf';

export const dynamic = 'force-dynamic';

/** Formatos de exportacion soportados */
type ExportFormat = 'pdf-decorated' | 'pdf-plain' | 'pptx' | 'presentation-pdf' | 'pro6';

const VALID_FORMATS = new Set<ExportFormat>([
  'pdf-decorated',
  'pdf-plain',
  'pptx',
  'presentation-pdf',
  'pro6',
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') as ExportFormat | null;

    if (!isValidUuid(id)) {
      return NextResponse.json({ ok: false, error: 'ID invalido' }, { status: 400 });
    }
    if (!format || !VALID_FORMATS.has(format)) {
      return NextResponse.json(
        { ok: false, error: `Formato invalido. Opciones: ${[...VALID_FORMATS].join(', ')}` },
        { status: 400 },
      );
    }

    const hymn = await fetchHymnForPdf(id);
    const safeName = (hymn.hymn_number != null ? `${hymn.hymn_number} - ${hymn.name}` : hymn.name)
      .replace(/[/\\:*?"<>|]/g, '_');
    const parsedHymn = { hymn, verses: parseHymnHtml(hymn.letter_hymn || '') };

    if (format === 'pdf-decorated' || format === 'pdf-plain') {
      const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
      const style = format === 'pdf-plain' ? 'plain' : 'decorated';
      const buffer = await renderHymnPdf({
        hymns: [hymn],
        layout: 'one-per-page',
        style,
        printMode: 'simple',
        orientation: 'portrait',
        fontPreset: 'clasica',
        includeBibleRef: true,
        copiesPerPage: 1,
        copiesFontSize: 9,
      });
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${safeName} (${style}).pdf"`,
        },
      });
    }

    if (format === 'pptx') {
      const { generateHymnPptx } = await import('@/app/lib/presentation/generate-hymn-pptx');
      const buffer = await generateHymnPptx([parsedHymn], hymn.name);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${safeName}.pptx"`,
        },
      });
    }

    if (format === 'presentation-pdf') {
      const { generateHymnPresentationPdf } = await import(
        '@/app/lib/presentation/generate-hymn-presentation-pdf'
      );
      const buffer = await generateHymnPresentationPdf([parsedHymn], hymn.name);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${safeName} (presentacion).pdf"`,
        },
      });
    }

    if (format === 'pro6') {
      const { generateHymnProPresenter } = await import(
        '@/app/lib/presentation/generate-hymn-propresenter'
      );
      const files = generateHymnProPresenter([parsedHymn]);
      const file = files[0];
      return new Response(file.content, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${safeName}.pro6"`,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'Formato no soportado' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/hymns/[id]/export error:', msg);
    return NextResponse.json({ ok: false, error: 'Error al exportar' }, { status: 500 });
  }
}
