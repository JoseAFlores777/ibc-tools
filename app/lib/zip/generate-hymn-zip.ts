import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import { renderHymnPdf } from '@/app/lib/pdf/render-hymn-pdf';
import { parseHymnHtml } from '@/app/lib/pdf/html-to-pdf';
import { fetchHymnForPdf, fetchAsset } from '@/app/lib/directus/services/hymns';
import type { HymnForPdf, HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import type { PackageRequest } from './zip.schema';

/** Caracteres no permitidos en nombres de archivos/carpetas */
const UNSAFE_CHARS = /[/\\:*?"<>|]/g;

/** Etiquetas en español para los campos de audio */
const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

/** Sanitiza un string para uso como nombre de archivo/carpeta */
function sanitize(name: string): string {
  return name.replace(UNSAFE_CHARS, '_');
}

/**
 * Genera el nombre base para un himno (usado en carpeta y archivos).
 * Formato: "{hymn_number} - {name}" sanitizado para filesystem.
 */
export function hymnFolderName(
  hymnNumber: number | null,
  name: string,
  id: string,
): string {
  const prefix = hymnNumber !== null ? String(hymnNumber) : `himno-${id}`;
  return `${prefix} - ${sanitize(name)}`;
}

/**
 * Crea un archiver ZIP que fluye a un PassThrough y lo convierte a Web ReadableStream.
 * Retorna el archive (para agregar entradas) y el webStream (para enviar al cliente).
 */
export function createStreamingZip(): {
  archive: archiver.Archiver;
  webStream: ReadableStream<Uint8Array>;
} {
  const passthrough = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 5 } });

  archive.pipe(passthrough);

  // Propagar errores del archiver al passthrough para que el stream se cierre correctamente
  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    passthrough.destroy(err);
  });

  const webStream = Readable.toWeb(passthrough) as ReadableStream<Uint8Array>;

  return { archive, webStream };
}

/**
 * Intenta obtener la extension de un MIME type para fallback de nombre de archivo.
 */
function extensionFromMime(mimeType: string | null): string {
  if (!mimeType) return 'bin';
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/midi': 'mid',
    'audio/x-midi': 'mid',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
    'audio/mp4': 'm4a',
  };
  return map[mimeType] ?? 'bin';
}

/**
 * Ensambla el contenido del ZIP: PDFs individuales, audio seleccionado, y PDF combinado.
 * Maneja errores por himno individualmente (genera ERROR.txt en lugar de fallar todo el ZIP).
 */
export async function assembleHymnPackage(
  archive: archiver.Archiver,
  request: PackageRequest,
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;
  const allSuccessfulHymns: HymnForPdf[] = [];

  for (const hymnReq of request.hymns) {
    const hymnErrors: string[] = [];
    let hymnData: HymnForPdf | null = null;

    // Obtener datos del himno desde Directus
    try {
      hymnData = await fetchHymnForPdf(hymnReq.id);
    } catch (err) {
      console.error(`Error al obtener himno ${hymnReq.id}:`, err);
      hymnErrors.push(`Error al obtener datos del himno: no disponible`);
    }

    if (!hymnData) {
      errorCount++;
      // Sin datos no podemos generar carpeta con nombre correcto, usar ID
      const folderName = `himno-${hymnReq.id}`;
      archive.append(hymnErrors.join('\n'), { name: `${folderName}/ERROR.txt` });
      continue;
    }

    const folderName = hymnFolderName(
      hymnData.hymn_number,
      hymnData.name,
      hymnData.id,
    );

    // Generar PDF individual — siempre a tamano carta completo (one-per-page, simple)
    try {
      const pdfBuffer = await renderHymnPdf({
        hymns: [hymnData],
        layout: 'one-per-page',
        style: request.style,
        printMode: 'simple',
        orientation: request.orientation,
        fontPreset: request.fontPreset,
        includeBibleRef: request.includeBibleRef,
        copiesPerPage: request.copiesPerPage,
        copiesFontSize: request.copiesFontSize,
      });
      archive.append(pdfBuffer, { name: `${folderName}/${folderName}.pdf` });
      allSuccessfulHymns.push(hymnData);
    } catch (err) {
      console.error(`Error al generar PDF para ${hymnReq.id}:`, err);
      hymnErrors.push(`Error al generar PDF: fallo en la generación`);
    }

    // Descargar archivos de audio seleccionados
    for (const audioField of hymnReq.audioFiles) {
      const audioInfo = hymnData.audioFiles[audioField as keyof HymnAudioFiles];
      if (!audioInfo) continue;

      try {
        const response = await fetchAsset(audioInfo.id);

        if (!response.ok) {
          hymnErrors.push(
            `Error al descargar audio ${audioField}: no disponible`,
          );
          continue;
        }

        if (!response.body) {
          hymnErrors.push(`Error al descargar audio ${audioField}: sin contenido`);
          continue;
        }

        const ext = audioInfo.filename_download
          ? audioInfo.filename_download.split('.').pop() || extensionFromMime(audioInfo.type)
          : extensionFromMime(audioInfo.type);
        const label = AUDIO_LABELS[audioField] || audioField;
        const fileName = `${folderName} - ${label}.${ext}`;
        const nodeStream = Readable.fromWeb(response.body as any);
        archive.append(nodeStream, { name: `${folderName}/${fileName}` });
      } catch {
        hymnErrors.push(`Error al descargar audio ${audioField}: fallo de conexión`);
      }
    }

    // Agregar ERROR.txt si hubo errores para este himno
    if (hymnErrors.length > 0) {
      archive.append(hymnErrors.join('\n'), {
        name: `${folderName}/ERROR.txt`,
      });
      // Si al menos se pudo agregar algo (PDF o audio), cuenta como parcial
      if (allSuccessfulHymns.includes(hymnData)) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      successCount++;
    }
  }

  // Generar PDF combinado en la raiz del ZIP
  if (allSuccessfulHymns.length > 0) {
    try {
      const combinedPdf = await renderHymnPdf({
        hymns: allSuccessfulHymns,
        layout: request.layout,
        style: request.style,
        printMode: request.printMode,
        orientation: request.orientation,
        fontPreset: request.fontPreset,
        includeBibleRef: request.includeBibleRef,
        bookletTitle: request.bookletTitle,
        bookletSubtitle: request.bookletSubtitle,
        bookletDate: request.bookletDate,
        bookletBibleRef: request.bookletBibleRef,
        copiesPerPage: request.copiesPerPage,
        copiesFontSize: request.copiesFontSize,
      });
      archive.append(combinedPdf, { name: 'himnos.pdf' });
    } catch (err) {
      console.error('Error al generar PDF combinado:', err);
      // No es critico, se omite el PDF combinado
    }
  }

  // Generar presentación PowerPoint (.pptx) si fue solicitada
  if (request.includePresentation && allSuccessfulHymns.length > 0) {
    try {
      const { generateHymnPptx } = await import(
        '@/app/lib/presentation/generate-hymn-pptx'
      );

      const parsedHymns = allSuccessfulHymns.map((hymn) => ({
        hymn,
        verses: parseHymnHtml(hymn.letter_hymn || ''),
      }));

      const presTitle = request.bookletTitle || 'Himnos';
      const pptxBuffer = await generateHymnPptx(parsedHymns, presTitle);
      archive.append(pptxBuffer, { name: 'presentacion.pptx' });
    } catch (err) {
      console.error('Error al generar presentación:', err);
    }
  }

  // Generar archivos ProPresenter 6 (.pro6) si fue solicitado
  if (request.includeProPresenter && allSuccessfulHymns.length > 0) {
    try {
      const { generateHymnProPresenter } = await import(
        '@/app/lib/presentation/generate-hymn-propresenter'
      );

      const parsedHymns = allSuccessfulHymns.map((hymn) => ({
        hymn,
        verses: parseHymnHtml(hymn.letter_hymn || ''),
      }));

      const proFiles = generateHymnProPresenter(parsedHymns);
      for (const file of proFiles) {
        archive.append(file.content, { name: `propresenter/${file.fileName}` });
      }
    } catch (err) {
      console.error('Error al generar archivos ProPresenter:', err);
    }
  }

  archive.finalize();

  return { successCount, errorCount };
}
