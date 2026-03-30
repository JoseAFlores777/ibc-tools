import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  BOOKLET_MARGIN,
  FONT_PRESETS_BOOKLET,
  COLORS,
  type FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';

export interface TocEntry {
  hymnNumber: number | null;
  name: string;
  page: number;
}

export interface BookletTOCProps {
  entries: TocEntry[];
  fontPreset: FontPreset;
  style: 'decorated' | 'decorated-eco' | 'plain';
}

export function BookletTOC({ entries, fontPreset, style }: BookletTOCProps) {
  const preset = FONT_PRESETS_BOOKLET[fontPreset];
  const isDecorated = style === 'decorated' || style === 'decorated-eco';
  const isEco = style === 'decorated-eco';

  const s = StyleSheet.create({
    container: {
      width: BOOKLET_PAGE_WIDTH,
      height: BOOKLET_SHEET_HEIGHT,
      padding: BOOKLET_MARGIN,
      paddingTop: BOOKLET_MARGIN + 10,
      flexDirection: 'column',
      fontFamily: isDecorated ? 'Adamina' : preset.family,
      backgroundColor: isDecorated && !isEco ? COLORS.pageBg : '#ffffff',
    },
    title: {
      fontSize: preset.scale.heading,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: isDecorated && !isEco ? COLORS.headerBg : '#111111',
      fontWeight: 'bold',
      marginBottom: 16,
      letterSpacing: 1,
    },
    divider: {
      width: 40,
      height: 2,
      backgroundColor: isDecorated ? COLORS.goldAccent : '#cccccc',
      alignSelf: 'center',
      marginBottom: 16,
    },
    entriesArea: {
      flex: 1,
    },
    entry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDecorated && !isEco ? '#e8e8e8' : '#f0f0f0',
    },
    entryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    entryNumber: {
      fontSize: preset.scale.label,
      color: isDecorated ? COLORS.goldAccent : '#666666',
      fontWeight: 'bold',
      width: 24,
      textAlign: 'right',
    },
    entryName: {
      fontSize: preset.scale.body,
      color: isDecorated && !isEco ? COLORS.bodyText : '#111111',
      flex: 1,
    },
    entryPage: {
      fontSize: preset.scale.label,
      color: isDecorated ? COLORS.goldAccent : '#999999',
      width: 36,
      textAlign: 'right',
    },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>Indice</Text>
      <View style={s.divider} />
      <View style={s.entriesArea}>
        {entries.map((entry, idx) => (
          <View key={idx} style={s.entry}>
            <View style={s.entryLeft}>
              <Text style={s.entryNumber}>
                {entry.hymnNumber != null ? `${entry.hymnNumber}` : ''}
              </Text>
              <Text style={s.entryName}>{entry.name}</Text>
            </View>
            <Text style={s.entryPage}>Pág. {entry.page}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
