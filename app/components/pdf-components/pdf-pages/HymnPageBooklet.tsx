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

/** Unicode ornament for section dividers */
const ORNAMENT_CHAR = '\u2740'; // ❀

/** Detect if a title line is a chorus marker */
function isChorusMarker(text: string): boolean {
  const normalized = text.trim().toUpperCase();
  return normalized === 'CORO' || normalized === 'CHORUS';
}

/** Format verse/chorus markers with ornamental flanks */
function formatMarkerText(text: string): string {
  if (isChorusMarker(text)) {
    return `\u2014  ${text.trim().toUpperCase()}  \u2014`;
  }
  return `\u2013 ${text.trim()} \u2013`;
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
    // Badge pill for hymn number
    headerNumberBadge: {
      backgroundColor: COLORS.goldBadgeBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 2,
    },
    headerDecoratedNumber: {
      fontSize: preset.scale.heading,
      color: COLORS.goldHighlight,
      fontFamily: 'Adamina',
      fontWeight: 'bold',
      letterSpacing: 1,
    },
    headerDecoratedTitle: {
      fontSize: preset.scale.display,
      color: COLORS.headerText,
      textTransform: 'uppercase',
      fontFamily: 'Adamina',
      letterSpacing: 0.5,
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
    // Bible reference — improved contrast
    bibleSection: {
      marginBottom: 8,
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 6,
      alignItems: 'center',
      borderLeftWidth: 2,
      borderLeftColor: isDecorated ? COLORS.goldAccent : '#999999',
      marginLeft: 20,
      marginRight: 20,
    },
    bibleText: {
      fontSize: preset.scale.label,
      textAlign: 'left',
      ...(preset.family !== 'Adamina' ? { fontStyle: 'italic' as const } : {}),
      color: isDecorated ? COLORS.bibleTextLight : '#333333',
      lineHeight: 1.4,
    },
    bibleReference: {
      fontSize: preset.scale.label,
      marginTop: 4,
      textAlign: 'left',
      fontWeight: 'bold',
      color: isDecorated ? COLORS.goldHighlight : '#111111',
    },
    // Body with left accent border (decorated only)
    versesArea: {
      flex: 1,
      ...(isDecorated ? {
        borderLeftWidth: 2,
        borderLeftColor: COLORS.ornament,
        marginLeft: 8,
        paddingLeft: 8,
      } : {}),
    },
    // Ornamental divider between sections
    sectionDivider: {
      textAlign: 'center',
      fontSize: 6,
      color: isDecorated ? COLORS.ornament : '#cccccc',
      marginBottom: 5,
      letterSpacing: 3,
    },
    verseBlock: {
      marginBottom: 8,
    },
    // Verse marker: with flanking dashes
    verseMarker: {
      fontSize: preset.scale.body,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 3,
      color: isDecorated ? COLORS.goldAccent : '#000000',
      letterSpacing: 1.5,
    },
    // CORO marker: larger and more prominent
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
      lineHeight: 1.4,
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
  const isDecorated = style === 'decorated';
  // Adamina no tiene variante italic registrada
  const supportsItalic = preset.family !== 'Adamina';

  return (
    <View style={s.container}>
      {/* Header */}
      {isDecorated ? (
        <View style={s.headerDecorated}>
          {hymn.hymn_number != null && (
            <View style={s.headerNumberBadge}>
              <Text style={s.headerDecoratedNumber}>
                # {hymn.hymn_number}
              </Text>
            </View>
          )}
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

      {/* Bible reference (conditional) — wrapped in quotes for decorated */}
      {includeBibleRef && (hymn.bible_text || hymn.bible_reference) && (
        <View style={s.bibleSection}>
          {hymn.bible_text && (
            <Text style={s.bibleText}>
              {isDecorated ? `\u201C${hymn.bible_text}\u201D` : hymn.bible_text}
            </Text>
          )}
          {hymn.bible_reference && (
            <Text style={s.bibleReference}>{hymn.bible_reference}</Text>
          )}
        </View>
      )}

      {/* Verses with ornamental dividers */}
      <View style={s.versesArea}>
        {verses.map((verse, idx) => (
          <React.Fragment key={idx}>
            {/* Ornamental divider between sections (skip before first) */}
            {idx > 0 && isDecorated && (
              <Text style={s.sectionDivider}>
                {`${ORNAMENT_CHAR}  ${ORNAMENT_CHAR}  ${ORNAMENT_CHAR}`}
              </Text>
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
                      {isDecorated ? formatMarkerText(line.text) : line.text}
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
