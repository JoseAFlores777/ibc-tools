import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import path from 'path';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  BOOKLET_MARGIN,
  FONT_PRESETS_BOOKLET,
  COLORS,
  type FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

export interface BookletCoverProps {
  title: string;
  subtitle?: string;
  date?: string;
  bibleText?: string;
  bibleReference?: string;
  fontPreset: FontPreset;
  style: 'decorated' | 'plain';
}

export function BookletCover({
  title,
  subtitle,
  date,
  bibleText,
  bibleReference,
  fontPreset,
  style,
}: BookletCoverProps) {
  const preset = FONT_PRESETS_BOOKLET[fontPreset];
  const isDecorated = style === 'decorated';

  const s = StyleSheet.create({
    container: {
      width: BOOKLET_PAGE_WIDTH,
      height: BOOKLET_SHEET_HEIGHT,
      padding: BOOKLET_MARGIN,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: isDecorated ? 'Adamina' : preset.family,
      backgroundColor: isDecorated ? COLORS.headerBg : '#ffffff',
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 20,
      borderRadius: 40,
      backgroundColor: '#ffffff',
      padding: 4,
    },
    title: {
      fontSize: preset.scale.display + 4,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: isDecorated ? COLORS.headerText : '#111111',
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: preset.scale.heading,
      textAlign: 'center',
      color: isDecorated ? COLORS.goldHighlight : '#555555',
      marginBottom: 16,
    },
    divider: {
      width: 60,
      height: 2,
      backgroundColor: isDecorated ? COLORS.goldAccent : '#cccccc',
      marginBottom: 16,
    },
    bibleSection: {
      paddingHorizontal: 20,
      marginBottom: 16,
      alignItems: 'center',
    },
    bibleText: {
      fontSize: preset.scale.label,
      textAlign: 'center',
      color: isDecorated ? '#e0e0e0' : '#333333',
      lineHeight: 1.4,
      ...(preset.family !== 'Adamina' ? { fontStyle: 'italic' as const } : {}),
    },
    bibleRef: {
      fontSize: preset.scale.label,
      marginTop: 4,
      textAlign: 'center',
      fontWeight: 'bold',
      color: isDecorated ? COLORS.goldHighlight : '#111111',
    },
    date: {
      fontSize: preset.scale.label,
      textAlign: 'center',
      color: isDecorated ? COLORS.lightText : '#666666',
      marginTop: 8,
    },
    churchName: {
      fontSize: preset.scale.label,
      textAlign: 'center',
      color: isDecorated ? COLORS.lightText : '#888888',
      marginTop: 20,
    },
  });

  return (
    <View style={s.container}>
      {isDecorated && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={logoPath} style={s.logo} />
      )}
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      <View style={s.divider} />
      {(bibleText || bibleReference) && (
        <View style={s.bibleSection}>
          {bibleText && <Text style={s.bibleText}>{bibleText}</Text>}
          {bibleReference && <Text style={s.bibleRef}>{bibleReference}</Text>}
        </View>
      )}
      {date && <Text style={s.date}>{date}</Text>}
      <Text style={s.churchName}>Iglesia Bautista El Calvario</Text>
    </View>
  );
}

export interface BookletBackCoverProps {
  fontPreset: FontPreset;
  style: 'decorated' | 'plain';
}

export function BookletBackCover({ fontPreset, style }: BookletBackCoverProps) {
  const preset = FONT_PRESETS_BOOKLET[fontPreset];
  const isDecorated = style === 'decorated';

  const s = StyleSheet.create({
    container: {
      width: BOOKLET_PAGE_WIDTH,
      height: BOOKLET_SHEET_HEIGHT,
      padding: BOOKLET_MARGIN,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: isDecorated ? 'Adamina' : preset.family,
      backgroundColor: isDecorated ? COLORS.headerBg : '#ffffff',
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: 16,
      borderRadius: 30,
      backgroundColor: '#ffffff',
      padding: 3,
    },
    motto: {
      fontSize: preset.scale.heading,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: isDecorated ? COLORS.goldHighlight : '#333333',
      fontWeight: 'bold',
      marginBottom: 6,
    },
    churchName: {
      fontSize: preset.scale.label,
      textAlign: 'center',
      color: isDecorated ? COLORS.lightText : '#666666',
    },
  });

  return (
    <View style={s.container}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={logoPath} style={s.logo} />
      <Text style={s.motto}>Dios Es Fiel</Text>
      <Text style={s.churchName}>Iglesia Bautista El Calvario</Text>
    </View>
  );
}
