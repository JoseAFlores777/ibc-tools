import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  BOOKLET_MARGIN,
  FONT_PRESETS_BOOKLET,
  COLORS,
  type FontPreset,
  type FontPresetConfig,
} from '@/app/components/pdf-components/shared/pdf-tokens';

export interface HymnPageBookletProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
  fontPreset: FontPreset;
  includeBibleRef: boolean;
  style: 'decorated' | 'plain';
}

/** Genera estilos dinamicos basados en el font preset */
function createStyles(preset: FontPresetConfig, styleVariant: 'decorated' | 'plain') {
  const isDecorated = styleVariant === 'decorated';

  return StyleSheet.create({
    container: {
      width: BOOKLET_PAGE_WIDTH,
      height: BOOKLET_SHEET_HEIGHT,
      padding: BOOKLET_MARGIN,
      flexDirection: 'column',
      fontFamily: preset.family,
      backgroundColor: isDecorated ? COLORS.pageBg : '#ffffff',
    },
    // Decorated header: compact colored bar
    headerDecorated: {
      backgroundColor: COLORS.headerBg,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    headerDecoratedNumber: {
      fontSize: preset.scale.heading,
      color: COLORS.goldHighlight,
      // Branding text always uses Adamina for decorated style
      fontFamily: 'Adamina',
    },
    headerDecoratedTitle: {
      fontSize: preset.scale.display,
      color: COLORS.headerText,
      textTransform: 'uppercase',
      fontFamily: 'Adamina',
    },
    // Plain header: simple text
    headerPlain: {
      marginBottom: 10,
      textAlign: 'center',
    },
    headerPlainNumber: {
      fontSize: preset.scale.label,
      color: COLORS.plainSubtitle,
    },
    headerPlainTitle: {
      fontSize: preset.scale.display,
      fontWeight: 'bold',
      color: '#000000',
      marginTop: 2,
    },
    // Bible reference
    bibleSection: {
      marginBottom: 6,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    bibleText: {
      fontSize: preset.scale.label,
      textAlign: 'center',
      fontStyle: 'italic',
      color: isDecorated ? COLORS.lightText : COLORS.plainSubtitle,
      lineHeight: 1.3,
    },
    bibleReference: {
      fontSize: preset.scale.label - 1,
      marginTop: 3,
      textAlign: 'center',
      color: isDecorated ? COLORS.headerText : '#000000',
    },
    // Verses
    versesArea: {
      flex: 1,
    },
    verseBlock: {
      marginBottom: 6,
    },
    verseMarker: {
      fontSize: preset.scale.body,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 2,
      color: isDecorated ? COLORS.goldAccent : '#000000',
    },
    lyricLine: {
      fontSize: preset.scale.body,
      textAlign: isDecorated ? 'center' : 'left',
      lineHeight: 1.3,
      color: isDecorated ? COLORS.bodyText : '#000000',
    },
    // Footer hymnal name
    hymnalFooter: {
      marginTop: 4,
      textAlign: 'center',
    },
    hymnalName: {
      fontSize: preset.scale.label - 1,
      color: isDecorated ? COLORS.lightText : COLORS.plainSubtitle,
    },
  });
}

export function HymnPageBooklet({
  hymn,
  verses,
  fontPreset,
  includeBibleRef,
  style,
}: HymnPageBookletProps) {
  const preset = FONT_PRESETS_BOOKLET[fontPreset];
  const s = createStyles(preset, style);

  return (
    <View style={s.container}>
      {/* Header */}
      {style === 'decorated' ? (
        <View style={s.headerDecorated}>
          <Text style={s.headerDecoratedNumber}>
            {hymn.hymn_number != null ? `# ${hymn.hymn_number}` : ''}
          </Text>
          <Text style={s.headerDecoratedTitle}>{hymn.name}</Text>
        </View>
      ) : (
        <View style={s.headerPlain}>
          <Text style={s.headerPlainNumber}>
            {hymn.hymn_number != null ? `Himno # ${hymn.hymn_number}` : 'Himno'}
          </Text>
          <Text style={s.headerPlainTitle}>{hymn.name}</Text>
        </View>
      )}

      {/* Bible reference (conditional) */}
      {includeBibleRef && (hymn.bible_text || hymn.bible_reference) && (
        <View style={s.bibleSection}>
          {hymn.bible_text && <Text style={s.bibleText}>{hymn.bible_text}</Text>}
          {hymn.bible_reference && (
            <Text style={s.bibleReference}>{hymn.bible_reference}</Text>
          )}
        </View>
      )}

      {/* Verses */}
      <View style={s.versesArea}>
        {verses.map((verse, idx) => (
          <View key={idx} style={s.verseBlock}>
            {verse.type === 'title' ? (
              verse.lines.map((line, li) => (
                <Text key={li} style={s.verseMarker}>
                  {line.text}
                </Text>
              ))
            ) : (
              verse.lines.map((line, li) => (
                <Text
                  key={li}
                  style={{
                    ...s.lyricLine,
                    ...(line.bold ? { fontWeight: 'bold' as const } : {}),
                    ...(line.italic ? { fontStyle: 'italic' as const } : {}),
                  }}
                >
                  {line.text}
                </Text>
              ))
            )}
          </View>
        ))}
      </View>

      {/* Hymnal name footer */}
      {hymn.hymnal?.name && (
        <View style={s.hymnalFooter}>
          <Text style={s.hymnalName}>{hymn.hymnal.name}</Text>
        </View>
      )}
    </View>
  );
}
