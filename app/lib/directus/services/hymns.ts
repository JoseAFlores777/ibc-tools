import { readItems, readItem } from '@directus/sdk';
import getDirectus from '@/app/lib/directus';
import type {
  HymnSearchFilters,
  HymnSearchResult,
  HymnForPdf,
  HymnAudioFiles,
  AudioFileInfo,
} from '@/app/interfaces/Hymn.interface';

/** Campos de audio que se resuelven como relaciones a directus_files */
const AUDIO_FIELD_NAMES = [
  'track_only',
  'midi_file',
  'soprano_voice',
  'alto_voice',
  'tenor_voice',
  'bass_voice',
] as const;

/** Sub-campos de cada archivo de audio resuelto */
const AUDIO_SUB_FIELDS = ['id', 'filename_download', 'filesize', 'type'] as const;

/** Genera los campos planos para resolución de audio (e.g. 'track_only', 'track_only.id', 'track_only.filename_download') */
function buildAudioFields(): string[] {
  return AUDIO_FIELD_NAMES.flatMap((field) => [
    field, // campo raíz — devuelve el UUID aunque la resolución de sub-campos falle
    ...AUDIO_SUB_FIELDS.map((sub) => `${field}.${sub}`),
  ]);
}

/**
 * Extrae los campos de audio de la respuesta cruda de Directus y los agrupa en HymnAudioFiles.
 * Si el campo es un objeto con `id`, se trata como AudioFileInfo resuelto; si es null/undefined, queda null.
 */
function mapAudioFiles(raw: any): HymnAudioFiles {
  const result: Record<string, AudioFileInfo | null> = {};

  for (const field of AUDIO_FIELD_NAMES) {
    const value = raw[field];
    if (value && typeof value === 'object' && value.id) {
      // Relación resuelta con sub-campos
      result[field] = {
        id: value.id,
        filename_download: value.filename_download,
        filesize: value.filesize ?? null,
        type: value.type ?? null,
      };
    } else if (typeof value === 'string' && value.length > 0) {
      // UUID sin resolver — Directus devolvió solo el ID del archivo
      const ext = field === 'midi_file' ? 'mid' : 'mp3';
      result[field] = {
        id: value,
        filename_download: `${field}.${ext}`,
        filesize: null,
        type: field === 'midi_file' ? 'audio/midi' : null,
      };
    } else {
      result[field] = null;
    }
  }

  return result as unknown as HymnAudioFiles;
}

/**
 * Normaliza texto eliminando acentos/diacríticos para búsqueda flexible.
 * "Cántico" → "Cantico", "señor" → "senor"
 */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca himnos en Directus con filtros opcionales.
 * Soporta búsqueda por nombre, letra del himno, número, himnario y categoría.
 * La búsqueda es case-insensitive y accent-insensitive (busca con y sin acentos).
 */
export async function searchHymns(filters: HymnSearchFilters): Promise<HymnSearchResult[]> {
  const client = getDirectus();
  const limit = filters.limit ?? 25;
  const offset = filters.offset ?? 0;

  // Construir filtro dinámicamente
  const filter: Record<string, any> = {
    status: { _eq: 'published' },
  };

  // Campos donde buscar (por defecto todos)
  const searchIn = filters.searchIn ?? ['name', 'number', 'letter'];

  if (filters.query) {
    const q = filters.query;
    const qNorm = stripAccents(q);
    const textConditions: any[] = [];

    if (searchIn.includes('name')) {
      textConditions.push({ name: { _icontains: q } });
      if (qNorm !== q) textConditions.push({ name: { _icontains: qNorm } });
    }
    if (searchIn.includes('letter')) {
      textConditions.push({ letter_hymn: { _icontains: q } });
      if (qNorm !== q) textConditions.push({ letter_hymn: { _icontains: qNorm } });
    }
    if (searchIn.includes('number') && /^\d+$/.test(q)) {
      textConditions.push({ hymn_number: { _eq: Number(q) } });
    }

    if (textConditions.length > 0) {
      filter._or = textConditions;
    }
  }
  if (filters.hymnNumber !== undefined) {
    filter.hymn_number = { _eq: filters.hymnNumber };
  }
  if (filters.hymnalId) {
    filter.hymnal = { _eq: filters.hymnalId };
  }
  if (filters.categoryId !== undefined) {
    filter.categories = { hymn_categories_id: { _eq: filters.categoryId } };
  }

  const fields = [
    'id',
    'name',
    'hymn_number',
    'hymnal.id',
    'hymnal.name',
    'categories.hymn_categories_id.id',
    'categories.hymn_categories_id.name',
    ...buildAudioFields(),
  ];

  try {
    const items = await client.request(
      // @ts-expect-error — Directus SDK typing con generics no resuelve bien las colecciones custom
      readItems('hymn', {
        sort: ['hymn_number', 'name'],
        fields: fields as unknown as string[],
        filter,
        limit,
        offset,
      }),
    );

    return (items as any[]).map((item) => {
      const audioFiles = mapAudioFiles(item);
      const hasAnyAudio = AUDIO_FIELD_NAMES.some((field) => audioFiles[field] !== null);

      return {
        id: item.id,
        name: item.name,
        hymn_number: item.hymn_number,
        hymnal: item.hymnal ?? null,
        categories: item.categories ?? [],
        audioFiles,
        hasAnyAudio,
      } satisfies HymnSearchResult;
    });
  } catch (error) {
    console.error('Error al buscar himnos:', error);
    throw error;
  }
}

/**
 * Obtiene datos completos de un himno para generación de PDF.
 * Incluye letra, metadata, autores, himnario y archivos de audio resueltos.
 */
export async function fetchHymnForPdf(id: string): Promise<HymnForPdf> {
  const client = getDirectus();

  const fields = [
    'id',
    'name',
    'hymn_number',
    'hymn_time_signature',
    'letter_hymn',
    'bible_text',
    'bible_reference',
    {
      hymnal: ['name', 'publisher'],
      authors: [
        'authors_id.name',
        'author_roles.author_roles_id.description',
        'author_roles.author_roles_id.rol_abbr',
      ],
    },
    ...buildAudioFields(),
  ];

  try {
    const data = (await client.request(
      readItem<any, any, any>('hymn', id as any, { fields } as any),
    )) as any;

    const audioFiles = mapAudioFiles(data);

    return {
      id: data.id,
      name: data.name,
      hymn_number: data.hymn_number ?? null,
      hymn_time_signature: data.hymn_time_signature ?? null,
      letter_hymn: data.letter_hymn ?? null,
      bible_text: data.bible_text ?? null,
      bible_reference: data.bible_reference ?? null,
      hymnal: data.hymnal ?? null,
      authors: data.authors ?? [],
      audioFiles,
    } satisfies HymnForPdf;
  } catch (error) {
    console.error('Error al obtener himno para PDF:', error);
    throw error;
  }
}

/**
 * Construye la URL de descarga de un asset de Directus a partir de su ID de archivo.
 * Si existe DIRECTUS_TOKEN, lo agrega como query param para autenticación.
 */
export function getAssetUrl(fileId: string): string {
  const baseUrl =
    process.env.DIRECTUS_URL ||
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    'http://localhost:8055';
  const token = process.env.DIRECTUS_TOKEN;
  const url = `${baseUrl}/assets/${fileId}`;
  return token ? `${url}?access_token=${token}` : url;
}
