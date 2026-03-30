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
  ecoMode?: boolean;
}

/** Detect if a title line is a chorus marker */
function isChorusMarker(text: string): boolean {
  const normalized = text.trim().toUpperCase();
  return normalized === 'CORO' || normalized === 'CHORUS';
}

/** Genera estilos dinamicos basados en el font preset */
function createStyles(preset: FontPresetConfig, styleVariant: 'decorated' | 'plain', ecoMode: boolean) {
  const isDecorated = styleVariant === 'decorated';

  return StyleSheet.create({
    container: {
      width: BOOKLET_PAGE_WIDTH,
      height: BOOKLET_SHEET_HEIGHT,
      padding: BOOKLET_MARGIN,
      flexDirection: 'column',
      fontFamily: preset.family,
      backgroundColor: isDecorated && !ecoMode ? COLORS.pageBg : '#ffffff',
    },
    // Decorated header: compact colored bar
    headerDecorated: {
      backgroundColor: ecoMode ? '#ffffff' : COLORS.headerBg,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      ...(ecoMode ? { borderBottomWidth: 2, borderBottomColor: COLORS.goldAccent } : {}),
    },
    headerDecoratedNumber: {
      fontSize: preset.scale.heading,
      color: ecoMode ? COLORS.goldAccent : COLORS.goldHighlight,
      fontFamily: 'Adamina',
      fontWeight: 'bold',
    },
    headerDecoratedTitle: {
      fontSize: preset.scale.display,
      color: ecoMode ? '#111111' : COLORS.headerText,
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
      textTransform: 'uppercase',
      color: '#000000',
      marginTop: 2,
    },
    // Bible reference — inline text + reference
    bibleSection: {
      marginBottom: 14,
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderLeftWidth: 2,
      borderLeftColor: isDecorated ? COLORS.goldAccent : '#999999',
      marginLeft: 20,
      marginRight: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    bibleText: {
      fontSize: preset.scale.label,
      ...(preset.family !== 'Adamina' ? { fontStyle: 'italic' as const } : {}),
      color: isDecorated ? COLORS.bibleTextLight : '#333333',
      lineHeight: 1.4,
    },
    bibleReference: {
      fontSize: preset.scale.label,
      fontWeight: 'bold',
      color: isDecorated ? COLORS.goldAccent : '#111111',
      marginLeft: 4,
      lineHeight: 1.4,
    },
    // Verses
    versesArea: {
      flex: 1,
    },
    verseBlock: {
      marginBottom: 8,
    },
    // Thin gold rule between sections (decorated only)
    sectionRule: {
      width: 40,
      height: 1,
      backgroundColor: isDecorated ? COLORS.ornament : '#dddddd',
      alignSelf: 'center',
      marginBottom: 6,
    },
    verseMarker: {
      fontSize: preset.scale.body,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 3,
      color: isDecorated ? COLORS.goldAccent : '#000000',
    },
    // CORO marker: slightly larger, letter-spaced
    chorusMarker: {
      fontSize: preset.scale.body + 1,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 3,
      color: isDecorated ? COLORS.goldAccent : '#000000',
      letterSpacing: 2,
    },
    lyricLine: {
      fontSize: preset.scale.body,
      textAlign: 'center',
      lineHeight: 1.35,
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
  ecoMode = false,
}: HymnPageBookletProps) {
  const preset = FONT_PRESETS_BOOKLET[fontPreset];
  const s = createStyles(preset, style, ecoMode);
  const isDecorated = style === 'decorated';
  // Adamina no tiene variante italic registrada
  const supportsItalic = preset.family !== 'Adamina';

  return (
    <View style={s.container}>
      {/* Header */}
      {isDecorated ? (
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

      {/* Verses with subtle dividers */}
      <View style={s.versesArea}>
        {verses.map((verse, idx) => (
          <React.Fragment key={idx}>
            {/* Thin gold rule between sections (skip before first, decorated only) */}
            {idx > 0 && isDecorated && verse.type === 'title' && (
              <View style={s.sectionRule} />
            )}
            <View style={s.verseBlock}>
              {verse.type === 'title' ? (
                verse.lines.map((line, li) => {
                  const isCoro = isChorusMarker(line.text);
                  return (
                    <Text
                      key={li}
                      style={isCoro ? s.chorusMarker : s.verseMarker}
                    >
                      {line.text}
                    </Text>
                  );
                })
              ) : (
                verse.lines.map((line, li) => (
                  <Text
                    key={li}
                    style={{
                      ...s.lyricLine,
                      ...(line.bold ? { fontWeight: 'bold' as const } : {}),
                      ...(line.italic && supportsItalic ? { fontStyle: 'italic' as const } : {}),
                    }}
                  >
                    {line.text}
                  </Text>
                ))
              )}
            </View>
          </React.Fragment>
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
