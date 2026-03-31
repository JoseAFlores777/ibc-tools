/**
 * Client-safe hymn HTML parser and slide group builder.
 * Ported from app/lib/pdf/html-to-pdf.ts (server-side, node-html-parser)
 * to use browser DOMParser instead.
 *
 * Produces SlideData[] for the visualizador from hymn HTML.
 */

import type {
  ParsedVerse,
  ParsedLine,
  HymnForPdf,
} from '@/app/interfaces/Hymn.interface';
import type { SlideData } from './types';

/**
 * Palabras clave que identifican titulos de seccion en himnos.
 * Coinciden con los marcadores usados en html-to-pdf.ts.
 */
const TITLE_KEYWORDS = [
  'CORO',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
];

/**
 * Patron que detecta lineas de encabezado de himno redundantes.
 * Ejemplo: "HIMNO #1 - CON CANTICOS, SENOR (4/4)"
 */
const HYMN_HEADER_PATTERN = /^HIMNO\s*#?\s*\d+\s*[-\u2013\u2014]\s*.+$/i;

/** Roman numeral labels for stanzas */
const ROMAN_NUMERALS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
];

/**
 * Parses hymn HTML (letter_hymn field from Directus) into structured ParsedVerse array.
 * Uses browser DOMParser instead of node-html-parser for client-side compatibility.
 */
export function parseHymnHtmlClient(
  html: string | null
): ParsedVerse[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  const verses: ParsedVerse[] = [];

  for (const paragraph of paragraphs) {
    const textContent = (paragraph.textContent ?? '').trim();

    // Omitir lineas de encabezado de himno redundantes
    if (HYMN_HEADER_PATTERN.test(textContent)) {
      continue;
    }

    // Si el contenido es exactamente un titulo de seccion
    if (TITLE_KEYWORDS.includes(textContent)) {
      verses.push({ type: 'title', lines: [{ text: textContent }] });
      continue;
    }

    // Dividir innerHTML en lineas por <br> tags
    const lineSegments = paragraph.innerHTML.split(/<br\s*\/?>/i);
    const parsedLines: ParsedLine[] = [];

    for (const segment of lineSegments) {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) continue;

      // Parse segment to extract text and formatting
      const segDoc = parser.parseFromString(
        `<span>${trimmedSegment}</span>`,
        'text/html'
      );
      const text = (segDoc.body.textContent ?? '').trim();
      if (!text) continue;

      const line: ParsedLine = { text };

      // Detectar formato bold/italic en el primer elemento hijo
      const wrapper = segDoc.body.firstElementChild;
      if (wrapper) {
        const firstChild = wrapper.firstElementChild;
        if (firstChild) {
          const tag = firstChild.tagName.toUpperCase();
          if (tag === 'STRONG' || tag === 'B') {
            line.bold = true;
          } else if (tag === 'EM' || tag === 'I') {
            line.italic = true;
          }
        }
      }

      parsedLines.push(line);
    }

    if (parsedLines.length > 0) {
      verses.push({ type: 'verse', lines: parsedLines });
    }
  }

  return verses;
}

/**
 * Builds SlideData[] from parsed verses with intercalated chorus pattern.
 * Pattern: Intro -> Estrofa I -> Coro -> Estrofa II -> Coro -> ...
 * If no chorus exists: Intro -> Estrofa I -> Estrofa II -> ...
 *
 * Ported from generate-hymn-propresenter.ts buildSlideGroups logic.
 */
export function buildSlideGroups(
  verses: ParsedVerse[],
  hymn: HymnForPdf
): SlideData[] {
  const slides: SlideData[] = [];

  // Intro slide siempre presente
  const introLines: string[] = [hymn.name];
  if (hymn.bible_text) introLines.push(hymn.bible_text);
  if (hymn.bible_reference) introLines.push(hymn.bible_reference);

  slides.push({
    label: 'Introduccion',
    text: introLines.join('\n'),
    verseLabel: 'Introduccion',
  });

  // Separar versos en estrofas y coro
  const stanzas: { label: string; text: string }[] = [];
  let chorusText: string | null = null;
  let stanzaCount = 0;
  let currentTitle: string | null = null;

  for (const verse of verses) {
    if (verse.type === 'title') {
      currentTitle = verse.lines[0]?.text ?? '';
      continue;
    }

    // Es un bloque de contenido (verse type)
    const lineTexts = verse.lines.map((l) => l.text).join('\n');

    if (currentTitle === 'CORO') {
      // Guardar texto del coro (solo el primero, se reutiliza)
      if (chorusText === null) {
        chorusText = lineTexts;
      }
    } else {
      // Es una estrofa numerada
      stanzaCount++;
      const romanLabel =
        ROMAN_NUMERALS[stanzaCount - 1] ?? String(stanzaCount);
      stanzas.push({
        label: `ESTROFA ${romanLabel}`,
        text: lineTexts,
      });
    }

    currentTitle = null;
  }

  // Construir secuencia con intercalacion de coro
  for (const stanza of stanzas) {
    slides.push({
      label: stanza.label,
      text: stanza.text,
      verseLabel: stanza.label,
    });

    // Intercalar coro despues de cada estrofa (si existe)
    if (chorusText !== null) {
      slides.push({
        label: 'CORO',
        text: chorusText,
        verseLabel: 'CORO',
      });
    }
  }

  return slides;
}
