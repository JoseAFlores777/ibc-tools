# Requirements: Empaquetador de Himnos

**Defined:** 2026-03-28
**Core Value:** Cualquier hermano puede armar un paquete de himnos (letras impresas + pistas de audio) listo para usar en minutos, sin depender de nadie.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Busqueda y Seleccion

- [ ] **BUSQ-01**: Usuario puede buscar himnos por numero de himno
- [ ] **BUSQ-02**: Usuario puede buscar himnos por nombre
- [ ] **BUSQ-03**: Usuario puede filtrar himnos por himnario de origen
- [ ] **BUSQ-04**: Usuario puede filtrar himnos por categoria (alabanza, adoracion, etc.)
- [ ] **BUSQ-05**: Usuario puede seleccionar multiples himnos de los resultados
- [ ] **BUSQ-06**: Usuario puede ver un resumen de los himnos seleccionados
- [ ] **BUSQ-07**: Usuario puede quitar himnos de su seleccion

### Configuracion de Impresion

- [ ] **IMPR-01**: Usuario puede elegir layout de 1 himno por pagina (carta completa)
- [ ] **IMPR-02**: Usuario puede elegir layout de 2 himnos por pagina (media carta)
- [ ] **IMPR-03**: Usuario puede elegir estilo decorado (con colores, bordes, diseno visual)
- [ ] **IMPR-04**: Usuario puede elegir estilo plano (texto minimalista, blanco y negro)

### Seleccion de Audio

- [ ] **AUDIO-01**: Usuario ve las pistas disponibles por himno (track_only, midi, soprano, alto, tenor, bass)
- [ ] **AUDIO-02**: Usuario puede seleccionar cuales pistas incluir por cada himno
- [ ] **AUDIO-03**: Solo se muestran las pistas que existen para cada himno

### Generacion y Descarga

- [ ] **GEN-01**: API route server-side genera un ZIP con los PDFs de letras
- [ ] **GEN-02**: API route incluye los archivos de audio seleccionados en el ZIP
- [ ] **GEN-03**: Usuario ve indicador de progreso durante la generacion
- [ ] **GEN-04**: Usuario descarga el ZIP generado desde el navegador

### Experiencia de Usuario

- [ ] **UX-01**: Wizard de 3 pasos: Seleccionar himnos → Configurar impresion y audio → Generar y descargar
- [ ] **UX-02**: Navegacion entre pasos (adelante/atras)
- [ ] **UX-03**: UI en espanol

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
| BUSQ-01 | - | Pending |
| BUSQ-02 | - | Pending |
| BUSQ-03 | - | Pending |
| BUSQ-04 | - | Pending |
| BUSQ-05 | - | Pending |
| BUSQ-06 | - | Pending |
| BUSQ-07 | - | Pending |
| IMPR-01 | - | Pending |
| IMPR-02 | - | Pending |
| IMPR-03 | - | Pending |
| IMPR-04 | - | Pending |
| AUDIO-01 | - | Pending |
| AUDIO-02 | - | Pending |
| AUDIO-03 | - | Pending |
| GEN-01 | - | Pending |
| GEN-02 | - | Pending |
| GEN-03 | - | Pending |
| GEN-04 | - | Pending |
| UX-01 | - | Pending |
| UX-02 | - | Pending |
| UX-03 | - | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
