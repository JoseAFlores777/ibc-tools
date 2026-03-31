import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

/**
 * Genera un PDF tipo presentacion (una diapositiva por pagina, landscape)
 * con el mismo estilo que ProPresenter y PPTX:
 *   - Fondo blanco, texto negro, Helvetica Bold
 *   - Introduccion: HIMNO + nombre grande, texto biblico cursiva, referencia derecha bold
 *   - Estrofas/coros: alineados arriba, marcador en la parte superior
 *   - Sin transiciones
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

const ROMAN_TO_NUM: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

interface SlideData {
  type: 'intro' | 'lyrics';
  label: string;
  // Intro fields
  hymnName?: string;
  bibleText?: string;
  bibleReference?: string;
  // Lyrics fields
  lines?: string[];
}

function buildPresentationSlides(hymn: HymnForPdf, verses: ParsedVerse[]): SlideData[] {
  const stanzas: Array<{ label: string; lines: string[] }> = [];
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
          stanzas.push({ label, lines: currentLines });
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
      stanzas.push({ label, lines: currentLines });
    }
  }

  const slides: SlideData[] = [];

  // Introduccion
  slides.push({
    type: 'intro',
    label: 'Introduccion',
    hymnName: hymn.name,
    bibleText: hymn.bible_text || undefined,
    bibleReference: hymn.bible_reference || undefined,
  });

  // Intercalar estrofas y coro
  for (const stanza of stanzas) {
    slides.push({ type: 'lyrics', label: stanza.label, lines: stanza.lines });
    if (chorusLines) {
      slides.push({ type: 'lyrics', label: 'CORO', lines: chorusLines });
    }
  }

  return slides;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 60,
    paddingVertical: 40,
    justifyContent: 'flex-start',
  },
  // Intro slide
  introContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  introHimnoLabel: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  introHymnName: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  introBibleText: {
    fontSize: 20,
    fontFamily: 'Helvetica-Oblique',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 40,
  },
  introBibleRef: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'right',
    paddingRight: 20,
  },
  // Lyrics slide
  lyricsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  lyricsLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  lyricsText: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  // Cover slide
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 20,
    fontFamily: 'Helvetica',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 60,
  },
  coverChurch: {
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: '#666666',
    textAlign: 'center',
  },
});

function IntroPage({ slide }: { slide: SlideData }) {
  return createElement(
    Page,
    { size: 'LETTER', orientation: 'landscape', style: styles.page },
    createElement(
      View,
      { style: styles.introContainer },
      createElement(Text, { style: styles.introHimnoLabel }, 'HIMNO'),
      createElement(
        Text,
        { style: styles.introHymnName },
        `"${slide.hymnName?.toUpperCase()}"`,
      ),
      slide.bibleText &&
        createElement(
          Text,
          { style: styles.introBibleText },
          `"${slide.bibleText}"`,
        ),
      slide.bibleReference &&
        createElement(Text, { style: styles.introBibleRef }, slide.bibleReference),
    ),
  );
}

function LyricsPage({ slide }: { slide: SlideData }) {
  return createElement(
    Page,
    { size: 'LETTER', orientation: 'landscape', style: styles.page },
    createElement(
      View,
      { style: styles.lyricsContainer },
      createElement(Text, { style: styles.lyricsLabel }, slide.label),
      createElement(
        Text,
        { style: styles.lyricsText },
        slide.lines?.join('\n') || '',
      ),
    ),
  );
}

function CoverPage({ title, count }: { title: string; count: number }) {
  return createElement(
    Page,
    { size: 'LETTER', orientation: 'landscape', style: styles.page },
    createElement(
      View,
      { style: styles.coverContainer },
      createElement(Text, { style: styles.coverTitle }, title),
      createElement(
        Text,
        { style: styles.coverSubtitle },
        `${count} himno${count !== 1 ? 's' : ''}`,
      ),
      createElement(
        Text,
        { style: styles.coverChurch },
        'Iglesia Bautista El Calvario',
      ),
    ),
  );
}

function PresentationDocument({
  hymns,
  title,
}: {
  hymns: ParsedHymn[];
  title: string;
}) {
  const pages: React.ReactElement[] = [];

  // Portada general
  pages.push(createElement(CoverPage, { key: 'cover', title, count: hymns.length }));

  // Slides por himno
  for (let i = 0; i < hymns.length; i++) {
    const ph = hymns[i];
    const slides = buildPresentationSlides(ph.hymn, ph.verses);
    for (let j = 0; j < slides.length; j++) {
      const slide = slides[j];
      const key = `hymn-${i}-slide-${j}`;
      if (slide.type === 'intro') {
        pages.push(createElement(IntroPage, { key, slide }));
      } else {
        pages.push(createElement(LyricsPage, { key, slide }));
      }
    }
  }

  return createElement(Document, null, ...pages);
}

export async function generateHymnPresentationPdf(
  hymns: ParsedHymn[],
  title?: string,
): Promise<Buffer> {
  const doc = createElement(PresentationDocument, {
    hymns,
    title: title || 'Himnos',
  });
  return renderToBuffer(doc);
}
