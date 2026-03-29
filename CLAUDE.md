# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ibc-tools** is the internal tools web app for Iglesia Bautista El Calvario (IBC). It is a Next.js 16 app (React 19, App Router) that fetches data from a Directus CMS backend and generates PDF documents for church worship programs and hymns using `@react-pdf/renderer`.

The primary language for UI text is Spanish.

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build (standalone output for Docker)
- `npm run lint` — ESLint
- `npm start` — start production server

## Architecture

### Data Layer

- **Directus CMS** is the headless backend. The SDK client is a singleton in `app/lib/directus.tsx` (`getDirectus()`).
- Directus types are auto-generated in `app/lib/directus/directus.interface.ts` — the `CustomDirectusTypes` union at the bottom maps every collection.
- Service functions live under `app/lib/directus/services/` (e.g., `events.ts`).
- Server-side env var `DIRECTUS_URL` is preferred; `NEXT_PUBLIC_DIRECTUS_URL` is the browser fallback.

### Routes (App Router)

| Route | Purpose |
|---|---|
| `/` | Landing page with social links |
| `/horarios` | Church events schedule (SSR, cached 5 min via `unstable_cache`) |
| `/cards` | shadcn/ui component demo page |
| `/pdf-gen/hymns/[id]` | PDF view for a single hymn |
| `/pdf-gen/programs/[id]` | PDF view for a worship program with activities, hymns, and responsible persons |
| `/api/events` | JSON API endpoint for church events (force-dynamic, 5 min s-maxage) |

### PDF Generation

`@react-pdf/renderer` components live in `app/components/pdf-components/`:
- `pdf-documents/` — full document wrappers (`HymnDocPdf`, `ProgramDocPdf`)
- `pdf-pages/` — individual page layouts (`HymnPagePdf`, `ProgramPagePdf`)

PDF pages are server-rendered: the route fetches data from Directus, then renders the `@react-pdf` document inside a `BodyProviders` wrapper.

### UI Components

- **shadcn/ui** (Radix + Tailwind) lives under `app/lib/shadcn/ui/`. The barrel export is `@/lib/shadcn/ui`.
- `cn()` utility: `app/lib/shadcn/utils.ts` (clsx + tailwind-merge).
- Path aliases: `@/*` → project root, `@/lib/*` → `app/lib/*`.

### Key Domain Models (Directus collections)

- `hymn` — hymns with authors, categories, hymnal references, voice tracks, MIDI files
- `programs` — worship programs containing ordered `program_activities`
- `program_activities` — individual items in a program (linked to a hymn and a responsible `brother`)
- `church_events` — events with locations, recurrence, audiences, tags
- `brothers` — church members assigned to program activities

### CI/CD

Jenkins pipeline (Jenkinsfile): builds a Docker image with standalone Next.js output, pushes to Docker Hub on `main`, then triggers Dokploy redeploy. `NEXT_PUBLIC_*` env vars are baked into the image at build time via Docker build args.

### Chatwoot Widget

Loaded conditionally in production in `app/layout.tsx` when `NEXT_PUBLIC_CHATWOOT_BASE_URL` and `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` are set.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Empaquetador de Himnos**

Una herramienta web dentro de ibc-tools que permite a cualquier miembro de la iglesia seleccionar himnos, configurar como se imprimen las letras (layout, estilo, tamano), elegir las pistas de audio deseadas, y descargar un ZIP con los PDFs de letras y archivos de audio. Vive como una nueva ruta en la app Next.js existente y se conecta a Directus CMS para obtener los datos de himnos.

**Core Value:** Cualquier hermano puede armar un paquete de himnos (letras impresas + pistas de audio) listo para usar en minutos, sin depender de nadie.

### Constraints

- **Tech stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui — ya establecido
- **PDF engine**: `@react-pdf/renderer` — ya en uso, mantener consistencia
- **ZIP generation**: Server-side via API route (no client-side) — descarga directa
- **Backend**: Directus CMS existente — no se modifica el schema, solo se consume
- **Archivos de audio**: Son UUIDs que apuntan a `directus_files` — se descargan del servidor Directus
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - Full codebase, strict mode enabled
- JavaScript (ES2017 target) - Configuration files and build scripts
- JSX/TSX - React component syntax
## Runtime
- Node.js 20.x (node:20-bookworm-slim)
- npm (package manager)
- npm with lockfile (`package-lock.json`)
- Legacy peer deps enabled in Docker build for compatibility
## Frameworks
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering
- shadcn/ui (Radix + Tailwind) - Component library built on atomic primitives
- Tailwind CSS 3.4.1 - Utility-first CSS
- PostCSS 8.x - CSS transformation
- tailwind-merge 2.5.2 - Smart class merging utility
- tailwindcss-animate 1.0.7 - Animation utilities
- @react-pdf/renderer 3.4.4 - Server-side PDF rendering from React components
- react-hook-form 7.52.2 - Lightweight form state management
- @hookform/resolvers 3.9.0 - Schema validation adapters
- Zod 3.23.8 - TypeScript-first schema validation
- Headless UI - Unstyled, accessible components
- Heroicons 2.1.5 - Heroicons icon set integration
- Lucide React 0.429.0 - Icon library
- Iconify React 6.0.2 - Icon system with dynamic loading
- Framer Motion 11.11.1 - Animation library
- Embla Carousel 8.2.0 - Carousel/slider component
- Sonner 1.5.0 - Toast notification system
- Vaul 0.9.1 - Drawer component
- cmdk 1.0.0 - Command palette component
- input-otp 1.2.4 - OTP input component
- react-resizable-panels 2.1.1 - Resizable panel layout
- react-day-picker 8.10.1 - Date picker component
- Recharts 2.12.7 - Charting library built on React components
- date-fns 3.6.0 - Date manipulation and formatting
- clsx 2.1.1 - Conditional class merging
- class-variance-authority 0.7.0 - Type-safe CSS variants
- file-saver 2.0.5 - File download utility
- sharp 0.33.5 - Image processing and optimization
- cors 2.8.5 - CORS middleware
- next-themes 0.3.0 - Light/dark mode theme switching
## Key Dependencies
- @directus/sdk 17.0.0 - Headless CMS backend client
- ESLint 8.x - Code linting
- Prettier 3.3.3 - Code formatting
- TypeScript (dev) 5.x - Type checking
## Configuration
- `tsconfig.json` - Strict mode enabled, path aliases configured
- Target: ES2017
- Module system: esnext with bundler resolution
- Config: `.eslintrc.json` (minimal, extends Next.js config)
- Config: `.prettierrc` (minimal configuration)
- `next.config.mjs` - Next.js configuration
- `postcss.config.mjs` - Tailwind integration
- `tailwind.config.ts` - Form plugin included (@tailwindcss/forms)
## Environment Configuration
- `NEXT_PUBLIC_DIRECTUS_URL` - Directus backend URL (exposed to browser)
- `NEXT_PUBLIC_DIRECTUS_HOST` - Alternative Directus hostname
- `NEXT_PUBLIC_CHATWOOT_BASE_URL` - Chatwoot widget server URL (exposed to browser)
- `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` - Chatwoot authentication token (exposed to browser)
- `DIRECTUS_URL` - Server-side Directus backend URL (preferred over NEXT_PUBLIC variant)
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `NEXT_CACHE_DIR=/tmp/next-cache`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
## Platform Requirements
- Node.js 20.x with npm
- Git for version control
- Docker for local containerization (optional)
- Docker container (Node.js 20-bookworm-slim base)
- Port 3000 exposure
- Curl for healthchecks (included in production image)
- Jenkins with Docker agent
- Docker Hub credentials for image push
- Dokploy webhook endpoint for deployment trigger
- Directus CMS (headless backend)
- Chatwoot (customer support widget)
- Analitycs.joseiz.com (product analytics)
- S3-compatible storage (s3.joseiz.com)
## Build Output
- **Format:** Standalone Next.js output (optimized for Docker)
- **Output directory:** `.next/standalone/`
- **Static assets:** `.next/static/`
- **Public files:** `public/`
- **Entry:** `server.js` (executed in container)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase with `.tsx` extension (e.g., `ThemeButton.tsx`, `HorariosClient.tsx`)
- Service/utility functions: camelCase with `.ts` extension (e.g., `events.ts`, `directus.tsx`)
- Interfaces/types: PascalCase with `.interface.ts` or `.ts` suffix (e.g., `Program.interface.ts`, `TranslationObject.ts`)
- Directories: kebab-case for routes (`/pdf-gen/hymns/`, `/api/events/`), camelCase for feature folders (`app/components/`, `app/lib/`)
- Regular functions: camelCase (e.g., `formatTime12`, `parseRecurrence`, `getDirectus`)
- React hooks (custom): camelCase with `use` prefix (e.g., `useCountdown`)
- Event handlers: camelCase with descriptive names (e.g., `downloadICS`, `toggleMenu`)
- Async functions: camelCase (e.g., `fetchChurchEvents`, `getHymn`, `getAssetUrl`)
- Constants: camelCase (e.g., `WEEKDAY_MAP_ICS`, `WEEKDAY_ES_PLURAL`, `WEEKDAY_ES_SHORT`)
- State variables: camelCase (e.g., `darkMode`, `events`, `error`)
- Props interfaces: PascalCase ending with `Props` (e.g., `NavbarProps`, `Props`)
- Type unions/mapped types: PascalCase (e.g., `ChurchEventListItem`, `Recurrence`)
- Interfaces: PascalCase with `interface` keyword (e.g., `ProgramData`, `ProgramActivity`, `ActivityHymn`)
- Type definitions: PascalCase with `type` keyword
- Discriminated unions: PascalCase fields with literal values (e.g., `frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'`)
## Code Style
- Formatter: Prettier v3.3.3
- Key settings:
- Linter: ESLint v8 with Next.js core web vitals config
- Config file: `.eslintrc.json`
- Extends: `next/core-web-vitals`
- Uses default Next.js rules for best practices
## Import Organization
- `@/*` → project root (`./`)
- `@/lib/*` → `./app/lib/*`
- All imports use forward slashes
- No relative path crawling (prefer aliases)
## Error Handling
- Try-catch blocks for async operations (data fetching, Directus queries)
- Log errors with `console.error()` including descriptive context
- Re-throw errors to propagate them upstream in server functions
- Client-side error state via `useState<string | null>(null)` for user feedback
## Logging
- Use `console.error()` for errors with descriptive message
- Use `console.log()` for diagnostic output (function results, data received)
- Use `console.warn()` for non-fatal issues (missing expected config)
- Always include context: `console.error('Failed operation context:', error)`
- Log at function level, not in inline conditionals
## Comments
- Complex business logic (e.g., recurrence calculation in `HorariosClient.tsx`)
- Non-obvious algorithm decisions or workarounds
- Explanations of why something is done a certain way (not what it does)
- Spanish comments preferred to match codebase and domain language
- Not consistently used; prefer clear function signatures with types
- When used, document parameters, return type, and purpose
- Example from codebase (missing but recommended):
## Function Design
- Keep functions small and focused (100-300 lines for complex utilities)
- Complex logic extracted to helper functions (e.g., `formatRecurrenceLabel`, `getNextOccurrence`)
- Long client components (600+ lines) acceptable for isolated feature pages (e.g., `HorariosClient.tsx`)
- Use object parameters for multiple arguments: `{ limit?: number }`
- Spread destructuring in function declarations: `({ children }: Props) =>`
- Optional fields use `?` and provide defaults: `const limit = options?.limit ?? 50`
- Type-annotated return values: `Promise<ActivityHymn>`, `Date | null`
- Use nullish coalescing (`??`) over logical OR (`||`) for defaults
- Throw errors from async functions rather than returning error states
- Return null or `[]` for empty collections rather than error values
## Module Design
- Named exports for utilities and services: `export function fetchChurchEvents(...)`
- Default exports for React components: `export default function HorariosClient(...)`
- Default exports for config objects: `export default getDirectus`
- Explicit type exports: `export type SiteConfig = typeof siteConfig`
- Used in `app/lib/shadcn/ui/` for component library re-export
- Single import for convenience: `import { Button, Card, ... } from '@/lib/shadcn/ui'`
- Not used for service modules (import directly from service)
## React & Next.js Specific
- Typed with `React.FC` for functional components with explicit props type
- Example: `const ThemeButton: React.FC = () => { ... }`
- Props interfaces named `ComponentNameProps`
- `'use client'` at top of file for client-side components
- `'use server'` not used (all async functions are implicit server functions)
- Used consistently in component files, not in utility files
- Server components by default (RSC first)
- Client-side: event handlers, hooks (useState, useEffect), browser APIs
- Server-side: data fetching, Directus queries, API routes
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server-first architecture: Most pages are server components that fetch from Directus CMS at request time
- Hybrid rendering: Pages use `force-dynamic` with 5-minute ISR caching via `unstable_cache` and `revalidate`
- Document generation: PDF pages rendered server-side using `@react-pdf/renderer`
- Client interactivity: Limited to event display and component demos; most data fetch happens server-side
## Layers
- Purpose: UI components rendered as Server Components and Client Components (marked with `'use client'`)
- Location: `app/` pages and `app/components/`
- Contains: Page components (`page.tsx`), layout wrappers, shadcn/ui components, PDF document renderers
- Depends on: Service Layer (Directus services), domain models (interfaces)
- Used by: Next.js router
- Purpose: Encapsulate Directus CMS interactions and business logic
- Location: `app/lib/directus/services/`
- Contains: Functions like `fetchChurchEvents()` that wrap SDK calls with typing and field selection
- Depends on: Data Layer (Directus SDK client)
- Used by: Pages and API routes
- Purpose: Directus CMS client initialization and type definitions
- Location: `app/lib/directus.tsx` (singleton client), `app/lib/directus/directus.interface.ts` (auto-generated types)
- Contains: Directus SDK client factory, TypeScript interfaces for collections
- Depends on: `@directus/sdk` package
- Used by: Service Layer
- Purpose: JSON endpoints for client-side requests
- Location: `app/api/`
- Contains: Route handlers that call services and return JSON responses
- Depends on: Service Layer
- Used by: Client-side code, external services
- Purpose: Reusable UI primitives and compound components
- Location: `app/lib/shadcn/ui/` (shadcn/ui components), `app/lib/shadcn/components/` (custom components)
- Contains: Accordion, Button, Card, Dialog, Separator, ScrollArea, Badge, etc. from Radix UI + Tailwind CSS
- Depends on: `@radix-ui/*` packages, Tailwind CSS
- Used by: Page components, PDF components
- Purpose: Server-rendered PDF documents for hymns and worship programs
- Location: `app/components/pdf-components/`
- Contains: `pdf-documents/` (document wrappers like `HymnDocPdf`), `pdf-pages/` (page layouts like `HymnPagePdf`)
- Depends on: `@react-pdf/renderer`, domain models, assets (fonts, images)
- Used by: PDF generation routes (`/pdf-gen/hymns/[id]`, `/pdf-gen/programs/[id]`)
## Data Flow
- No global state management (Redux, Zustand, Context) used
- Local component state via `useState` in client components (e.g., `HorariosClient` menu toggle)
- Server-side caching via Next.js `unstable_cache` with 5-minute revalidate window
- Directus SDK caching policy: `cache: 'no-store'` (no browser cache)
## Key Abstractions
- Purpose: Lazy-initialized SDK client shared across requests
- Examples: `app/lib/directus.tsx` exports `getDirectus()`
- Pattern: Module-level `_client` variable; checks for existence before creating
- Purpose: Encapsulate Directus queries with type-safe field selection
- Examples: `fetchChurchEvents()` in `app/lib/directus/services/events.ts`
- Pattern: Async functions that return typed data; use SDK's `readItems()` / `readItem()` internally
- Purpose: Type safety for data structures across layers
- Examples: `ProgramData`, `ProgramActivity`, `ActivityHymn`, `ChurchEventListItem` in `app/interfaces/`
- Pattern: Exported TypeScript interfaces matching Directus collection structure
- Purpose: One-off async functions within page.tsx for specific data requirements
- Examples: `getHymn()` in `/pdf-gen/hymns/[id]/page.tsx`
- Pattern: Define query shape inline; await Directus SDK; return typed data; catch and log errors
- Purpose: Wrapper components that orchestrate PDF page layout
- Examples: `HymnDocPdf`, `ProgramDocPdf` in `app/components/pdf-components/pdf-documents/`
- Pattern: Client Components that use `dynamic()` import of `PDFViewer` and `PDFDownloadLink` from `@react-pdf/renderer`
## Entry Points
- Location: `app/layout.tsx`
- Triggers: All HTTP requests
- Responsibilities: Root layout, font setup, analytics script (Plausible), Chatwoot widget (conditional), metadata, Tailwind styling
- Location: `app/page.tsx`
- Triggers: GET `/`
- Responsibilities: Welcome hero with social links (Facebook, YouTube, Radio, App download)
- Location: `app/horarios/page.tsx`
- Triggers: GET `/horarios`
- Responsibilities: SSR-fetch church events; pass to client component for filtering and display; cache 5 minutes
- Location: `app/pdf-gen/hymns/[id]/page.tsx`
- Triggers: GET `/pdf-gen/hymns/:id`
- Responsibilities: Fetch hymn from Directus; render PDF document; no caching (`force-dynamic`)
- Location: `app/pdf-gen/programs/[id]/page.tsx`
- Triggers: GET `/pdf-gen/programs/:id`
- Responsibilities: Fetch program with activities and responsible persons; render PDF document; no caching
- Location: `app/api/events/route.ts`
- Triggers: GET `/api/events?limit=N`
- Responsibilities: Query church events; return JSON; cache 5 minutes for client calls
- Location: `app/cards/page.tsx`
- Triggers: GET `/cards`
- Responsibilities: Display shadcn/ui component examples (forms, dialogs, date pickers, etc.)
## Error Handling
- Page fetch helpers wrap Directus calls in try-catch; log error message; throw to let Next.js handle (error.tsx or error boundary)
- API route handlers use try-catch; log to console; return JSON error response with 500 status
- Client components have no explicit error handling (relies on suspense or React error boundary)
```typescript
```
## Cross-Cutting Concerns
- Approach: `console.error()` and `console.log()` in try-catch blocks and service functions
- No structured logging framework (Pino, Winston)
- Approach: No runtime validation (no Zod schemas in service layer); TypeScript types only
- Form validation: `react-hook-form` + `@hookform/resolvers` (used in Cards demo)
- Approach: Not implemented; app assumes Directus is publicly accessible or uses API token in `DIRECTUS_URL` connection string
- No session management, JWT, or OAuth
- Server-side: `unstable_cache()` with 5-minute revalidate on select routes (horarios, API events)
- Client-side: Directus SDK configured with `cache: 'no-store'` to bypass browser cache
- CDN/Static: PDF routes are `force-dynamic` (no static generation)
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
