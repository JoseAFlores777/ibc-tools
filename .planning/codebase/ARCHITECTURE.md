# Architecture

**Analysis Date:** 2026-03-28

## Pattern Overview

**Overall:** Next.js 16 (App Router) with Server-Side Rendering (SSR) and Server Components

**Key Characteristics:**
- Server-first architecture: Most pages are server components that fetch from Directus CMS at request time
- Hybrid rendering: Pages use `force-dynamic` with 5-minute ISR caching via `unstable_cache` and `revalidate`
- Document generation: PDF pages rendered server-side using `@react-pdf/renderer`
- Client interactivity: Limited to event display and component demos; most data fetch happens server-side

## Layers

**Presentation Layer:**
- Purpose: UI components rendered as Server Components and Client Components (marked with `'use client'`)
- Location: `app/` pages and `app/components/`
- Contains: Page components (`page.tsx`), layout wrappers, shadcn/ui components, PDF document renderers
- Depends on: Service Layer (Directus services), domain models (interfaces)
- Used by: Next.js router

**Service Layer:**
- Purpose: Encapsulate Directus CMS interactions and business logic
- Location: `app/lib/directus/services/`
- Contains: Functions like `fetchChurchEvents()` that wrap SDK calls with typing and field selection
- Depends on: Data Layer (Directus SDK client)
- Used by: Pages and API routes

**Data Layer:**
- Purpose: Directus CMS client initialization and type definitions
- Location: `app/lib/directus.tsx` (singleton client), `app/lib/directus/directus.interface.ts` (auto-generated types)
- Contains: Directus SDK client factory, TypeScript interfaces for collections
- Depends on: `@directus/sdk` package
- Used by: Service Layer

**API Layer:**
- Purpose: JSON endpoints for client-side requests
- Location: `app/api/`
- Contains: Route handlers that call services and return JSON responses
- Depends on: Service Layer
- Used by: Client-side code, external services

**Component Library:**
- Purpose: Reusable UI primitives and compound components
- Location: `app/lib/shadcn/ui/` (shadcn/ui components), `app/lib/shadcn/components/` (custom components)
- Contains: Accordion, Button, Card, Dialog, Separator, ScrollArea, Badge, etc. from Radix UI + Tailwind CSS
- Depends on: `@radix-ui/*` packages, Tailwind CSS
- Used by: Page components, PDF components

**PDF Generation:**
- Purpose: Server-rendered PDF documents for hymns and worship programs
- Location: `app/components/pdf-components/`
- Contains: `pdf-documents/` (document wrappers like `HymnDocPdf`), `pdf-pages/` (page layouts like `HymnPagePdf`)
- Depends on: `@react-pdf/renderer`, domain models, assets (fonts, images)
- Used by: PDF generation routes (`/pdf-gen/hymns/[id]`, `/pdf-gen/programs/[id]`)

## Data Flow

**Church Events (Schedule) Flow:**

1. User visits `/horarios` (Server Component)
2. Page component calls `getEvents()` wrapper around `fetchChurchEvents()` service
3. Service uses Directus SDK to query `church_events` collection with cached result via `unstable_cache`
4. Data flows to `HorariosClient` component (Client Component) for interactive display
5. Client-side parsing converts ISO dates and recurrence JSON for display formatting

**PDF Document Generation Flow:**

1. User visits `/pdf-gen/hymns/[id]` or `/pdf-gen/programs/[id]`
2. Page component calls `getHymn()` or `getProgram()` helper
3. Helper uses Directus SDK `readItem()` to fetch single document with nested relations
4. Data wrapped in `BodyProviders` and passed to PDF document component
5. PDF document component renders `HymnPagePdf` or `ProgramPagePdf` using `@react-pdf/renderer`
6. PDFViewer displays rendered PDF in browser

**API Events Flow (Client Fetch):**

1. Client-side code calls `/api/events` with optional `?limit=N` query param
2. Route handler calls `fetchChurchEvents()` service
3. Service returns typed array of events
4. Handler returns JSON response with cache headers (`s-maxage=300`)

**State Management:**
- No global state management (Redux, Zustand, Context) used
- Local component state via `useState` in client components (e.g., `HorariosClient` menu toggle)
- Server-side caching via Next.js `unstable_cache` with 5-minute revalidate window
- Directus SDK caching policy: `cache: 'no-store'` (no browser cache)

## Key Abstractions

**Directus Client Singleton:**
- Purpose: Lazy-initialized SDK client shared across requests
- Examples: `app/lib/directus.tsx` exports `getDirectus()`
- Pattern: Module-level `_client` variable; checks for existence before creating

**Service Functions:**
- Purpose: Encapsulate Directus queries with type-safe field selection
- Examples: `fetchChurchEvents()` in `app/lib/directus/services/events.ts`
- Pattern: Async functions that return typed data; use SDK's `readItems()` / `readItem()` internally

**Domain Models (Interfaces):**
- Purpose: Type safety for data structures across layers
- Examples: `ProgramData`, `ProgramActivity`, `ActivityHymn`, `ChurchEventListItem` in `app/interfaces/`
- Pattern: Exported TypeScript interfaces matching Directus collection structure

**Page-Level Fetch Helpers:**
- Purpose: One-off async functions within page.tsx for specific data requirements
- Examples: `getHymn()` in `/pdf-gen/hymns/[id]/page.tsx`
- Pattern: Define query shape inline; await Directus SDK; return typed data; catch and log errors

**PDF Document Components:**
- Purpose: Wrapper components that orchestrate PDF page layout
- Examples: `HymnDocPdf`, `ProgramDocPdf` in `app/components/pdf-components/pdf-documents/`
- Pattern: Client Components that use `dynamic()` import of `PDFViewer` and `PDFDownloadLink` from `@react-pdf/renderer`

## Entry Points

**Web Application:**
- Location: `app/layout.tsx`
- Triggers: All HTTP requests
- Responsibilities: Root layout, font setup, analytics script (Plausible), Chatwoot widget (conditional), metadata, Tailwind styling

**Homepage:**
- Location: `app/page.tsx`
- Triggers: GET `/`
- Responsibilities: Welcome hero with social links (Facebook, YouTube, Radio, App download)

**Schedule Page:**
- Location: `app/horarios/page.tsx`
- Triggers: GET `/horarios`
- Responsibilities: SSR-fetch church events; pass to client component for filtering and display; cache 5 minutes

**PDF Hymn Route:**
- Location: `app/pdf-gen/hymns/[id]/page.tsx`
- Triggers: GET `/pdf-gen/hymns/:id`
- Responsibilities: Fetch hymn from Directus; render PDF document; no caching (`force-dynamic`)

**PDF Program Route:**
- Location: `app/pdf-gen/programs/[id]/page.tsx`
- Triggers: GET `/pdf-gen/programs/:id`
- Responsibilities: Fetch program with activities and responsible persons; render PDF document; no caching

**API Events:**
- Location: `app/api/events/route.ts`
- Triggers: GET `/api/events?limit=N`
- Responsibilities: Query church events; return JSON; cache 5 minutes for client calls

**Component Demo (Cards):**
- Location: `app/cards/page.tsx`
- Triggers: GET `/cards`
- Responsibilities: Display shadcn/ui component examples (forms, dialogs, date pickers, etc.)

## Error Handling

**Strategy:** Try-catch in async functions with console.error logging

**Patterns:**
- Page fetch helpers wrap Directus calls in try-catch; log error message; throw to let Next.js handle (error.tsx or error boundary)
- API route handlers use try-catch; log to console; return JSON error response with 500 status
- Client components have no explicit error handling (relies on suspense or React error boundary)

Example from `app/api/events/route.ts`:
```typescript
try {
  const events = await fetchChurchEvents({ limit });
  return NextResponse.json({ ok: true, data: events }, { headers: { 'Cache-Control': '...' } });
} catch (error: any) {
  console.error('GET /api/events error:', error?.message || error);
  return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 });
}
```

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.error()` and `console.log()` in try-catch blocks and service functions
- No structured logging framework (Pino, Winston)

**Validation:**
- Approach: No runtime validation (no Zod schemas in service layer); TypeScript types only
- Form validation: `react-hook-form` + `@hookform/resolvers` (used in Cards demo)

**Authentication:**
- Approach: Not implemented; app assumes Directus is publicly accessible or uses API token in `DIRECTUS_URL` connection string
- No session management, JWT, or OAuth

**Caching Strategy:**
- Server-side: `unstable_cache()` with 5-minute revalidate on select routes (horarios, API events)
- Client-side: Directus SDK configured with `cache: 'no-store'` to bypass browser cache
- CDN/Static: PDF routes are `force-dynamic` (no static generation)

---

*Architecture analysis: 2026-03-28*
