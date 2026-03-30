import React from 'react';
import { Page, View, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  type FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';
import { HymnPageBooklet } from './HymnPageBooklet';
import { BookletCover, BookletBackCover } from './BookletCover';

/** Tipos de pagina para booklet */
export type BookletPageEntry =
  | { type: 'hymn'; hymn: HymnForPdf; verses: ParsedVerse[] }
  | { type: 'cover'; title: string; subtitle?: string; date?: string; bibleText?: string; bibleReference?: string }
  | { type: 'backCover' };

export interface BookletSheetProps {
  left: BookletPageEntry | null;
  right: BookletPageEntry | null;
  fontPreset: FontPreset;
  includeBibleRef: boolean;
  style: 'decorated' | 'plain';
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
  },
});

function renderPage(
  entry: BookletPageEntry | null,
  fontPreset: FontPreset,
  includeBibleRef: boolean,
  style: 'decorated' | 'plain',
) {
  if (!entry) return <View />;

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
          style={style}
        />
      );
    case 'backCover':
      return <BookletBackCover fontPreset={fontPreset} style={style} />;
    case 'hymn':
      return (
        <HymnPageBooklet
          hymn={entry.hymn}
          verses={entry.verses}
          fontPreset={fontPreset}
          includeBibleRef={includeBibleRef}
          style={style}
        />
      );
  }
}

export function BookletSheet({
  left,
  right,
  fontPreset,
  includeBibleRef,
  style,
}: BookletSheetProps) {
  return (
    <Page size="LETTER" orientation="landscape" style={styles.page}>
      <View style={styles.container}>
        <View style={styles.slot}>
          {renderPage(left, fontPreset, includeBibleRef, style)}
        </View>
        <View style={styles.slot}>
          {renderPage(right, fontPreset, includeBibleRef, style)}
        </View>
      </View>
    </Page>
  );
}
