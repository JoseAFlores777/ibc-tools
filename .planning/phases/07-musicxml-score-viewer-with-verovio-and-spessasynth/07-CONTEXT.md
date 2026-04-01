# Phase 7: MusicXML Score Viewer with Verovio and SpessaSynth - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Visualizador de partituras MusicXML integrado en la app. Usa Verovio para renderizar la partitura como SVG y SpessaSynth para reproducir MIDI con SoundFont, con cursor sincronizado que avanza nota por nota. El componente vive como tab de "Partituras" en el HymnExplorer y reemplaza completamente el MidiTrackPlayer basado en Tone.js.

</domain>

<decisions>
## Implementation Decisions

### Origen de datos MusicXML
- **D-01:** Los archivos MusicXML ya existen en Directus bajo la relacion `hymn -> materials -> musicxml`. No se necesita agregar campos nuevos al schema.
- **D-02:** El viewer solo aparece cuando el himno tiene un MusicXML asociado (condicional, como MIDI). Sin fallback visual si no hay partitura.
- **D-03:** Los archivos MusicXML se sirven via proxy servidor (nueva ruta API `/api/hymns/score/[fileId]`), consistente con el patron existente del proxy de audio.

### Ubicacion del componente
- **D-04:** `ScoreViewer` es un componente reutilizable (`'use client'`, dynamic import sin SSR) que se puede incrustar en cualquier contexto.
- **D-05:** Se integra en el `HymnExplorer` como un tab de "Partituras" en el detalle de cada himno. Solo se muestra si el himno tiene MusicXML.

### Reproduccion de audio y cursor
- **D-06:** SpessaSynth reemplaza completamente el MidiTrackPlayer basado en Tone.js. Toda la reproduccion MIDI migra a SpessaSynth.
- **D-07:** El cursor de la partitura se sincroniza con la reproduccion MIDI — avanza nota por nota en tiempo real (experiencia tipo MuseScore/Flat.io).
- **D-08:** El SoundFont se almacena como asset en Directus y se sirve via proxy servidor. Control total sin dependencia de CDN externo.

### Presentacion de la partitura
- **D-09:** Score completo SATB (4 voces) como vista por defecto. No hay selector de partes individuales.
- **D-10:** Auto-escala al ancho del contenedor por defecto + controles de zoom manual (botones o scroll) para ajustar.
- **D-11:** Auto-scroll suave que sigue el cursor durante la reproduccion, manteniendo la posicion actual visible.

### Claude's Discretion
- Diseno visual del tab de Partituras (spacing, bordes, colores)
- Controles de reproduccion (play/pause, seek, tempo) — layout y estilo
- Manejo de estados de carga (loading del WASM de Verovio, descarga del SoundFont)
- Fallback visual si SpessaSynth falla (reproduccion sin audio, solo cursor visual)
- Configuracion de Next.js para WASM (asyncWebAssembly en webpack)
- API de inicializacion de Verovio (depende de la version instalada)
- Estrategia de cache para SoundFont (pesado, ~30MB, deberia cachearse en cliente)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hymn Data and Existing Patterns
- `app/interfaces/Hymn.interface.ts` — HymnForPdf, HymnSearchResult, AudioFileInfo types. Needs extension for MusicXML field.
- `app/lib/directus/services/hymns.ts` — searchHymns(), fetchHymnForPdf(), audio field definitions. Needs extension to fetch materials.musicxml.
- `app/lib/directus/directus.interface.ts` — Directus auto-generated types. Contains `midi_file` field reference; `materials` relation needs verification.

### Components to Modify/Replace
- `app/components/MidiTrackPlayer.tsx` — Current Tone.js-based MIDI player to be REPLACED by SpessaSynth. Study its API (props, state, audio lifecycle) for migration.
- `app/components/HymnExplorer.tsx` — Shared hymn exploration component where the Partituras tab will be added.
- `app/empaquetador/components/HymnDetailModal.tsx` — Uses MidiTrackPlayer; will need migration to SpessaSynth.

### Audio Infrastructure (proxy pattern to replicate)
- `app/api/hymns/audio/[fileId]/route.ts` — Audio proxy pattern: server-side auth, range requests, caching. Replicate for `/api/hymns/score/[fileId]`.

### Visualizador Audio (also uses MIDI)
- `app/visualizador/components/AudioBar.tsx` — Uses audio playback; may need SpessaSynth migration if it uses MidiTrackPlayer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HymnExplorer` — componente compartido para explorar himnos; punto de integracion para el tab de Partituras
- `/api/hymns/audio/[fileId]` proxy — patron a replicar para servir MusicXML y SoundFont
- `useHymnSearch` hook — ya usado en HymnExplorer para busqueda de himnos
- `fetchHymnForPdf()` — funcion de servicio que ya fetch datos completos del himno, extender para incluir materials.musicxml
- shadcn/ui Tabs, ScrollArea, Slider, Button — disponibles para UI del viewer

### Established Patterns
- `'use client'` + `dynamic(() => import(...), { ssr: false })` — patron para componentes que usan APIs del navegador (WASM, Web Audio)
- Proxy API routes con server-side auth headers para assets de Directus
- Audio lifecycle management via refs (`useRef<HTMLAudioElement>`) — SpessaSynth usara patron similar

### Integration Points
- `app/components/HymnExplorer.tsx` — agregar tab "Partituras" condicional
- `app/api/hymns/score/[fileId]/route.ts` — nueva ruta proxy para MusicXML
- `app/api/hymns/soundfont/route.ts` — nueva ruta proxy para SoundFont (cacheable)
- `next.config.mjs` — configuracion de webpack para asyncWebAssembly
- Eliminar: `app/components/MidiTrackPlayer.tsx` y dependencias de Tone.js

</code_context>

<specifics>
## Specific Ideas

- La experiencia debe ser tipo MuseScore/Flat.io: partitura renderizada como SVG con cursor que avanza en sincronizacion con el audio MIDI
- El SoundFont se descarga una sola vez y se cachea agresivamente en el cliente (Service Worker o Cache API) dado su tamano (~30MB)
- El tab de Partituras solo se muestra cuando `hymn.materials.musicxml` existe — sin placeholder ni mensaje de "no disponible"
- Quick Start del usuario incluye caveats sobre API de Verovio (varia por version) y API de SpessaSynth — investigar versiones actuales

</specifics>

<deferred>
## Deferred Ideas

- Selector de partes individuales (ver solo Soprano, solo Tenor, etc.) — futuro enhancement
- Transposicion de la partitura — requiere motor de teoria musical, complejidad alta
- Descarga de partitura como PDF — futuro enhancement
- Modo practica con metronomo — futuro enhancement
- Anotaciones/marcas sobre la partitura — futuro enhancement

</deferred>

---

*Phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth*
*Context gathered: 2026-04-01*
