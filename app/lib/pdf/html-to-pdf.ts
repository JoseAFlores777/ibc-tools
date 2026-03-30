import { parse } from 'node-html-parser';
import type { ParsedVerse, ParsedLine } from '@/app/interfaces/Hymn.interface';

/**
 * Palabras clave que identifican titulos de seccion en himnos.
 * Coinciden con los marcadores usados en HymnPagePdf.tsx linea 204.
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
 * Patron que detecta lineas de encabezado de himno redundantes en el HTML de Directus.
 * Ejemplo: "HIMNO #1 - CON CÁNTICOS, SEÑOR (4/4)"
 * Estas lineas ya se muestran en el header del PDF y deben omitirse del cuerpo.
 */
const HYMN_HEADER_PATTERN = /^HIMNO\s*#?\s*\d+\s*[-–—]\s*.+$/i;

/**
 * Convierte HTML del campo letter_hymn de Directus en un arreglo estructurado
 * de versos con informacion de formato (negrita/cursiva).
 *
 * Reemplaza la funcion extractParagraphs() de HymnPagePdf.tsx que depende
 * de browser DOM (createElement) con una alternativa server-safe
 * usando node-html-parser.
 */
export function parseHymnHtml(html: string): ParsedVerse[] {
  if (!html || !html.trim()) return [];

  const root = parse(html);
  const paragraphs = root.querySelectorAll('p');
  const verses: ParsedVerse[] = [];

  for (const paragraph of paragraphs) {
    const textContent = paragraph.textContent.trim();

    // Omitir lineas de encabezado de himno redundantes (ej: "HIMNO #1 - CON CÁNTICOS, SEÑOR (4/4)")
    if (HYMN_HEADER_PATTERN.test(textContent)) {
      continue;
    }

    // Si el contenido del parrafo es exactamente un titulo de seccion
    if (TITLE_KEYWORDS.includes(textContent)) {
      verses.push({ type: 'title', lines: [{ text: textContent }] });
      continue;
    }

    // Dividir el innerHTML en lineas por <br> tags
    const lineSegments = paragraph.innerHTML.split(/<br\s*\/?>/i);
    const parsedLines: ParsedLine[] = [];

    for (const segment of lineSegments) {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) continue;

      const segmentRoot = parse(trimmedSegment);
      const text = segmentRoot.textContent.trim();
      if (!text) continue;

      const line: ParsedLine = { text };

      // Detectar formato bold: <strong> o <b> como elemento raiz
      const firstChild = segmentRoot.firstChild;
      if (firstChild && 'tagName' in firstChild) {
        const tag = (firstChild as ReturnType<typeof parse>).tagName?.toUpperCase();
        if (tag === 'STRONG' || tag === 'B') {
          line.bold = true;
        } else if (tag === 'EM' || tag === 'I') {
          line.italic = true;
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
 * Extrae texto plano del HTML de letter_hymn, sin formato.
 * Cada linea (separada por <p> o <br>) se convierte en un elemento del arreglo.
 * Decodifica entidades HTML automaticamente via node-html-parser.
 */
export function extractPlainText(html: string): string[] {
  if (!html || !html.trim()) return [];

  const root = parse(html);
  const paragraphs = root.querySelectorAll('p');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const lineSegments = paragraph.innerHTML.split(/<br\s*\/?>/i);

    for (const segment of lineSegments) {
      const text = parse(segment).textContent.trim();
      if (text) {
        lines.push(text);
      }
    }
  }

  return lines;
}
