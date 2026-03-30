# Phase 5: Impresión de Himnos — Hoja Simple, Booklet, Orientación/Fuente/Formato/Versículo - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Feature completo de impresión que extiende el empaquetador existente (`/empaquetador`) con dos modos de impresión: **Hoja Simple** (impresión directa, ya parcialmente existente) y **Booklet** (imposición saddle-stitch para encuadernación con grapas al centro). Agrega opciones de orientación de página (vertical/horizontal), presets de fuente/tamaño, toggle de referencia bíblica, y formato de papel Carta. Modifica el wizard Step 2 para incluir estas nuevas opciones de configuración.

</domain>

<decisions>
## Implementation Decisions

### Modo Booklet e Imposición
- **D-01:** Booklet automático completo — el sistema calcula la imposición automáticamente: reordena páginas en orden saddle-stitch, inserta páginas en blanco si el total no es múltiplo de 4, genera PDF listo para imprimir en duplex. El usuario solo elige "Booklet" y listo.
- **D-02:** Solo papel Carta (8.5x11") para booklet. Cada hoja se dobla a la mitad, resultando en páginas de 5.5x8.5". No ofrecer otros tamaños para booklet.
- **D-03:** Nuevo selector "Modo de Impresión" en Step 2 del wizard: **Hoja Simple** (comportamiento actual) | **Booklet**. Si elige Booklet, las opciones de layout se adaptan al contexto de cuadernillo (1 himno por página booklet = media carta doblada).

### Orientación y Formato de Papel
- **D-04:** Opciones de orientación para modo Hoja Simple: **Vertical** (portrait, default) y **Horizontal** (landscape). El modo Booklet maneja orientación internamente (landscape para imposición).
- **D-05:** Solo papel Carta (Letter 8.5x11") como formato. No ofrecer Media Carta ni A4. Simplifica el UI y es el papel estándar de la iglesia.

### Selección de Fuente y Tamaño
- **D-06:** Presets de fuente por estilo, no selector libre. Tres presets: "Clásica" (Adamina serif, tamaño estándar actual), "Moderna" (Helvetica sans-serif, tamaño estándar), "Legible" (Helvetica sans-serif, tamaño grande para lectura fácil). Cada preset define font family + escalas de tamaño.
- **D-07:** No agregar fuentes adicionales más allá de Adamina y Helvetica (ya registradas). Menos archivos, menos complejidad.

### Versos y Referencia Bíblica
- **D-08:** Todos los versos del himno (I, II, III, CORO, etc.) se imprimen siempre. No hay selección de versos — simplifica el UI considerablemente.
- **D-09:** Referencia bíblica (bible_text + bible_reference) con toggle incluir/excluir en Step 2. Default: incluida. Label: "Incluir referencia bíblica". Si se desactiva, el PDF omite el texto y cita bíblica.

### Claude's Discretion
- Algoritmo exacto de imposición saddle-stitch (orden de páginas para el PDF booklet)
- Cómo adaptar los componentes PDF existentes (HymnPageDecorated, HymnPagePlain, HymnPageTwoUp) para booklet vs crear nuevos
- Tamaños de fuente exactos para cada preset (Clásica, Moderna, Legible)
- Cómo escalar los tokens de diseño de pdf-tokens.ts para las nuevas combinaciones
- Layout del Step 2 actualizado — ubicación de los nuevos controles (modo impresión, orientación, preset fuente, toggle bíblico)
- Cómo manejar himnos largos que no caben en una página booklet (tamaño reducido)
- Instrucciones de impresión para el usuario (ej. "Imprimir en ambos lados, borde corto" para booklet)
- Extensiones al schema de PackageRequest y WizardState para las nuevas opciones

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF Components (modificar/extender)
- `app/components/pdf-components/pdf-pages/HymnPageDecorated.tsx` — Página decorada 1-per-page, referencia para layout con header/footer/logo
- `app/components/pdf-components/pdf-pages/HymnPagePlain.tsx` — Página plana 1-per-page, referencia para layout minimalista
- `app/components/pdf-components/pdf-pages/HymnPageTwoUp.tsx` — Layout 2-per-page lado a lado, base para entender columnas
- `app/components/pdf-components/shared/pdf-tokens.ts` — Tokens de diseño: dimensiones, márgenes, escalas de fuente, colores
- `app/components/pdf-components/shared/pdf-fonts.ts` — Registro de fuentes (Adamina)

### Render Pipeline
- `app/lib/pdf/render-hymn-pdf.ts` — `renderHymnPdf()`: orquesta rendering con layout/style, genera buffer. Debe extenderse con nuevas opciones.
- `app/lib/pdf/html-to-pdf.ts` — `parseHymnHtml()` y `extractPlainText()` para parsing de letras

### API y Schema
- `app/api/hymns/package/route.ts` — POST endpoint que genera ZIP, debe aceptar nuevas opciones
- `app/lib/zip/zip.schema.ts` — Schema Zod de PackageRequest, debe extenderse
- `app/lib/zip/generate-hymn-zip.ts` — Generación de ZIP streaming, llama a renderHymnPdf

### Wizard UI (modificar Step 2)
- `app/empaquetador/components/StepConfiguracion.tsx` — Step 2 actual con layout/style/audio, agregar nuevos controles
- `app/empaquetador/hooks/useWizardReducer.ts` — Estado del wizard, agregar nuevos campos
- `app/empaquetador/lib/buildPackageRequest.ts` — Construye request body, extender con nuevas opciones

### Interfaces
- `app/interfaces/Hymn.interface.ts` — HymnForPdf, ParsedVerse, HymnSearchResult

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderHymnPdf()` ya soporta dynamic imports de componentes por layout/style — extender con nuevas combinaciones
- `pdf-tokens.ts` centraliza escalas de fuente por estilo y layout — agregar presets nuevos aquí
- `pdf-fonts.ts` ya registra Adamina — patrón listo para agregar más si se necesita en el futuro
- `useWizardReducer` con patrón reducer — agregar nuevas acciones para modo impresión, orientación, preset fuente, toggle bíblico
- `StepConfiguracion` ya tiene RadioGroup para layout y estilo — patrón replicable para nuevos selectores
- `PackageRequestSchema` (Zod) — extender con campos opcionales para backward compatibility

### Established Patterns
- Componentes PDF usan `StyleSheet.create()` de react-pdf con tokens centralizados
- Dynamic imports en renderHymnPdf para lazy-load de componentes de página
- Wizard state en useReducer con acciones tipadas
- Schema Zod en zip.schema.ts para validación de request
- Streaming ZIP con archiver + PassThrough para Node→Web stream

### Integration Points
- `StepConfiguracion.tsx` — agregar controles de modo impresión, orientación, preset fuente, toggle bíblico
- `useWizardReducer.ts` — nuevos campos en WizardState y nuevas acciones
- `buildPackageRequest.ts` — mapear nuevos campos del wizard al request body
- `zip.schema.ts` — extender PackageRequestSchema con nuevos campos
- `render-hymn-pdf.ts` — aceptar nuevas opciones, implementar lógica de booklet/imposición
- `pdf-tokens.ts` — agregar presets de fuente y dimensiones para booklet

</code_context>

<specifics>
## Specific Ideas

- Booklet debe ser "fire and forget" — el usuario elige booklet y el PDF sale listo para imprimir duplex y engrapar. Sin preview de orden de páginas.
- Los presets de fuente deben tener nombres descriptivos en español: "Clásica", "Moderna", "Legible" — no nombres técnicos como "Serif 12pt".
- El toggle de referencia bíblica es global (aplica a todos los himnos del paquete), no por himno individual.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-implementa-feature-completo-de-impresi-n-de-himnos-modo-hoja-simple-modo-booklet-con-imposici-n-saddle-stitch-opciones-de-orientaci-n-fuente-formato-vers-culo*
*Context gathered: 2026-03-30*
