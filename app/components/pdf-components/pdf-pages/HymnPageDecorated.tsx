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
  FONT_PRESETS,
  COLORS,
  type FontPreset,
  type Orientation,
} from '@/app/components/pdf-components/shared/pdf-tokens';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

export interface HymnPageDecoratedProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
  orientation?: Orientation;
  fontPreset?: FontPreset;
  includeBibleRef?: boolean;
  ecoMode?: boolean;
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
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hymnNumber: {
    fontSize: FONT_DECORATED.heading,
    color: COLORS.goldHighlight,
    fontWeight: 'bold',
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
    marginTop: 10,
    paddingHorizontal: 40,
    paddingVertical: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.goldAccent,
  },
  bibleText: {
    fontSize: FONT_DECORATED.label,
    textAlign: 'left',
    color: COLORS.bibleTextLight,
    lineHeight: 1.5,
  },
  bibleReference: {
    fontSize: FONT_DECORATED.label + 1,
    marginTop: 6,
    textAlign: 'left',
    fontWeight: 'bold',
    color: COLORS.goldHighlight,
  },
  body: {
    paddingTop: 20,
    paddingHorizontal: MARGIN_1UP,
    flex: 1,
  },
  verseBlock: {
    marginBottom: 14,
  },
  /* Thin gold rule between sections */
  sectionRule: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.ornament,
    alignSelf: 'center',
    marginBottom: 10,
  },
  verseMarker: {
    fontSize: FONT_DECORATED.body,
    color: COLORS.goldAccent,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  /* CORO label: slightly larger, letter-spaced */
  chorusMarker: {
    fontSize: FONT_DECORATED.body + 2,
    color: COLORS.goldAccent,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 2,
  },
  lyricLine: {
    fontSize: FONT_DECORATED.body,
    color: COLORS.bodyText,
    textAlign: 'center',
    lineHeight: 1.5,
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
    paddingHorizontal: 16,
  },
  footerHymnInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  footerInfoText: {
    fontSize: 8,
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
    fontSize: 8,
    color: COLORS.lightText,
    marginBottom: 2,
  },
  footerChurchSubtitle: {
    fontSize: 7,
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

/** Detect if a title line is a chorus marker */
function isChorusMarker(text: string): boolean {
  const normalized = text.trim().toUpperCase();
  return normalized === 'CORO' || normalized === 'CHORUS';
}

export const HymnPageDecorated: React.FC<HymnPageDecoratedProps> = ({
  hymn,
  verses,
  orientation = 'portrait',
  fontPreset = 'clasica',
  includeBibleRef = true,
  ecoMode = false,
}) => {
  const authorGroups = formatAuthors(hymn.authors);
  const preset = FONT_PRESETS[fontPreset];

  // Eco mode: misma estructura decorada pero sin fondos de color (ahorro de tinta)
  const ecoOverrides = ecoMode ? {
    page: { backgroundColor: '#ffffff' },
    header: { backgroundColor: '#ffffff', borderBottomColor: COLORS.goldAccent },
    hymnNumber: { color: COLORS.goldAccent },
    hymnTitle: { color: '#111111' },
    hymnalName: { color: COLORS.plainSubtitle },
    bibleText: { color: '#555555' },
    bibleReference: { color: '#111111' },
    sectionRule: { backgroundColor: '#cccccc' },
    verseMarker: { color: COLORS.goldAccent },
    chorusMarker: { color: COLORS.goldAccent },
    lyricLine: { color: '#000000' },
    footer: { backgroundColor: '#ffffff', borderTopColor: COLORS.goldAccent },
    footerInfoText: { color: COLORS.plainSubtitle },
    footerChurchTitle: { color: '#333333' },
    footerChurchSubtitle: { color: COLORS.plainSubtitle },
  } : {};

  const dynamicStyles = {
    hymnNumber: { ...styles.hymnNumber, fontSize: preset.scale.heading, ...ecoOverrides.hymnNumber },
    hymnTitle: { ...styles.hymnTitle, fontSize: preset.scale.display, ...ecoOverrides.hymnTitle },
    hymnalName: { ...styles.hymnalName, fontSize: preset.scale.label, ...ecoOverrides.hymnalName },
    bibleText: { ...styles.bibleText, fontSize: preset.scale.label, ...ecoOverrides.bibleText },
    bibleReference: { ...styles.bibleReference, fontSize: preset.scale.label, ...ecoOverrides.bibleReference },
    sectionRule: { ...styles.sectionRule, ...ecoOverrides.sectionRule },
    verseMarker: { ...styles.verseMarker, fontSize: preset.scale.body, ...ecoOverrides.verseMarker },
    chorusMarker: { ...styles.chorusMarker, fontSize: preset.scale.body + 2, ...ecoOverrides.chorusMarker },
    lyricLine: { ...styles.lyricLine, fontSize: preset.scale.body, fontFamily: preset.family, ...ecoOverrides.lyricLine },
    footerInfoText: { ...styles.footerInfoText, ...ecoOverrides.footerInfoText },
  };

  return (
    <Page size="LETTER" orientation={orientation} style={{ ...styles.page, ...ecoOverrides.page }}>
      {/* Header */}
      <View style={{ ...styles.header, ...ecoOverrides.header }}>
        {!ecoMode && <View style={styles.gradientOverlay} />}
        <View style={styles.headerTexts}>
          <Text style={dynamicStyles.hymnNumber}>
            {hymn.hymn_number != null ? `# ${hymn.hymn_number}` : 'Himno'}
          </Text>
          <Text style={dynamicStyles.hymnTitle}>{hymn.name}</Text>
          {hymn.hymnal && <Text style={dynamicStyles.hymnalName}>{hymn.hymnal.name}</Text>}
          {includeBibleRef && (hymn.bible_text || hymn.bible_reference) && (
            <View style={styles.bibleSection}>
              {hymn.bible_text && <Text style={dynamicStyles.bibleText}>{hymn.bible_text}</Text>}
              {hymn.bible_reference && (
                <Text style={dynamicStyles.bibleReference}>{hymn.bible_reference}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Body: versos */}
      <View style={styles.body}>
        {verses.map((verse, idx) => (
          <React.Fragment key={idx}>
            {/* Thin gold rule between sections (only before title blocks, skip first) */}
            {idx > 0 && verse.type === 'title' && (
              <View style={dynamicStyles.sectionRule} />
            )}
            <View style={styles.verseBlock}>
              {verse.type === 'title' ? (
                verse.lines.map((line, li) => {
                  const isCoro = isChorusMarker(line.text);
                  return (
                    <Text
                      key={li}
                      style={isCoro ? dynamicStyles.chorusMarker : dynamicStyles.verseMarker}
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
                      ...dynamicStyles.lyricLine,
                      ...(line.bold ? { fontWeight: 'bold' } : {}),
                      ...(line.italic && preset.family !== 'Adamina'
                        ? { fontStyle: 'italic' }
                        : {}),
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

      {/* Footer (compacto) */}
      <View style={{ ...styles.footer, ...ecoOverrides.footer }} fixed>
        <View style={styles.footerHymnInfo}>
          {hymn.hymn_time_signature && (
            <Text style={dynamicStyles.footerInfoText}>
              {`Compas: ${hymn.hymn_time_signature}`}
            </Text>
          )}
          {authorGroups.map((group, idx) => (
            <Text key={idx} style={dynamicStyles.footerInfoText}>
              {`${group.abbr}: ${group.names}`}
            </Text>
          ))}
          {hymn.hymnal?.name && hymn.hymnal?.publisher && (
            <Text style={dynamicStyles.footerInfoText}>
              {`${hymn.hymnal.name} , ${hymn.hymnal.publisher}`}
            </Text>
          )}
        </View>
        <View style={styles.footerChurchInfo}>
          <View style={styles.footerChurchTexts}>
            <Text style={{ ...styles.footerChurchTitle, ...ecoOverrides.footerChurchTitle }}>DIOS ES FIEL</Text>
            <Text style={{ ...styles.footerChurchSubtitle, ...ecoOverrides.footerChurchSubtitle }}>Iglesia Bautista El Calvario</Text>
          </View>
          {!ecoMode && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoPath} style={styles.footerLogo} />
          )}
        </View>
      </View>
    </Page>
  );
};
