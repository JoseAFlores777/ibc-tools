import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  type FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';
import { HymnPageBooklet } from './HymnPageBooklet';
import { BookletCover, BookletBackCover } from './BookletCover';
import { BookletTOC, type TocEntry } from './BookletTOC';

/** Tipos de pagina para booklet */
export type BookletPageEntry =
  | { type: 'hymn'; hymn: HymnForPdf; verses: ParsedVerse[] }
  | { type: 'cover'; title: string; subtitle?: string; date?: string; bibleText?: string; bibleReference?: string }
  | { type: 'backCover' }
  | { type: 'toc'; entries: TocEntry[] };

export interface BookletSheetProps {
  left: BookletPageEntry | null;
  right: BookletPageEntry | null;
  leftPageNum?: number;
  rightPageNum?: number;
  fontPreset: FontPreset;
  includeBibleRef: boolean;
  style: 'decorated' | 'decorated-eco' | 'plain';
}

const styles = StyleSheet.create({
  page: {},
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  slot: {
    width: BOOKLET_PAGE_WIDTH,
    height: BOOKLET_SHEET_HEIGHT,
    position: 'relative',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
});

function renderPage(
  entry: BookletPageEntry | null,
  fontPreset: FontPreset,
  includeBibleRef: boolean,
  style: 'decorated' | 'decorated-eco' | 'plain',
) {
  if (!entry) return <View />;

  // Para componentes internos, mapear 'decorated-eco' a 'decorated' o 'plain' segun contexto
  const baseStyle = style === 'decorated-eco' ? 'decorated' : style;

  switch (entry.type) {
    case 'cover':
      return (
        <BookletCover
          title={entry.title}
          subtitle={entry.subtitle}
          date={entry.date}
          bibleText={entry.bibleText}
          bibleReference={entry.bibleReference}
          fontPreset={fontPreset}
          style={style === 'decorated-eco' ? 'plain' : baseStyle}
        />
      );
    case 'backCover':
      return <BookletBackCover fontPreset={fontPreset} style={style === 'decorated-eco' ? 'plain' : baseStyle} />;
    case 'toc':
      return <BookletTOC entries={entry.entries} fontPreset={fontPreset} style={style} />;
    case 'hymn':
      return (
        <HymnPageBooklet
          hymn={entry.hymn}
          verses={entry.verses}
          fontPreset={fontPreset}
          includeBibleRef={includeBibleRef}
          style={baseStyle}
        />
      );
  }
}

/** Determina si una pagina debe mostrar numero (no en portada ni contraportada) */
function shouldShowPageNum(entry: BookletPageEntry | null): boolean {
  if (!entry) return false;
  return entry.type !== 'cover' && entry.type !== 'backCover';
}

export function BookletSheet({
  left,
  right,
  leftPageNum,
  rightPageNum,
  fontPreset,
  includeBibleRef,
  style,
}: BookletSheetProps) {
  return (
    <Page size="LETTER" orientation="landscape" style={styles.page}>
      <View style={styles.container}>
        <View style={styles.slot}>
          {renderPage(left, fontPreset, includeBibleRef, style)}
          {leftPageNum != null && shouldShowPageNum(left) && (
            <Text style={styles.pageNumber}>Pág. {leftPageNum}</Text>
          )}
        </View>
        <View style={styles.slot}>
          {renderPage(right, fontPreset, includeBibleRef, style)}
          {rightPageNum != null && shouldShowPageNum(right) && (
            <Text style={styles.pageNumber}>Pág. {rightPageNum}</Text>
          )}
        </View>
      </View>
    </Page>
  );
}
