import type { HymnForPdf, ParsedVerse, HymnAudioFiles } from '@/app/interfaces/Hymn.interface';

const nullAudio: HymnAudioFiles = {
  track_only: null,
  midi_file: null,
  soprano_voice: null,
  alto_voice: null,
  tenor_voice: null,
  bass_voice: null,
};

export const sampleHymnForPdf: HymnForPdf = {
  id: 'test-hymn-001',
  name: 'Cuan Grande Es El',
  hymn_number: 40,
  hymn_time_signature: '4/4',
  letter_hymn: '<p>CORO</p><p>Cuan grande es El<br/>Cuan grande es El</p>',
  bible_text: 'Porque de tal manera amo Dios al mundo...',
  bible_reference: 'Juan 3:16',
  hymnal: { name: 'Himnario Bautista', publisher: 'Casa Bautista de Publicaciones' },
  authors: [
    {
      authors_id: { name: 'Stuart K. Hine' },
      author_roles: [
        { author_roles_id: { description: 'Autor de letra', rol_abbr: 'L' } },
      ],
    },
  ],
  audioFiles: nullAudio,
};

export const sampleHymnMinimal: HymnForPdf = {
  id: 'test-hymn-002',
  name: 'Himno Sin Detalles',
  hymn_number: null,
  hymn_time_signature: null,
  letter_hymn: '<p>I</p><p>Una linea simple</p>',
  bible_text: null,
  bible_reference: null,
  hymnal: null,
  authors: [],
  audioFiles: nullAudio,
};

export const sampleVersesFull: ParsedVerse[] = [
  { type: 'title', lines: [{ text: 'CORO' }] },
  { type: 'verse', lines: [
    { text: 'Cuan grande es El', bold: false },
    { text: 'Cuan grande es El', bold: false },
  ]},
  { type: 'title', lines: [{ text: 'I' }] },
  { type: 'verse', lines: [
    { text: 'Senor mi Dios, al contemplar los cielos', bold: false },
    { text: 'El firmamento y las estrellas mil', bold: false },
  ]},
];

export const sampleVersesMinimal: ParsedVerse[] = [
  { type: 'title', lines: [{ text: 'I' }] },
  { type: 'verse', lines: [{ text: 'Una linea simple' }] },
];

/** Long hymn for overflow testing (8 verses) */
export const sampleVersesLong: ParsedVerse[] = Array.from({ length: 8 }, (_, i) => ([
  { type: 'title' as const, lines: [{ text: i === 0 ? 'CORO' : String(i) }] },
  { type: 'verse' as const, lines: Array.from({ length: 4 }, (_, j) => ({
    text: `Linea ${j + 1} del verso ${i + 1} con texto suficiente para probar`,
  }))},
])).flat();
