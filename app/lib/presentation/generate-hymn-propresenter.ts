import { ProPresenter6Builder } from 'propresenter-parser';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

/**
 * Genera archivos ProPresenter 6 (.pro6) para cada himno.
 *
 * Estructura de slideGroups:
 *   - Introducción: título del himno, cita bíblica y referencia
 *   - ESTROFA I: letras de la primera estrofa
 *   - CORO: letras del coro
 *   - ESTROFA II: letras de la segunda estrofa
 *   - CORO: (repetido)
 *   - ESTROFA III → CORO → etc.
 *
 * Los labels usan "ESTROFA" en vez de números romanos solos
 * para mayor claridad en el navegador de ProPresenter.
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

/** Mapa de números romanos a número ordinal */
const ROMAN_TO_NUM: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
};

interface SlideGroup {
  label: string;
  text: string;
}

/**
 * Construye los slideGroups con Introducción + estrofas/coro intercalados.
 */
function buildSlideGroups(
  hymn: HymnForPdf,
  verses: ParsedVerse[],
): SlideGroup[] {
  // Separar estrofas y coro
  const stanzas: Array<{ marker: string; label: string; lines: string[] }> = [];
  let chorusLines: string[] | null = null;
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      // Guardar sección previa
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
        } else {
          const num = ROMAN_TO_NUM[currentMarker.trim().toUpperCase()];
          const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
          stanzas.push({ marker: currentMarker, label, lines: currentLines });
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

  // Guardar última sección
  if (currentLines.length > 0) {
    if (isCollectingChorus) {
      chorusLines = currentLines;
    } else {
      const num = ROMAN_TO_NUM[currentMarker.trim().toUpperCase()];
      const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
      stanzas.push({ marker: currentMarker, label, lines: currentLines });
    }
  }

  const groups: SlideGroup[] = [];

  // 1. Introducción: título del himno con cita bíblica
  const introLines: string[] = ['HIMNO', `"${hymn.name.toUpperCase()}"`];
  if (hymn.bible_text) introLines.push('', `"${hymn.bible_text}"`);
  if (hymn.bible_reference) introLines.push(hymn.bible_reference);
  groups.push({
    label: 'Introducción',
    text: introLines.join('\n'),
  });

  // 2. Intercalar estrofas y coro
  for (const stanza of stanzas) {
    groups.push({
      label: stanza.label,
      text: `${stanza.marker}\n${stanza.lines.join('\n')}`,
    });

    if (chorusLines) {
      groups.push({
        label: 'CORO',
        text: `CORO\n${chorusLines.join('\n')}`,
      });
    }
  }

  return groups;
}

/** Tamaño de fuente en half-points RTF (26pt * 2 = 52) */
const RTF_FONT_SIZE = 52;

/**
 * Post-procesa bloques RTF base64 en el XML de ProPresenter:
 * 1. Corrige encoding: UTF-8 → Latin-1 (Windows-1252) para acentos españoles
 * 2. Aplica font size correcto (la librería hardcodea fs120)
 * 3. Agrega bold (\b) a Helvetica
 */
function fixRtfBlocks(xml: string): string {
  return xml.replace(/>([A-Za-z0-9+/=]{20,})</g, (match, b64) => {
    const utf8 = Buffer.from(b64, 'base64').toString('utf8');
    if (!utf8.includes('rtf1')) return match;

    let fixed = utf8;
    // Fix font size: replace hardcoded fs120 with desired size
    fixed = fixed.replace(/\\fs\d+/, `\\fs${RTF_FONT_SIZE}`);
    // Add bold after font declaration
    fixed = fixed.replace(/(\\f0\\fs\d+)/, '$1\\b');

    // Re-encode as Latin-1 for Windows-1252 compatibility
    const latin1B64 = Buffer.from(fixed, 'latin1').toString('base64');
    return '>' + latin1B64 + '<';
  });
}

/** Caracteres no permitidos en nombres de archivos */
const UNSAFE_CHARS = /[/\\:*?"<>|]/g;

export interface ProPresenterFile {
  fileName: string;
  content: string;
}

/**
 * Genera un archivo .pro6 por cada himno.
 * Retorna un array de { fileName, content } para agregar al ZIP.
 */
export function generateHymnProPresenter(hymns: ParsedHymn[]): ProPresenterFile[] {
  const files: ProPresenterFile[] = [];

  for (const ph of hymns) {
    const groups = buildSlideGroups(ph.hymn, ph.verses);
    const title = ph.hymn.hymn_number != null
      ? `${ph.hymn.hymn_number} - ${ph.hymn.name}`
      : ph.hymn.name;

    const slideGroups = groups.map((g) => ({
      label: g.label,
      slides: [{
        label: g.label,
        text: g.text,
      }],
    }));

    const xml = ProPresenter6Builder({
      properties: {
        CCLISongTitle: title,
        CCLIAuthor: ph.hymn.authors
          .map((a) => a.authors_id?.name)
          .filter(Boolean)
          .join(', '),
        CCLIArtistCredits: ph.hymn.hymnal?.name || '',
        category: 'Himnos',
        CCLIDisplay: false,
        width: 800,
        height: 600,
      },
      slideTextFormatting: {
        fontName: 'Helvetica',
        textColor: { r: 255, g: 255, b: 255 },
      },
      slideGroups,
    });

    const safeName = title.replace(UNSAFE_CHARS, '_');
    files.push({
      fileName: `${safeName}.pro6`,
      content: fixRtfBlocks(xml),
    });
  }

  return files;
}
