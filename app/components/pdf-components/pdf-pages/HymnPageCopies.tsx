import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  LETTER_WIDTH,
  LETTER_HEIGHT,
  COLORS,
} from '@/app/components/pdf-components/shared/pdf-tokens';

export type PdfStyle = 'decorated' | 'decorated-eco' | 'plain';

export interface HymnPageCopiesProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
  copies: 2 | 4;
  fontSize: number;
  style: PdfStyle;
}

/** Margin inside each copy cell */
const CELL_PADDING = 12;
/** Cut line thickness */
const CUT_LINE_WIDTH = 0.5;
/** Cut line color */
const CUT_LINE_COLOR = '#999999';

/** Half-width for 2-up layout */
const HALF_WIDTH = LETTER_WIDTH / 2;
/** Half-height for 4-up layout */
const HALF_HEIGHT = LETTER_HEIGHT / 2;

/**
 * Renders the content of a single copy cell: title line + verses.
 * Compact layout without header/footer to maximize space.
 */
function CopyCell({
  hymn,
  verses,
  fontSize,
  style,
  cellWidth,
  cellHeight,
}: {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
  fontSize: number;
  style: PdfStyle;
  cellWidth: number;
  cellHeight: number;
}) {
  const isDecorated = style === 'decorated';
  const titleColor = isDecorated ? COLORS.goldHighlight : '#000000';
  const bodyColor = isDecorated ? COLORS.bodyText : '#000000';
  const markerColor = isDecorated ? COLORS.goldAccent : '#000000';
  const bgColor = isDecorated ? COLORS.pageBg : '#ffffff';
  const fontFamily = isDecorated ? 'Adamina' : 'Helvetica';
  const titleFontSize = fontSize + 2;

  return (
    <View
      style={{
        width: cellWidth,
        height: cellHeight,
        padding: CELL_PADDING,
        backgroundColor: bgColor,
        fontFamily,
      }}
    >
      {/* Compact title: number + name on one line */}
      <Text
        style={{
          fontSize: titleFontSize,
          color: titleColor,
          textAlign: 'center',
          marginBottom: 6,
          fontWeight: 'bold',
        }}
      >
        {hymn.hymn_number != null ? `${hymn.hymn_number}. ` : ''}
        {hymn.name}
      </Text>

      {/* Verses */}
      {verses.map((verse, idx) => (
        <View key={idx} style={{ marginBottom: 4 }}>
          {verse.type === 'title'
            ? verse.lines.map((line, li) => (
                <Text
                  key={li}
                  style={{
                    fontSize,
                    color: markerColor,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginBottom: 2,
                  }}
                >
                  {line.text}
                </Text>
              ))
            : verse.lines.map((line, li) => (
                <Text
                  key={li}
                  style={{
                    fontSize,
                    color: bodyColor,
                    textAlign: 'center',
                    lineHeight: 1.35,
                    ...(line.bold ? { fontWeight: 'bold' as const } : {}),
                    ...(line.italic ? { fontStyle: 'italic' as const } : {}),
                  }}
                >
                  {line.text}
                </Text>
              ))}
        </View>
      ))}
    </View>
  );
}

/**
 * HymnPageCopies: renders 2 or 4 copies of the same hymn on one LETTER page.
 *
 * 2 copies: 2 columns side by side, separated by a thin vertical cut line.
 * 4 copies: 2x2 grid, with horizontal and vertical cut lines.
 */
export const HymnPageCopies: React.FC<HymnPageCopiesProps> = ({
  hymn,
  verses,
  copies,
  fontSize,
  style,
}) => {
  const isDecorated = style === 'decorated';
  const pageBg = isDecorated ? COLORS.pageBg : '#ffffff';

  if (copies === 2) {
    // 2 copies: side by side
    const cellWidth = HALF_WIDTH - CUT_LINE_WIDTH / 2;
    const cellHeight = LETTER_HEIGHT;

    return (
      <Page size="LETTER" style={{ flexDirection: 'row', backgroundColor: pageBg }}>
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
        {/* Vertical cut line */}
        <View
          style={{
            width: CUT_LINE_WIDTH,
            height: '100%',
            backgroundColor: CUT_LINE_COLOR,
          }}
        />
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
      </Page>
    );
  }

  // 4 copies: 2x2 grid
  const cellWidth = HALF_WIDTH - CUT_LINE_WIDTH / 2;
  const cellHeight = HALF_HEIGHT - CUT_LINE_WIDTH / 2;

  return (
    <Page size="LETTER" style={{ flexDirection: 'column', backgroundColor: pageBg }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', height: cellHeight }}>
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
        <View
          style={{
            width: CUT_LINE_WIDTH,
            height: '100%',
            backgroundColor: CUT_LINE_COLOR,
          }}
        />
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
      </View>

      {/* Horizontal cut line */}
      <View
        style={{
          width: '100%',
          height: CUT_LINE_WIDTH,
          backgroundColor: CUT_LINE_COLOR,
        }}
      />

      {/* Bottom row */}
      <View style={{ flexDirection: 'row', height: cellHeight }}>
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
        <View
          style={{
            width: CUT_LINE_WIDTH,
            height: '100%',
            backgroundColor: CUT_LINE_COLOR,
          }}
        />
        <CopyCell
          hymn={hymn}
          verses={verses}
          fontSize={fontSize}
          style={style}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
        />
      </View>
    </Page>
  );
};
