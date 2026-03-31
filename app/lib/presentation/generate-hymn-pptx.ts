import PptxGenJS from 'pptxgenjs';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

/**
 * Genera una presentación PowerPoint (.pptx) con diapositivas de himnos.
 *
 * Estructura:
 *   - Portada general
 *   - Por cada himno:
 *     - Portada del himno (número, título, himnario)
 *     - Estrofa I → Coro → Estrofa II → Coro → ... (intercalado)
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

interface SlideContent {
  marker: string;
  lines: string[];
}

/** Colores del tema institucional */
const THEME = {
  bg: '393572',
  titleColor: 'FFFFFF',
  accentColor: 'EABA1C',
  subtitleColor: 'C2C2C4',
};

/**
 * Separa los versos parseados en slides, intercalando el coro después de cada estrofa.
 */
function buildSlides(verses: ParsedVerse[]): SlideContent[] {
  const sections: SlideContent[] = [];
  let chorusLines: string[] | null = null;
  let chorusMarker = 'CORO';
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
          chorusMarker = currentMarker;
        } else {
          sections.push({ marker: currentMarker, lines: currentLines });
        }
      }
      currentMarker = verse.lines.map((l) => l.text).join(' ');
      currentLines = [];
      const upper = currentMarker.trim().toUpperCase();
      isCollectingChorus = upper === 'CORO' || upper === 'CHORUS';
    } else {
      currentLines.push(...verse.lines.map((l) => l.text));
    }
  }

  if (currentLines.length > 0) {
    if (isCollectingChorus) {
      chorusLines = currentLines;
      chorusMarker = currentMarker;
    } else {
      sections.push({ marker: currentMarker, lines: currentLines });
    }
  }

  // Intercalar coro después de cada estrofa
  const slides: SlideContent[] = [];
  for (const section of sections) {
    slides.push(section);
    if (chorusLines) {
      slides.push({ marker: chorusMarker, lines: chorusLines });
    }
  }

  return slides;
}

export async function generateHymnPptx(
  hymns: ParsedHymn[],
  title?: string,
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 pulgadas (16:9)
  pptx.author = 'Iglesia Bautista El Calvario';
  pptx.title = title || 'Presentación de Himnos';

  // Portada general
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: THEME.bg };
  coverSlide.addText(title || 'Himnos', {
    x: 0.5,
    y: 2.0,
    w: 12.33,
    h: 2.0,
    fontSize: 54,
    fontFace: 'Georgia',
    color: THEME.titleColor,
    align: 'center',
    bold: true,
  });
  coverSlide.addText(`${hymns.length} himno${hymns.length !== 1 ? 's' : ''}`, {
    x: 0.5,
    y: 4.2,
    w: 12.33,
    h: 0.8,
    fontSize: 22,
    fontFace: 'Georgia',
    color: THEME.accentColor,
    align: 'center',
  });
  coverSlide.addText('Iglesia Bautista El Calvario', {
    x: 0.5,
    y: 6.2,
    w: 12.33,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Georgia',
    color: THEME.subtitleColor,
    align: 'center',
  });

  for (const ph of hymns) {
    const slides = buildSlides(ph.verses);

    // Portada del himno
    const hymnCover = pptx.addSlide();
    hymnCover.background = { color: THEME.bg };

    if (ph.hymn.hymn_number != null) {
      hymnCover.addText(`Himno # ${ph.hymn.hymn_number}`, {
        x: 0.5,
        y: 1.8,
        w: 12.33,
        h: 0.8,
        fontSize: 26,
        fontFace: 'Georgia',
        color: THEME.accentColor,
        align: 'center',
      });
    }

    hymnCover.addText(ph.hymn.name.toUpperCase(), {
      x: 0.5,
      y: 2.8,
      w: 12.33,
      h: 1.5,
      fontSize: 44,
      fontFace: 'Georgia',
      color: THEME.titleColor,
      align: 'center',
      bold: true,
    });

    if (ph.hymn.hymnal?.name) {
      hymnCover.addText(ph.hymn.hymnal.name, {
        x: 0.5,
        y: 4.5,
        w: 12.33,
        h: 0.6,
        fontSize: 16,
        fontFace: 'Georgia',
        color: THEME.subtitleColor,
        align: 'center',
      });
    }

    // Slides de estrofas/coros
    for (const slide of slides) {
      const s = pptx.addSlide();
      s.background = { color: THEME.bg };

      // Marcador (I, II, CORO, etc.)
      s.addText(slide.marker, {
        x: 0.5,
        y: 0.4,
        w: 12.33,
        h: 0.6,
        fontSize: 18,
        fontFace: 'Georgia',
        color: THEME.accentColor,
        align: 'center',
        bold: true,
      });

      // Texto de la estrofa/coro
      const lyricsText = slide.lines.join('\n');
      s.addText(lyricsText, {
        x: 0.8,
        y: 1.2,
        w: 11.73,
        h: 5.5,
        fontSize: 32,
        fontFace: 'Georgia',
        color: THEME.titleColor,
        align: 'center',
        valign: 'middle',
        lineSpacingMultiple: 1.4,
      });
    }
  }

  // Generar como Buffer
  const arrayBuffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
