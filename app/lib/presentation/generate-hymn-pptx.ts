import PptxGenJS from 'pptxgenjs';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

/**
 * Genera una presentacion PowerPoint (.pptx) con diapositivas de himnos.
 *
 * Estilo limpio (fondo blanco, texto negro, Helvetica Bold):
 *   - Portada general
 *   - Por cada himno:
 *     - Introduccion: HIMNO + nombre (grande bold), texto biblico (cursiva),
 *       referencia biblica (derecha bold)
 *     - Estrofa I -> Coro -> Estrofa II -> Coro -> ... (intercalado)
 *   - Texto alineado verticalmente arriba en estrofas/coros
 *   - Sin transiciones
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

interface SlideContent {
  label: string;
  marker: string;
  lines: string[];
}

/** Mapa de numeros romanos a numero ordinal */
const ROMAN_TO_NUM: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

/** Colores: fondo blanco, texto negro */
const TEXT_COLOR = '000000';
const SUBTITLE_COLOR = '666666';

/**
 * Separa los versos parseados en slides, intercalando el coro despues de cada estrofa.
 * Usa labels tipo "ESTROFA I", "CORO" para consistencia con ProPresenter.
 */
function buildSlides(verses: ParsedVerse[]): SlideContent[] {
  const stanzas: SlideContent[] = [];
  let chorusLines: string[] | null = null;
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
        } else {
          const upper = currentMarker.trim().toUpperCase();
          const num = ROMAN_TO_NUM[upper];
          const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
          stanzas.push({ label, marker: currentMarker, lines: currentLines });
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
    } else {
      const upper = currentMarker.trim().toUpperCase();
      const num = ROMAN_TO_NUM[upper];
      const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
      stanzas.push({ label, marker: currentMarker, lines: currentLines });
    }
  }

  // Intercalar coro despues de cada estrofa
  const slides: SlideContent[] = [];
  for (const stanza of stanzas) {
    slides.push(stanza);
    if (chorusLines) {
      slides.push({ label: 'CORO', marker: 'CORO', lines: chorusLines });
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
  pptx.title = title || 'Presentacion de Himnos';

  // Portada general
  const coverSlide = pptx.addSlide();
  coverSlide.addText(title || 'Himnos', {
    x: 0.5,
    y: 1.5,
    w: 12.33,
    h: 2.0,
    fontSize: 54,
    fontFace: 'Helvetica',
    color: TEXT_COLOR,
    align: 'center',
    bold: true,
  });
  coverSlide.addText(`${hymns.length} himno${hymns.length !== 1 ? 's' : ''}`, {
    x: 0.5,
    y: 3.8,
    w: 12.33,
    h: 0.8,
    fontSize: 22,
    fontFace: 'Helvetica',
    color: SUBTITLE_COLOR,
    align: 'center',
  });
  coverSlide.addText('Iglesia Bautista El Calvario', {
    x: 0.5,
    y: 6.2,
    w: 12.33,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Helvetica',
    color: SUBTITLE_COLOR,
    align: 'center',
  });

  for (const ph of hymns) {
    const slides = buildSlides(ph.verses);

    // Diapositiva de introduccion (estilo ProPresenter)
    const introSlide = pptx.addSlide();

    // "HIMNO" + nombre: centrado, bold, grande
    introSlide.addText('HIMNO', {
      x: 0.5,
      y: 1.0,
      w: 12.33,
      h: 0.8,
      fontSize: 36,
      fontFace: 'Helvetica',
      color: TEXT_COLOR,
      align: 'center',
      bold: true,
    });
    introSlide.addText(`"${ph.hymn.name.toUpperCase()}"`, {
      x: 0.5,
      y: 1.8,
      w: 12.33,
      h: 1.2,
      fontSize: 36,
      fontFace: 'Helvetica',
      color: TEXT_COLOR,
      align: 'center',
      bold: true,
    });

    // Texto biblico: centrado, cursiva, mas pequeno
    if (ph.hymn.bible_text) {
      introSlide.addText(`"${ph.hymn.bible_text}"`, {
        x: 0.8,
        y: 3.8,
        w: 11.73,
        h: 2.0,
        fontSize: 22,
        fontFace: 'Helvetica',
        color: SUBTITLE_COLOR,
        align: 'center',
        italic: true,
      });
    }

    // Referencia biblica: derecha, bold
    if (ph.hymn.bible_reference) {
      introSlide.addText(ph.hymn.bible_reference, {
        x: 0.8,
        y: 6.0,
        w: 11.73,
        h: 0.6,
        fontSize: 22,
        fontFace: 'Helvetica',
        color: TEXT_COLOR,
        align: 'right',
        bold: true,
      });
    }

    // Slides de estrofas/coros
    for (const slide of slides) {
      const s = pptx.addSlide();

      // Marcador (ESTROFA I, CORO, etc.) arriba
      s.addText(slide.label, {
        x: 0.5,
        y: 0.3,
        w: 12.33,
        h: 0.6,
        fontSize: 18,
        fontFace: 'Helvetica',
        color: SUBTITLE_COLOR,
        align: 'center',
        bold: true,
      });

      // Texto de la estrofa/coro, alineado arriba
      const lyricsText = slide.lines.join('\n');
      s.addText(lyricsText, {
        x: 0.8,
        y: 1.1,
        w: 11.73,
        h: 5.8,
        fontSize: 32,
        fontFace: 'Helvetica',
        color: TEXT_COLOR,
        align: 'center',
        valign: 'top',
        bold: true,
        lineSpacingMultiple: 1.4,
      });
    }
  }

  // Generar como Buffer
  const arrayBuffer = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
