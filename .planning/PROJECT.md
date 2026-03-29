# Empaquetador de Himnos

## What This Is

Una herramienta web dentro de ibc-tools que permite a cualquier miembro de la iglesia seleccionar himnos, configurar como se imprimen las letras (layout, estilo, tamano), elegir las pistas de audio deseadas, y descargar un ZIP con los PDFs de letras y archivos de audio. Vive como una nueva ruta en la app Next.js existente y se conecta a Directus CMS para obtener los datos de himnos.

## Core Value

Cualquier hermano puede armar un paquete de himnos (letras impresas + pistas de audio) listo para usar en minutos, sin depender de nadie.

## Requirements

### Validated

- Directus CMS backend con coleccion `hymn` completa (letras, pistas, MIDI, voces, categorias, himnarios, autores) — existing
- PDF generation con `@react-pdf/renderer` para himnos — existing
- shadcn/ui component library con Radix + Tailwind — existing
- Directus SDK client singleton y service layer — existing
- Zod + react-hook-form para formularios — existing
- Server-side PDF rendering con renderToBuffer() para himnos (1-per-page y 2-per-page, decorated y plain) — Validated in Phase 2: PDF Generation for Server-Side Rendering
- HTML parser para letras de himnos (parseHymnHtml, extractPlainText) — Validated in Phase 1: Foundation and Data Layer
- Servicio fetchHymnForPdf y searchHymns para consultas de himnos — Validated in Phase 1: Foundation and Data Layer
- API route GET /api/hymns/search con filtros (numero, nombre, himnario, categoria) — Validated in Phase 3: API Routes and ZIP Streaming
- API route POST /api/hymns/package genera ZIP streaming con PDFs y archivos de audio — Validated in Phase 3: API Routes and ZIP Streaming
- Streaming ZIP via archiver + Web ReadableStream bridge (sin buffering completo en memoria) — Validated in Phase 3: API Routes and ZIP Streaming

### Active

None — all v1 requirements implemented. Pending human UAT for Phase 4 (4 items).

### Recently Validated (Phase 4)

- Wizard UI de 3 pasos en /empaquetador con busqueda, seleccion, configuracion y descarga — Validated in Phase 4
- Selector de himnos con filtros (himnario, categoria, busqueda por nombre/numero) — Validated in Phase 4
- Vista de seleccion multi-himno con sidebar/drawer y contador — Validated in Phase 4
- Configurador de impresion (layout 1/2 por pagina, estilo decorado/plano) — Validated in Phase 4
- Selector de pistas de audio por himno con accordion y checkboxes — Validated in Phase 4
- Descarga de ZIP desde el navegador con indicador de progreso y toasts — Validated in Phase 4

### Out of Scope

- Autenticacion de usuarios — la herramienta es publica para cualquier hermano
- Guardar paquetes/favoritos en Directus — v2 si hay demanda
- Edicion de letras de himnos — se usan las letras tal como estan en Directus
- Streaming de audio — solo descarga de archivos
- Creacion de programas de culto (con actividades/responsables) — ya existe en /pdf-gen/programs/

## Context

- **Codebase existente:** Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **Datos en Directus:** Coleccion `hymn` con campos `letter_hymn` (texto de letra), `track_only` (pista audio), `midi_file` (MIDI), voces individuales (`soprano_voice`, `alto_voice`, `tenor_voice`, `bass_voice`), relaciones a `hymn_categories`, `hymnals`, `authors`
- **PDF existente:** Ya hay componentes PDF para himnos en `app/components/pdf-components/` — se pueden reutilizar/adaptar
- **Schema completo:** `contexts/directus.json` contiene el schema de Directus para referencia
- **Idioma UI:** Espanol (es la app de la iglesia IBC)

## Constraints

- **Tech stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui — ya establecido
- **PDF engine**: `@react-pdf/renderer` — ya en uso, mantener consistencia
- **ZIP generation**: Server-side via API route (no client-side) — descarga directa
- **Backend**: Directus CMS existente — no se modifica el schema, solo se consume
- **Archivos de audio**: Son UUIDs que apuntan a `directus_files` — se descargan del servidor Directus

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ZIP server-side via API route | Archivos de audio viven en Directus server, mas eficiente generar ZIP ahi | Phase 3: POST /api/hymns/package with archiver streaming |
| Wizard multi-step (3 pasos) | Simplifica la UX para usuarios no tecnicos, flujo guiado | Phase 4: /empaquetador with WizardStepper, Framer Motion transitions |
| Reutilizar componentes PDF existentes | Ya hay HymnPagePdf/HymnDocPdf, adaptarlos para los nuevos layouts | Phase 2: Created new server-safe components (HymnPageDecorated, HymnPagePlain, HymnPageTwoUp) alongside existing client-side ones |
| Filtros avanzados con multiples criterios | Hay muchos himnos, necesitan encontrar rapidamente lo que buscan | Phase 4: Select dropdowns for hymnal/category, debounced search |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after Phase 4 completion (all v1 phases complete)*
