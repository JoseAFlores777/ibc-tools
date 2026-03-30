/** Page dimensions (LETTER paper) */
export const LETTER_WIDTH = 612;
export const LETTER_HEIGHT = 792;

/** Margins */
export const MARGIN_1UP = 40;
export const MARGIN_2UP = 20;

/** Divider (2-per-page) */
export const DIVIDER_WIDTH = 1;
export const DIVIDER_MARGIN = 8;
export const DIVIDER_TOTAL = 17;

/** Column width (2-per-page): (612 - 2*20 - 17) / 2 = 277 */
export const COLUMN_WIDTH_2UP = Math.floor((LETTER_WIDTH - 2 * MARGIN_2UP - DIVIDER_TOTAL) / 2);

/** Footer (decorated only) */
export const FOOTER_HEIGHT = 100;
export const FOOTER_BORDER_TOP = 9;
export const HEADER_BORDER_BOTTOM = 7;
export const HEADER_BORDER_BOTTOM_2UP = 5;

/** Decorated font scale (1-per-page) */
export const FONT_DECORATED = {
  display: 24,    // Hymn Title
  heading: 15,    // Hymn Number
  label: 10,      // Hymnal Name, Bible Text/Ref, Footer Text/Church
  body: 9,        // Verse Marker, Lyric Line
};

/** Decorated font scale (2-per-page) */
export const FONT_DECORATED_2UP = {
  display: 16,
  heading: 12,
  label: 9,
  body: 8,
};

/** Plain font scale (1-per-page) */
export const FONT_PLAIN = {
  hymnNumber: 10,
  title: 18,
  hymnalName: 10,
  verseMarker: 11,
  lyricLine: 11,
};

/** Plain font scale (2-per-page) */
export const FONT_PLAIN_2UP = {
  hymnNumber: 10,
  title: 13,
  hymnalName: 10,
  verseMarker: 9,
  lyricLine: 9,
};

/** Colors */
export const COLORS = {
  headerBg: '#393572',
  headerOverlay: 'rgba(53, 73, 115, 0.85)',
  goldAccent: '#9e7f19',
  goldHighlight: '#eaba1c',
  pageBg: '#f7f7f7',
  bodyText: '#444444',
  lightText: '#c2c2c4',
  headerText: '#ffffff',
  footerBg: '#2E4067',
  divider: '#cccccc',
  plainSubtitle: '#666666',
};

/** Booklet dimensions (landscape Letter, halved) */
export const BOOKLET_SHEET_WIDTH = 792;
export const BOOKLET_SHEET_HEIGHT = 612;
export const BOOKLET_PAGE_WIDTH = 396;
export const BOOKLET_MARGIN = 20;

/** Font preset types */
export type FontPreset = 'clasica' | 'moderna' | 'legible';

export interface FontScale {
  display: number;
  heading: number;
  label: number;
  body: number;
}

export interface FontPresetConfig {
  family: string;
  scale: FontScale;
}

/** Font presets for full-page (1-per-page and 2-per-page) */
export const FONT_PRESETS: Record<FontPreset, FontPresetConfig> = {
  clasica: { family: 'Adamina', scale: { display: 24, heading: 15, label: 10, body: 9 } },
  moderna: { family: 'Helvetica', scale: { display: 22, heading: 14, label: 10, body: 9 } },
  legible: { family: 'Helvetica', scale: { display: 28, heading: 18, label: 12, body: 12 } },
};

/** Font presets for booklet (half-letter, smaller sizes) */
export const FONT_PRESETS_BOOKLET: Record<FontPreset, FontPresetConfig> = {
  clasica: { family: 'Adamina', scale: { display: 18, heading: 12, label: 9, body: 8 } },
  moderna: { family: 'Helvetica', scale: { display: 16, heading: 11, label: 9, body: 8 } },
  legible: { family: 'Helvetica', scale: { display: 22, heading: 14, label: 10, body: 10 } },
};

/** Print mode and orientation types */
export type PrintMode = 'simple' | 'booklet';
export type Orientation = 'portrait' | 'landscape';
