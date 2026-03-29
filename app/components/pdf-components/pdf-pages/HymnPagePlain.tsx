import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import { MARGIN_1UP, FONT_PLAIN, COLORS } from '@/app/components/pdf-components/shared/pdf-tokens';

export interface HymnPagePlainProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

const styles = StyleSheet.create({
  page: {
    padding: MARGIN_1UP,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  hymnNumber: {
    fontSize: FONT_PLAIN.hymnNumber,
    color: COLORS.plainSubtitle,
  },
  hymnTitle: {
    fontSize: FONT_PLAIN.title,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  hymnalName: {
    fontSize: FONT_PLAIN.hymnalName,
    color: COLORS.plainSubtitle,
    marginTop: 4,
  },
  body: {
    flex: 1,
  },
  verseBlock: {
    marginBottom: 12,
  },
  verseMarker: {
    fontSize: FONT_PLAIN.verseMarker,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#000000',
  },
  lyricLine: {
    fontSize: FONT_PLAIN.lyricLine,
    textAlign: 'left',
    lineHeight: 1.4,
    color: '#000000',
  },
});

export const HymnPagePlain: React.FC<HymnPagePlainProps> = ({ hymn, verses }) => {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hymnNumber}>
          {hymn.hymn_number != null ? `Himno # ${hymn.hymn_number}` : 'Himno'}
        </Text>
        <Text style={styles.hymnTitle}>{hymn.name}</Text>
        {hymn.hymnal && <Text style={styles.hymnalName}>{hymn.hymnal.name}</Text>}
      </View>

      {/* Body: versos */}
      <View style={styles.body}>
        {verses.map((verse, idx) => (
          <View key={idx} style={styles.verseBlock}>
            {verse.type === 'title' ? (
              verse.lines.map((line, li) => (
                <Text key={li} style={styles.verseMarker}>
                  {line.text}
                </Text>
              ))
            ) : (
              verse.lines.map((line, li) => (
                <Text
                  key={li}
                  style={{
                    ...styles.lyricLine,
                    ...(line.bold ? { fontWeight: 'bold' } : {}),
                    ...(line.italic ? { fontStyle: 'italic' } : {}),
                  }}
                >
                  {line.text}
                </Text>
              ))
            )}
          </View>
        ))}
      </View>

      {/* NO footer per D-01 */}
    </Page>
  );
};
