/**
 * Interfaces for the Empaquetador de Himnos feature.
 * Separate from Program.interface.ts to avoid coupling with program PDF flow (per D-04 research anti-pattern).
 */

/** Metadata for a resolved Directus file reference (per D-04: includes name, size, format) */
export interface AudioFileInfo {
  id: string;
  filename_download: string;
  filesize: number | null;
  type: string | null; // MIME type, e.g. "audio/midi", "audio/mpeg"
}

/** Audio availability map for a hymn -- null means the field has no file (per D-04, D-05) */
export interface HymnAudioFiles {
  track_only: AudioFileInfo | null;
  midi_file: AudioFileInfo | null;
  soprano_voice: AudioFileInfo | null;
  alto_voice: AudioFileInfo | null;
  tenor_voice: AudioFileInfo | null;
  bass_voice: AudioFileInfo | null;
}

/** Campos en los que se puede buscar texto */
export type HymnSearchField = 'name' | 'number' | 'letter';

/** Filters accepted by searchHymns() */
export interface HymnSearchFilters {
  query?: string; // Search text
  hymnNumber?: number; // Exact match on hymn_number
  hymnalId?: string; // Filter by hymnal UUID
  categoryId?: number; // Filter by category through M2M junction
  searchIn?: HymnSearchField[]; // Campos donde buscar (default: todos)
  limit?: number; // Result limit (default 25)
  offset?: number; // For pagination
}

/** Single result from searchHymns() */
export interface HymnSearchResult {
  id: string;
  name: string;
  hymn_number: number | null;
  hymnal: { id: string; name: string } | null;
  categories: Array<{
    hymn_categories_id: { id: number; name: string } | null;
  }>;
  audioFiles: HymnAudioFiles;
  hasAnyAudio: boolean;
  musicxmlFileId: string | null;
  hasMusicXml: boolean;
}

/** Complete hymn data for PDF generation, returned by fetchHymnForPdf() */
export interface HymnForPdf {
  id: string;
  name: string;
  hymn_number: number | null;
  hymn_time_signature: string | null;
  letter_hymn: string | null;
  bible_text: string | null;
  bible_reference: string | null;
  hymnal: { name: string; publisher: string | null } | null;
  authors: Array<{
    authors_id: { name: string } | null;
    author_roles: Array<{
      author_roles_id: { description: string; rol_abbr: string } | null;
    }>;
  }>;
  audioFiles: HymnAudioFiles;
}

/** A parsed verse/section from hymn HTML (output of parseHymnHtml) */
export interface ParsedVerse {
  type: 'title' | 'verse';
  lines: ParsedLine[];
}

/** A single line within a parsed verse */
export interface ParsedLine {
  text: string;
  bold?: boolean;
  italic?: boolean;
}
