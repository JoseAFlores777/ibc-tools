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
 *
 * Formato:
 *   - Sin transiciones (corte directo)
 *   - Alineación vertical: arriba (top) en todas las diapositivas
 *   - Introducción: título grande bold, texto bíblico pequeño cursiva,
 *     referencia bíblica derecha bold
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

interface IntroData {
  hymnName: string;
  bibleText?: string;
  bibleReference?: string;
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
/** Tamaño título introducción: 36pt */
const INTRO_TITLE_FS = 72;
/** Tamaño cuerpo introducción: 22pt */
const INTRO_BODY_FS = 44;

/** Escapa caracteres especiales RTF y codifica no-ASCII como escapes Latin-1 */
function escapeRtf(text: string): string {
  let result = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x5c) result += '\\\\';
    else if (code === 0x7b) result += '\\{';
    else if (code === 0x7d) result += '\\}';
    else if (code >= 0x20 && code <= 0x7e) result += ch;
    else if (code <= 0xff) result += `\\'${code.toString(16).padStart(2, '0')}`;
    else result += `\\u${code}?`;
  }
  return result;
}

/**
 * Construye RTF personalizado para la diapositiva de introducción:
 * - HIMNO + nombre: centrado, bold, grande
 * - Texto bíblico: centrado, cursiva, más pequeño
 * - Referencia bíblica: alineada derecha, bold
 */
function buildIntroRtf(intro: IntroData): string {
  const header =
    '{\\rtf1\\ansi\\ansicpg1252\\cocoartf1038\\cocoasubrtf320' +
    '{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}' +
    '{\\colortbl;\\red255\\green255\\blue255;}';

  // Título: centrado, bold, grande
  let body =
    `\\pard\\qc\\pardirnatural\\f0\\b\\fs${INTRO_TITLE_FS} \\cf1 HIMNO\\par\n` +
    escapeRtf(`"${intro.hymnName.toUpperCase()}"`);

  if (intro.bibleText) {
    // Línea vacía + texto bíblico: centrado, cursiva, más pequeño
    body +=
      `\\par\n\\pard\\qc\\pardirnatural\\b0\\i\\fs${INTRO_BODY_FS} \\cf1 \\par\n` +
      escapeRtf(`"${intro.bibleText}"`);
  }

  if (intro.bibleReference) {
    // Referencia: alineada a la derecha, bold, sin cursiva
    body +=
      `\\par\n\\pard\\qr\\pardirnatural\\i0\\b\\fs${INTRO_BODY_FS} \\cf1 ` +
      escapeRtf(intro.bibleReference);
  }

  return header + body + '}';
}

/**
 * Post-procesa el XML de ProPresenter:
 * 1. Quita transiciones (corte directo)
 * 2. Aplica RTF personalizado a la intro
 * 3. Corrige encoding y formato en estrofas/coro
 */
function postProcessXml(xml: string, introData: IntroData): string {
  // Quitar transiciones: forzar tipo 0 (Cut/None) y duración 0
  let result = xml
    .replace(/transitionType="-1"/, 'transitionType="0"')
    .replace(/transitionDuration="1"/, 'transitionDuration="0"');

  // Procesar bloques RTF
  let isFirstRtf = true;
  result = result.replace(/>([A-Za-z0-9+/=]{20,})</g, (match, b64) => {
    const utf8 = Buffer.from(b64, 'base64').toString('utf8');
    if (!utf8.includes('rtf1')) return match;

    if (isFirstRtf) {
      // Diapositiva de introducción: RTF personalizado
      isFirstRtf = false;
      const introRtf = buildIntroRtf(introData);
      const latin1B64 = Buffer.from(introRtf, 'latin1').toString('base64');
      return '>' + latin1B64 + '<';
    }

    // Estrofas y coro: formato uniforme
    let fixed = utf8;
    fixed = fixed.replace(/\\fs\d+/, `\\fs${RTF_FONT_SIZE}`);
    fixed = fixed.replace(/(\\f0\\fs\d+)/, '$1\\b');
    const latin1B64 = Buffer.from(fixed, 'latin1').toString('base64');
    return '>' + latin1B64 + '<';
  });

  return result;
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

    const introData: IntroData = {
      hymnName: ph.hymn.name,
      bibleText: ph.hymn.bible_text || undefined,
      bibleReference: ph.hymn.bible_reference || undefined,
    };

    const safeName = title.replace(UNSAFE_CHARS, '_');
    files.push({
      fileName: `${safeName}.pro6`,
      content: postProcessXml(xml, introData),
    });
  }

  return files;
}
