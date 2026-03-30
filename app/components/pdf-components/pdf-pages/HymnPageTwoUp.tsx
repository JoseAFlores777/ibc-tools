import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import path from 'path';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts';
import {
  MARGIN_2UP,
  COLUMN_WIDTH_2UP,
  DIVIDER_WIDTH,
  DIVIDER_MARGIN,
  HEADER_BORDER_BOTTOM_2UP,
  FOOTER_BORDER_TOP,
  FONT_DECORATED_2UP,
  FONT_PLAIN_2UP,
  COLORS,
} from '@/app/components/pdf-components/shared/pdf-tokens';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

export type PdfStyle = 'decorated' | 'decorated-eco' | 'plain';

export interface HymnColumnData {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

export interface HymnPageTwoUpProps {
  hymnA: HymnColumnData;
  hymnB: HymnColumnData | null;
  style: PdfStyle;
}

/* ── Decorated styles ─────────────────────────────────────────────── */

const decoratedStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.pageBg,
    fontFamily: 'Adamina',
    padding: MARGIN_2UP,
  },
  header: {
    position: 'relative',
    width: '100%',
    backgroundColor: COLORS.headerBg,
    borderBottomColor: COLORS.goldAccent,
    borderBottomWidth: HEADER_BORDER_BOTTOM_2UP,
    overflow: 'hidden',
    marginBottom: 8,
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
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerChurchName: {
    fontSize: FONT_DECORATED_2UP.label,
    color: COLORS.headerText,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    width: COLUMN_WIDTH_2UP,
    flex: 1,
  },
  divider: {
    width: DIVIDER_WIDTH,
    backgroundColor: COLORS.divider,
    marginHorizontal: DIVIDER_MARGIN,
  },
  hymnTitle: {
    fontSize: FONT_DECORATED_2UP.display,
    color: COLORS.goldHighlight,
    textAlign: 'center',
    marginBottom: 4,
  },
  hymnNumber: {
    fontSize: FONT_DECORATED_2UP.heading,
    color: COLORS.goldHighlight,
    textAlign: 'center',
    marginBottom: 2,
  },
  hymnalName: {
    fontSize: FONT_DECORATED_2UP.label,
    color: COLORS.bodyText,
    textAlign: 'center',
    marginBottom: 8,
  },
  verseBlock: {
    marginBottom: 8,
  },
  verseMarker: {
    fontSize: FONT_DECORATED_2UP.body,
    color: COLORS.goldAccent,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lyricLine: {
    fontSize: FONT_DECORATED_2UP.body,
    color: COLORS.bodyText,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  footer: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.footerBg,
    borderTopColor: COLORS.goldAccent,
    borderTopWidth: FOOTER_BORDER_TOP,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  footerHymnInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
  },
  footerInfoText: {
    fontSize: FONT_DECORATED_2UP.label,
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
    marginRight: 8,
  },
  footerChurchTitle: {
    fontSize: FONT_DECORATED_2UP.label,
    color: COLORS.lightText,
    marginBottom: 2,
  },
  footerChurchSubtitle: {
    fontSize: FONT_DECORATED_2UP.label,
    color: COLORS.lightText,
  },
  footerLogo: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    padding: 3,
    borderRadius: 100,
  },
});

/* ── Plain styles ─────────────────────────────────────────────────── */

const plainStyles = StyleSheet.create({
  page: {
    padding: MARGIN_2UP,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    width: COLUMN_WIDTH_2UP,
    flex: 1,
  },
  divider: {
    width: DIVIDER_WIDTH,
    backgroundColor: COLORS.divider,
    marginHorizontal: DIVIDER_MARGIN,
  },
  columnHeader: {
    marginBottom: 12,
    textAlign: 'center',
  },
  hymnNumber: {
    fontSize: FONT_PLAIN_2UP.hymnNumber,
    color: COLORS.plainSubtitle,
  },
  hymnTitle: {
    fontSize: FONT_PLAIN_2UP.title,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  hymnalName: {
    fontSize: FONT_PLAIN_2UP.hymnalName,
    color: COLORS.plainSubtitle,
    marginTop: 4,
  },
  verseBlock: {
    marginBottom: 8,
  },
  verseMarker: {
    fontSize: FONT_PLAIN_2UP.verseMarker,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#000000',
  },
  lyricLine: {
    fontSize: FONT_PLAIN_2UP.lyricLine,
    textAlign: 'left',
    lineHeight: 1.4,
    color: '#000000',
  },
});

/* ── Helper: format authors grouped by role ───────────────────────── */

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

/* ── Verse renderer (shared between both styles) ──────────────────── */

function renderVerses(
  verses: ParsedVerse[],
  styles: {
    verseBlock: Style;
    verseMarker: Style;
    lyricLine: Style;
  },
) {
  return verses.map((verse, idx) => (
    <View key={idx} style={styles.verseBlock}>
      {verse.type === 'title'
        ? verse.lines.map((line, li) => (
            <Text key={li} style={styles.verseMarker}>
              {line.text}
            </Text>
          ))
        : verse.lines.map((line, li) => (
            <Text
              key={li}
              style={{
                ...styles.lyricLine,
                ...(line.bold ? { fontWeight: 'bold' as const } : {}),
                ...(line.italic ? { fontStyle: 'italic' as const } : {}),
              }}
            >
              {line.text}
            </Text>
          ))}
    </View>
  ));
}

/* ── Decorated 2-per-page ─────────────────────────────────────────── */

const DecoratedTwoUp: React.FC<HymnPageTwoUpProps> = ({ hymnA, hymnB }) => {
  const authorGroupsA = formatAuthors(hymnA.hymn.authors);
  const authorGroupsB = hymnB ? formatAuthors(hymnB.hymn.authors) : [];

  return (
    <Page size="LETTER" style={decoratedStyles.page}>
      {/* Shared header */}
      <View style={decoratedStyles.header}>
        <View style={decoratedStyles.gradientOverlay} />
        <View style={decoratedStyles.headerTexts}>
          <Text style={decoratedStyles.headerChurchName}>
            Iglesia Bautista El Calvario
          </Text>
        </View>
      </View>

      {/* Columns */}
      <View style={decoratedStyles.columnsContainer}>
        {/* Column A */}
        <View style={decoratedStyles.column}>
          <Text style={decoratedStyles.hymnNumber}>
            {hymnA.hymn.hymn_number != null
              ? `Himno # ${hymnA.hymn.hymn_number}`
              : 'Himno'}
          </Text>
          <Text style={decoratedStyles.hymnTitle}>{hymnA.hymn.name}</Text>
          {hymnA.hymn.hymnal && (
            <Text style={decoratedStyles.hymnalName}>{hymnA.hymn.hymnal.name}</Text>
          )}
          {renderVerses(hymnA.verses, decoratedStyles)}
        </View>

        {/* Divider */}
        <View style={decoratedStyles.divider} />

        {/* Column B */}
        <View style={decoratedStyles.column}>
          {hymnB ? (
            <>
              <Text style={decoratedStyles.hymnNumber}>
                {hymnB.hymn.hymn_number != null
                  ? `Himno # ${hymnB.hymn.hymn_number}`
                  : 'Himno'}
              </Text>
              <Text style={decoratedStyles.hymnTitle}>{hymnB.hymn.name}</Text>
              {hymnB.hymn.hymnal && (
                <Text style={decoratedStyles.hymnalName}>{hymnB.hymn.hymnal.name}</Text>
              )}
              {renderVerses(hymnB.verses, decoratedStyles)}
            </>
          ) : (
            <View />
          )}
        </View>
      </View>

      {/* Shared footer */}
      <View style={decoratedStyles.footer} fixed>
        <View style={decoratedStyles.footerHymnInfo}>
          {authorGroupsA.map((group, idx) => (
            <Text key={`a-${idx}`} style={decoratedStyles.footerInfoText}>
              {`${group.abbr}: ${group.names}`}
            </Text>
          ))}
          {authorGroupsB.map((group, idx) => (
            <Text key={`b-${idx}`} style={decoratedStyles.footerInfoText}>
              {`${group.abbr}: ${group.names}`}
            </Text>
          ))}
        </View>
        <View style={decoratedStyles.footerChurchInfo}>
          <View style={decoratedStyles.footerChurchTexts}>
            <Text style={decoratedStyles.footerChurchTitle}>DIOS ES FIEL</Text>
            <Text style={decoratedStyles.footerChurchSubtitle}>
              Iglesia Bautista El Calvario
            </Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={decoratedStyles.footerLogo} />
        </View>
      </View>
    </Page>
  );
};

/* ── Plain 2-per-page ─────────────────────────────────────────────── */

const PlainTwoUp: React.FC<HymnPageTwoUpProps> = ({ hymnA, hymnB }) => {
  return (
    <Page size="LETTER" style={plainStyles.page}>
      <View style={plainStyles.columnsContainer}>
        {/* Column A */}
        <View style={plainStyles.column}>
          <View style={plainStyles.columnHeader}>
            <Text style={plainStyles.hymnNumber}>
              {hymnA.hymn.hymn_number != null
                ? `Himno # ${hymnA.hymn.hymn_number}`
                : 'Himno'}
            </Text>
            <Text style={plainStyles.hymnTitle}>{hymnA.hymn.name}</Text>
            {hymnA.hymn.hymnal && (
              <Text style={plainStyles.hymnalName}>{hymnA.hymn.hymnal.name}</Text>
            )}
          </View>
          {renderVerses(hymnA.verses, plainStyles)}
        </View>

        {/* Divider */}
        <View style={plainStyles.divider} />

        {/* Column B */}
        <View style={plainStyles.column}>
          {hymnB ? (
            <>
              <View style={plainStyles.columnHeader}>
                <Text style={plainStyles.hymnNumber}>
                  {hymnB.hymn.hymn_number != null
                    ? `Himno # ${hymnB.hymn.hymn_number}`
                    : 'Himno'}
                </Text>
                <Text style={plainStyles.hymnTitle}>{hymnB.hymn.name}</Text>
                {hymnB.hymn.hymnal && (
                  <Text style={plainStyles.hymnalName}>{hymnB.hymn.hymnal.name}</Text>
                )}
              </View>
              {renderVerses(hymnB.verses, plainStyles)}
            </>
          ) : (
            <View />
          )}
        </View>
      </View>
    </Page>
  );
};

/* ── Main export ──────────────────────────────────────────────────── */

export const HymnPageTwoUp: React.FC<HymnPageTwoUpProps> = (props) => {
  if (props.style === 'decorated' || props.style === 'decorated-eco') {
    return <DecoratedTwoUp {...props} />;
  }
  return <PlainTwoUp {...props} />;
};
