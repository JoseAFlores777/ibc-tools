import React from 'react';
import { Page, View, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  type FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';
import { HymnPageBooklet } from './HymnPageBooklet';

interface BookletPageData {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

export interface BookletSheetProps {
  left: BookletPageData | null;
  right: BookletPageData | null;
  fontPreset: FontPreset;
  includeBibleRef: boolean;
  style: 'decorated' | 'plain';
}

const styles = StyleSheet.create({
  page: {
    // No padding -- HymnPageBooklet handles its own padding
  },
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  slot: {
    width: BOOKLET_PAGE_WIDTH,
    height: BOOKLET_SHEET_HEIGHT,
  },
});

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
          {left ? (
            <HymnPageBooklet
              hymn={left.hymn}
              verses={left.verses}
              fontPreset={fontPreset}
              includeBibleRef={includeBibleRef}
              style={style}
            />
          ) : (
            <View />
          )}
        </View>
        <View style={styles.slot}>
          {right ? (
            <HymnPageBooklet
              hymn={right.hymn}
              verses={right.verses}
              fontPreset={fontPreset}
              includeBibleRef={includeBibleRef}
              style={style}
            />
          ) : (
            <View />
          )}
        </View>
      </View>
    </Page>
  );
}
