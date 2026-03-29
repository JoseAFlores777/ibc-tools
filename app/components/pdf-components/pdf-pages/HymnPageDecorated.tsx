import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import path from 'path';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  MARGIN_1UP,
  FOOTER_HEIGHT,
  FOOTER_BORDER_TOP,
  HEADER_BORDER_BOTTOM,
  FONT_DECORATED,
  COLORS,
} from '@/app/components/pdf-components/shared/pdf-tokens';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

export interface HymnPageDecoratedProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.pageBg,
    fontFamily: 'Adamina',
  },
  header: {
    position: 'relative',
    width: '100%',
    backgroundColor: COLORS.headerBg,
    borderBottomColor: COLORS.goldAccent,
    borderBottomWidth: HEADER_BORDER_BOTTOM,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.headerOverlay,
  },
  headerTexts: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hymnNumber: {
    fontSize: FONT_DECORATED.heading,
    color: COLORS.goldHighlight,
  },
  hymnTitle: {
    fontSize: FONT_DECORATED.display,
    textTransform: 'uppercase',
    color: COLORS.headerText,
    marginTop: 4,
  },
  hymnalName: {
    fontSize: FONT_DECORATED.label,
    color: COLORS.headerText,
    marginTop: 4,
  },
  bibleSection: {
    marginTop: 12,
    paddingHorizontal: 80,
    marginBottom: 10,
    alignItems: 'center',
  },
  bibleText: {
    fontSize: FONT_DECORATED.label,
    textAlign: 'center',
    color: COLORS.lightText,
    lineHeight: 1.4,
  },
  bibleReference: {
    fontSize: FONT_DECORATED.label,
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.headerText,
  },
  body: {
    paddingTop: 20,
    paddingHorizontal: MARGIN_1UP,
    flex: 1,
  },
  verseBlock: {
    marginBottom: 12,
  },
  verseMarker: {
    fontSize: FONT_DECORATED.body,
    color: COLORS.goldAccent,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lyricLine: {
    fontSize: FONT_DECORATED.body,
    color: COLORS.bodyText,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: FOOTER_HEIGHT,
    backgroundColor: COLORS.footerBg,
    borderTopColor: COLORS.goldAccent,
    borderTopWidth: FOOTER_BORDER_TOP,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  footerHymnInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  footerInfoText: {
    fontSize: FONT_DECORATED.label,
    color: COLORS.lightText,
  },
  footerChurchInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footerChurchTexts: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginRight: 10,
  },
  footerChurchTitle: {
    fontSize: FONT_DECORATED.label,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  footerChurchSubtitle: {
    fontSize: FONT_DECORATED.label,
    color: COLORS.lightText,
  },
  footerLogo: {
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 100,
  },
});

/**
 * Agrupa autores por rol y formatea como "{rol_abbr}: {nombres}".
 */
function formatAuthors(
  authors: HymnForPdf['authors'],
): Array<{ abbr: string; names: string }> {
  const roleMap = new Map<string, { abbr: string; names: string[] }>();

  for (const author of authors) {
    if (!author.authors_id) continue;
    for (const role of author.author_roles) {
      if (!role.author_roles_id) continue;
      const key = role.author_roles_id.description;
      const existing = roleMap.get(key);
      if (existing) {
        existing.names.push(author.authors_id.name);
      } else {
        roleMap.set(key, {
          abbr: role.author_roles_id.rol_abbr,
          names: [author.authors_id.name],
        });
      }
    }
  }

  return Array.from(roleMap.values()).map((entry) => ({
    abbr: entry.abbr,
    names: entry.names.join(', '),
  }));
}

export const HymnPageDecorated: React.FC<HymnPageDecoratedProps> = ({ hymn, verses }) => {
  const authorGroups = formatAuthors(hymn.authors);

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gradientOverlay} />
        <View style={styles.headerTexts}>
          <Text style={styles.hymnNumber}>
            {hymn.hymn_number != null ? `Himno # ${hymn.hymn_number}` : 'Himno'}
          </Text>
          <Text style={styles.hymnTitle}>{hymn.name}</Text>
          {hymn.hymnal && <Text style={styles.hymnalName}>{hymn.hymnal.name}</Text>}
          {(hymn.bible_text || hymn.bible_reference) && (
            <View style={styles.bibleSection}>
              {hymn.bible_text && <Text style={styles.bibleText}>{hymn.bible_text}</Text>}
              {hymn.bible_reference && (
                <Text style={styles.bibleReference}>{hymn.bible_reference}</Text>
              )}
            </View>
          )}
        </View>
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

      {/* Footer */}
      <View style={styles.footer} fixed>
        <View style={styles.footerHymnInfo}>
          {hymn.hymn_time_signature && (
            <Text style={styles.footerInfoText}>
              {`Compas: ${hymn.hymn_time_signature}`}
            </Text>
          )}
          {authorGroups.map((group, idx) => (
            <Text key={idx} style={styles.footerInfoText}>
              {`${group.abbr}: ${group.names}`}
            </Text>
          ))}
          {hymn.hymnal?.name && hymn.hymnal?.publisher && (
            <Text style={styles.footerInfoText}>
              {`${hymn.hymnal.name} , ${hymn.hymnal.publisher}`}
            </Text>
          )}
        </View>
        <View style={styles.footerChurchInfo}>
          <View style={styles.footerChurchTexts}>
            <Text style={styles.footerChurchTitle}>DIOS ES FIEL</Text>
            <Text style={styles.footerChurchSubtitle}>Iglesia Bautista El Calvario</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={styles.footerLogo} />
        </View>
      </View>
    </Page>
  );
};
