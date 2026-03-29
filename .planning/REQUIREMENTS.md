# Requirements: Empaquetador de Himnos

**Defined:** 2026-03-28
**Core Value:** Cualquier hermano puede armar un paquete de himnos (letras impresas + pistas de audio) listo para usar en minutos, sin depender de nadie.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Busqueda y Seleccion

- [x] **BUSQ-01**: Usuario puede buscar himnos por numero de himno
- [x] **BUSQ-02**: Usuario puede buscar himnos por nombre
- [x] **BUSQ-03**: Usuario puede filtrar himnos por himnario de origen
- [x] **BUSQ-04**: Usuario puede filtrar himnos por categoria (alabanza, adoracion, etc.)
- [x] **BUSQ-05**: Usuario puede seleccionar multiples himnos de los resultados
- [x] **BUSQ-06**: Usuario puede ver un resumen de los himnos seleccionados
- [x] **BUSQ-07**: Usuario puede quitar himnos de su seleccion

### Configuracion de Impresion

- [x] **IMPR-01**: Usuario puede elegir layout de 1 himno por pagina (carta completa)
- [x] **IMPR-02**: Usuario puede elegir layout de 2 himnos por pagina (media carta)
- [x] **IMPR-03**: Usuario puede elegir estilo decorado (con colores, bordes, diseno visual)
- [x] **IMPR-04**: Usuario puede elegir estilo plano (texto minimalista, blanco y negro)

### Seleccion de Audio

- [x] **AUDIO-01**: Usuario ve las pistas disponibles por himno (track_only, midi, soprano, alto, tenor, bass)
- [x] **AUDIO-02**: Usuario puede seleccionar cuales pistas incluir por cada himno
- [x] **AUDIO-03**: Solo se muestran las pistas que existen para cada himno

### Generacion y Descarga

- [x] **GEN-01**: API route server-side genera un ZIP con los PDFs de letras
- [x] **GEN-02**: API route incluye los archivos de audio seleccionados en el ZIP
- [x] **GEN-03**: Usuario ve indicador de progreso durante la generacion
- [x] **GEN-04**: Usuario descarga el ZIP generado desde el navegador

### Experiencia de Usuario

- [x] **UX-01**: Wizard de 3 pasos: Seleccionar himnos -> Configurar impresion y audio -> Generar y descargar
- [x] **UX-02**: Navegacion entre pasos (adelante/atras)
- [x] **UX-03**: UI en espanol

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Busqueda Avanzada

- **BUSQ-08**: Usuario puede buscar texto dentro de la letra del himno (full-text search)
- **BUSQ-09**: Usuario puede filtrar himnos por autor/compositor

### Opciones Adicionales

- **IMPR-05**: Usuario puede elegir layout de 4 himnos por pagina (cuarto de carta)
- **IMPR-06**: Usuario puede elegir orientacion de pagina (vertical/horizontal)
- **IMPR-07**: Usuario puede elegir tamano de papel (carta, media carta, A4)
- **AUDIO-04**: Usuario puede aplicar seleccion de pistas a todos los himnos de una vez (batch)
- **GEN-05**: Usuario puede elegir PDFs individuales por himno en vez de combinado

### Extras

- **EXTRA-01**: Preview de letra del himno antes de agregarlo a la seleccion
- **EXTRA-02**: Mostrar referencia biblica y texto en el PDF impreso
- **EXTRA-03**: Mostrar creditos de autor/compositor en el PDF impreso
- **EXTRA-04**: Guardar paquetes favoritos (requiere autenticacion)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Autenticacion de usuarios | Herramienta publica, sin cuentas |
| Edicion de letras de himnos | Directus es la fuente de verdad |
| Streaming/reproduccion de audio | Solo descarga, usuarios usan su reproductor |
| Acordes / partituras | Dominio diferente, complejidad enorme |
| Transposicion musical | Requiere motor de teoria musical |
| Planificacion de cultos | Ya existe en /pdf-gen/programs/ |
| Conversion de formatos de audio | Archivos se sirven en formato original |
| Compartir paquetes socialmente | Usuarios comparten ZIP por WhatsApp/email |
| Soporte offline / PWA | El ZIP es el artefacto offline |
| Impresion directa desde navegador | El PDF es el artefacto listo para imprimir |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUSQ-01 | Phase 4 | Complete |
| BUSQ-02 | Phase 4 | Complete |
| BUSQ-03 | Phase 4 | Complete |
| BUSQ-04 | Phase 4 | Complete |
| BUSQ-05 | Phase 4 | Complete |
| BUSQ-06 | Phase 4 | Complete |
| BUSQ-07 | Phase 4 | Complete |
| IMPR-01 | Phase 2 | Complete |
| IMPR-02 | Phase 2 | Complete |
| IMPR-03 | Phase 2 | Complete |
| IMPR-04 | Phase 2 | Complete |
| AUDIO-01 | Phase 4 | Complete |
| AUDIO-02 | Phase 4 | Complete |
| AUDIO-03 | Phase 4 | Complete |
| GEN-01 | Phase 3 | Complete |
| GEN-02 | Phase 3 | Complete |
| GEN-03 | Phase 3 | Complete |
| GEN-04 | Phase 3 | Complete |
| UX-01 | Phase 4 | Complete |
| UX-02 | Phase 4 | Complete |
| UX-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
