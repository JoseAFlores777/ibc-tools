import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import {
  MARGIN_1UP,
  FONT_PLAIN,
  FONT_PRESETS,
  COLORS,
  type FontPreset,
  type Orientation,
} from '@/app/components/pdf-components/shared/pdf-tokens';

export interface HymnPagePlainProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
  orientation?: Orientation;
  fontPreset?: FontPreset;
  includeBibleRef?: boolean;
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

export const HymnPagePlain: React.FC<HymnPagePlainProps> = ({
  hymn,
  verses,
  orientation = 'portrait',
  fontPreset = 'clasica',
}) => {
  const preset = FONT_PRESETS[fontPreset];
  // Map generic font scale to plain-specific roles
  const dynamicStyles = {
    hymnNumber: { ...styles.hymnNumber, fontSize: preset.scale.label },
    hymnTitle: { ...styles.hymnTitle, fontSize: preset.scale.display },
    hymnalName: { ...styles.hymnalName, fontSize: preset.scale.label },
    verseMarker: { ...styles.verseMarker, fontSize: preset.scale.body },
    lyricLine: { ...styles.lyricLine, fontSize: preset.scale.body },
    page: { ...styles.page, fontFamily: preset.family },
  };

  return (
    <Page size="LETTER" orientation={orientation} style={dynamicStyles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={dynamicStyles.hymnNumber}>
          {hymn.hymn_number != null ? `Himno # ${hymn.hymn_number}` : 'Himno'}
        </Text>
        <Text style={dynamicStyles.hymnTitle}>{hymn.name}</Text>
        {hymn.hymnal && <Text style={dynamicStyles.hymnalName}>{hymn.hymnal.name}</Text>}
      </View>

      {/* Body: versos */}
      <View style={styles.body}>
        {verses.map((verse, idx) => (
          <View key={idx} style={styles.verseBlock}>
            {verse.type === 'title' ? (
              verse.lines.map((line, li) => (
                <Text key={li} style={dynamicStyles.verseMarker}>
                  {line.text}
                </Text>
              ))
            ) : (
              verse.lines.map((line, li) => (
                <Text
                  key={li}
                  style={{
                    ...dynamicStyles.lyricLine,
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
