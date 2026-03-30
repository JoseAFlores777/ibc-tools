# Phase 5: Impresión de Himnos - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 05-implementa-feature-completo-de-impresi-n-de-himnos
**Areas discussed:** Modo booklet e imposición, Orientación y formato de papel, Selección de fuente y tamaño, Filtrado de versículos

---

## Modo Booklet e Imposición

### Funcionamiento del booklet

| Option | Description | Selected |
|--------|-------------|----------|
| Booklet automático completo | El sistema calcula imposición automáticamente: reordena páginas, inserta blancos, genera PDF listo para duplex | ✓ |
| Booklet con vista previa de orden | Igual pero muestra preview del orden antes de generar | |
| Tú decides | Claude decide nivel de automatización | |

**User's choice:** Booklet automático completo
**Notes:** Ninguna

### Tamaño de papel para booklet

| Option | Description | Selected |
|--------|-------------|----------|
| Solo Carta doblada | Carta (8.5x11) doblado = 5.5x8.5 por página | ✓ |
| Carta y Media Carta | Dos opciones de tamaño | |
| Carta, Media Carta y A4 | Tres opciones incluyendo A4 internacional | |

**User's choice:** Solo Carta doblada
**Notes:** Ninguna

### Integración en wizard UI

| Option | Description | Selected |
|--------|-------------|----------|
| Nuevo modo de impresión | Selector "Modo de Impresión": Hoja Simple / Booklet | ✓ |
| Reemplazar selector de layout | Opciones descriptivas: Hoja completa, Media página, Cuadernillo | |
| Tú decides | Claude decide integración UI | |

**User's choice:** Nuevo modo de impresión
**Notes:** Ninguna

---

## Orientación y Formato de Papel

### Orientación en hoja simple

| Option | Description | Selected |
|--------|-------------|----------|
| Solo vertical | Mantener portrait como ahora | |
| Vertical y horizontal | Permitir elegir portrait o landscape | ✓ |
| Tú decides | Claude decide | |

**User's choice:** Vertical y horizontal
**Notes:** Ninguna

### Formato de papel

| Option | Description | Selected |
|--------|-------------|----------|
| Solo Carta | Papel Carta 8.5x11, estándar de la iglesia | ✓ |
| Carta y Media Carta | Dos opciones | |
| Carta, Media Carta, A4 | Tres opciones con A4 | |

**User's choice:** Solo Carta
**Notes:** Ninguna

---

## Selección de Fuente y Tamaño

### Método de selección de fuente

| Option | Description | Selected |
|--------|-------------|----------|
| Presets por estilo | 3 presets: Clásica (Adamina), Moderna (Helvetica), Legible (Helvetica grande) | ✓ |
| Selector de fuente libre | Dropdown con 4-6 fuentes + slider de tamaño | |
| Solo tamaño, fuente automática | Fuente por estilo, usuario ajusta tamaño Pequeño/Mediano/Grande | |
| Tú decides | Claude decide balance | |

**User's choice:** Presets por estilo
**Notes:** Ninguna

### Fuentes adicionales

| Option | Description | Selected |
|--------|-------------|----------|
| Ninguna adicional | Solo Adamina y Helvetica | ✓ |
| Agregar 1-2 más | Georgia, Open Sans o Roboto | |
| Tú decides | Claude decide basado en disponibilidad | |

**User's choice:** Ninguna adicional
**Notes:** Ninguna

---

## Versos y Referencia Bíblica

### Filtrado de versos del himno

| Option | Description | Selected |
|--------|-------------|----------|
| Siempre imprimir todos | Sin selección de versos, simplifica UI | ✓ |
| Permitir seleccionar versos | Checkboxes por verso para elegir cuáles incluir | |
| Tú decides | Claude decide | |

**User's choice:** Siempre imprimir todos
**Notes:** El usuario aclaró que "versículo" en el nombre de la fase se refiere a la referencia bíblica, no a los versos del himno. Los "versos" son las divisiones de la letra (I, II, III, CORO).

### Referencia bíblica en PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Incluir siempre si existe | Sin opción para el usuario, se incluye automáticamente | |
| Opción para incluir/excluir | Toggle "Incluir referencia bíblica" en Step 2, default: incluida | ✓ |
| Tú decides | Claude decide | |

**User's choice:** Opción para incluir/excluir
**Notes:** Toggle global que aplica a todos los himnos del paquete

---

## Claude's Discretion

- Algoritmo de imposición saddle-stitch
- Adaptación de componentes PDF existentes para booklet
- Tamaños exactos de fuente para cada preset
- Layout del Step 2 actualizado con nuevos controles
- Manejo de himnos largos en booklet
- Instrucciones de impresión para el usuario
- Extensiones al schema de PackageRequest y WizardState

## Deferred Ideas

None — discussion stayed within phase scope.
