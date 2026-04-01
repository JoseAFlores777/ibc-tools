# Phase 7: MusicXML Score Viewer with Verovio and SpessaSynth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 07-musicxml-score-viewer-with-verovio-and-spessasynth
**Areas discussed:** Origen de datos MusicXML, Donde vive el viewer, Reproduccion de audio y cursor, Presentacion de la partitura

---

## Origen de datos MusicXML

| Option | Description | Selected |
|--------|-------------|----------|
| Nuevo campo en hymn | Agregar campo musicxml_file en coleccion hymn de Directus | |
| Solo assets de Directus | No modificar schema, referenciar por UUID manualmente | |
| Coleccion separada | Nueva coleccion 'scores' con relacion many-to-one a hymn | |

**User's choice:** Nuevo campo en hymn (initially), then clarified: la relacion ya existe en `hymn -> materials -> musicxml`
**Notes:** No se necesita modificar el schema de Directus, el campo ya existe.

| Option | Description | Selected |
|--------|-------------|----------|
| Opcional, viewer condicional | Solo aparece cuando el himno tiene musicxml_file | ✓ |
| Siempre visible con fallback | Tab siempre visible con mensaje si no hay MusicXML | |

**User's choice:** Opcional, viewer condicional

| Option | Description | Selected |
|--------|-------------|----------|
| Proxy servidor (como audio) | Ruta API /api/hymns/score/[fileId] | ✓ |
| Acceso publico directo | Fetch directo a DIRECTUS_URL/assets/uuid | |

**User's choice:** Proxy servidor (como audio)

---

## Donde vive el viewer

| Option | Description | Selected |
|--------|-------------|----------|
| Componente reutilizable | ScoreViewer incrustable en cualquier contexto | |
| Ruta standalone (/partituras) | Pagina dedicada a partituras | |
| Integrado en visualizador | Tab/panel en visualizador existente | |

**User's choice:** Componente reutilizable, alojado en el detalle de cada himno en el tab de partituras

| Option | Description | Selected |
|--------|-------------|----------|
| HymnExplorer (compartido) | Tab en HymnExplorer, disponible en cualquier contexto | ✓ |
| HymnDetailModal | Solo en modal del empaquetador | |
| Ambos | En HymnExplorer y HymnDetailModal | |

**User's choice:** HymnExplorer (compartido)

---

## Reproduccion de audio y cursor

| Option | Description | Selected |
|--------|-------------|----------|
| SpessaSynth solo en ScoreViewer | Coexiste con MidiTrackPlayer | |
| Reemplazar MidiTrackPlayer | Migrar toda reproduccion MIDI a SpessaSynth | ✓ |
| Tu decides | Claude evalua la mejor estrategia | |

**User's choice:** Reemplazar MidiTrackPlayer

| Option | Description | Selected |
|--------|-------------|----------|
| Si, cursor sincronizado | Cursor avanza nota por nota en la partitura | ✓ |
| No, reproduccion independiente | Partitura estatica, audio aparte | |

**User's choice:** Si, cursor sincronizado

| Option | Description | Selected |
|--------|-------------|----------|
| Asset en Directus | SoundFont en Directus via proxy | ✓ |
| CDN publico | Cargar desde CDN gratuito | |
| Archivo estatico en public/ | Incluir en build del proyecto | |

**User's choice:** Asset en Directus

---

## Presentacion de la partitura

| Option | Description | Selected |
|--------|-------------|----------|
| Score completo (SATB) | 4 voces como en partitura original | ✓ |
| Parte individual seleccionable | Usuario elige que voz ver | |
| Ambos modos | Score completo + filtro por voz | |

**User's choice:** Score completo (SATB)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-escala + zoom manual | Ajuste automatico + botones/scroll zoom | ✓ |
| Solo auto-escala | Solo ajuste automatico, sin zoom | |
| Tu decides | Claude determina el approach | |

**User's choice:** Auto-escala + zoom manual

| Option | Description | Selected |
|--------|-------------|----------|
| Si, auto-scroll con cursor | Scroll suave para mantener cursor visible | ✓ |
| No, scroll manual | Usuario hace scroll manualmente | |

**User's choice:** Si, auto-scroll con cursor

---

## Claude's Discretion

- Diseno visual del tab de Partituras
- Controles de reproduccion (layout y estilo)
- Estados de carga (WASM, SoundFont)
- Fallback si SpessaSynth falla
- Config de Next.js para WASM
- API de inicializacion de Verovio
- Cache strategy para SoundFont

## Deferred Ideas

- Selector de partes individuales (solo Soprano, solo Tenor, etc.)
- Transposicion de partitura
- Descarga de partitura como PDF
- Modo practica con metronomo
- Anotaciones sobre la partitura
