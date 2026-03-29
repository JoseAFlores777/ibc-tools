# Codebase Structure

**Analysis Date:** 2026-03-28

## Directory Layout

```
ibc-tools/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API route handlers
│   ├── cards/                    # Component demo route
│   ├── components/               # Shared React components
│   ├── config/                   # App configuration
│   ├── horarios/                 # Schedule page
│   ├── interfaces/               # TypeScript domain model interfaces
│   ├── lib/                      # Utility functions and libraries
│   ├── pdf-gen/                  # PDF generation routes (dynamic)
│   ├── providers/                # Context providers
│   ├── sections/                 # Page sections (Navbar, etc.)
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global Tailwind styles
├── public/                       # Static assets (images, fonts)
├── .planning/                    # GSD planning documents (this directory)
├── Dockerfile                    # Docker build configuration
├── Jenkinsfile                   # Jenkins CI/CD pipeline
├── docker-compose.yml            # Local development Docker setup
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── package.json                  # Dependencies and scripts
├── .env                          # Environment variables (secrets)
├── .env.example                  # Environment variable template
└── README.md                     # Project documentation
```

## Directory Purposes

**`app/`**
- Purpose: Next.js 16 App Router source code
- Contains: Pages, API routes, components, services, configuration
- Key files: `page.tsx` (home), `layout.tsx` (root), `globals.css`

**`app/api/`**
- Purpose: API route handlers (RESTful endpoints)
- Contains: Route handler files following Next.js API convention
- Key files: `app/api/events/route.ts` (JSON endpoint for church events)

**`app/cards/`**
- Purpose: Component showcase page for shadcn/ui demo
- Contains: `page.tsx` and `components/` subdirectory with form/UI examples
- Key files: `app/cards/page.tsx`, `app/cards/components/*.tsx`

**`app/components/`**
- Purpose: Reusable React components for the app
- Contains: PDF-specific components, page sections, utility components
- Key files: `app/components/pdf-components/` (PDF rendering), `app/components/ThemeButton.tsx`

**`app/components/pdf-components/`**
- Purpose: PDF document generation using `@react-pdf/renderer`
- Contains: `pdf-documents/` (full document wrappers) and `pdf-pages/` (page layouts)
- Key files: `HymnDocPdf.tsx`, `ProgramDocPdf.tsx`, `HymnPagePdf.tsx`, `ProgramPagePdf.tsx`

**`app/config/`**
- Purpose: Application-level configuration and constants
- Contains: Site metadata, navigation docs, feature flags
- Key files: `app/config/site.ts`, `app/config/index.ts`

**`app/horarios/`**
- Purpose: Church schedule/events page
- Contains: Server component for page, client component for interactive display
- Key files: `app/horarios/page.tsx` (server), `app/horarios/HorariosClient.tsx` (client)

**`app/interfaces/`**
- Purpose: TypeScript interfaces for domain models
- Contains: Types that match Directus collection structures
- Key files: `Program.interface.ts`, `FileObject.interface.ts`

**`app/lib/`**
- Purpose: Utility functions, services, and third-party client initialization
- Contains: Directus SDK setup, shadcn/ui components, utility functions
- Key files: `app/lib/directus.tsx` (singleton client), `app/lib/index.ts` (barrel export)

**`app/lib/directus/`**
- Purpose: Directus CMS integration
- Contains: SDK client factory, auto-generated types, service functions
- Key files: `directus.tsx` (client), `directus.interface.ts` (types), `services/events.ts`

**`app/lib/directus/services/`**
- Purpose: Service layer for Directus queries
- Contains: Async functions that wrap SDK calls with field selection and typing
- Key files: `events.ts` (church events query)

**`app/lib/shadcn/`**
- Purpose: shadcn/ui component library (Radix UI + Tailwind)
- Contains: Pre-built components and utilities
- Key files: `app/lib/shadcn/ui/` (70+ component files), `app/lib/shadcn/utils.ts` (cn() utility)

**`app/providers/`**
- Purpose: React Context providers and wrapper components
- Contains: Client-side provider setup for child components
- Key files: `BodyProviders.tsx` (currently minimal, used for PDF rendering)

**`app/sections/`**
- Purpose: Page-level section components (headers, navigation, footers)
- Contains: Components composed from multiple UI primitives
- Key files: `Navbar.tsx` (responsive navigation with mobile menu)

**`public/`**
- Purpose: Static assets served directly by Next.js
- Contains: Images, fonts, favicon
- Key files: `public/images/altar_2.jpg`, `public/fonts/adamina/`, `public/favicon_io/`

**`.planning/`**
- Purpose: GSD planning and codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Key files: Generated by /gsd:map-codebase command

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, fonts, analytics, Chatwoot widget conditional loading
- `app/page.tsx`: Homepage with hero image and social links
- `next.config.mjs`: Next.js configuration (standalone output, image domains, cache headers)

**Configuration:**
- `tsconfig.json`: Path aliases (`@/*` → root, `@/lib/*` → app/lib/)
- `tailwind.config.ts`: Tailwind theme customization
- `postcss.config.mjs`: PostCSS setup for Tailwind
- `.env`: Runtime environment variables (Directus URL, Chatwoot tokens)
- `.env.example`: Template for required env vars

**Core Logic:**
- `app/lib/directus.tsx`: Directus SDK client singleton
- `app/lib/directus/services/events.ts`: Church events service
- `app/horarios/page.tsx`: Schedule page (SSR with caching)
- `app/pdf-gen/hymns/[id]/page.tsx`: Hymn PDF generation
- `app/pdf-gen/programs/[id]/page.tsx`: Program PDF generation
- `app/api/events/route.ts`: JSON API for events

**Types & Interfaces:**
- `app/interfaces/Program.interface.ts`: Domain model types
- `app/lib/directus/directus.interface.ts`: Auto-generated Directus collection types

**UI Components:**
- `app/sections/Navbar.tsx`: Responsive navigation
- `app/components/pdf-components/pdf-documents/HymnDocPdf.tsx`: Hymn PDF wrapper
- `app/lib/shadcn/ui/*`: 70+ shadcn/ui primitive components
- `app/lib/shadcn/utils.ts`: `cn()` utility (clsx + tailwind-merge)

## Naming Conventions

**Files:**
- Page files: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Layout wrappers: `layout.tsx`
- Client components: Named like `HorariosClient.tsx` or marked with `'use client'`
- Services: Descriptive names like `events.ts`
- Components: PascalCase like `Navbar.tsx`, `ThemeButton.tsx`
- Interfaces: PascalCase ending with `.interface.ts` like `Program.interface.ts`

**Directories:**
- Feature routes: Lowercase slug names like `horarios`, `cards`, `pdf-gen`
- Dynamic route params: Bracket notation like `[id]` (Next.js convention)
- Component subdirs: Descriptive plural names like `pdf-components`, `components`, `services`
- Page sections: Named by section purpose like `sections/Navbar.tsx`

**TypeScript Identifiers:**
- Interfaces: PascalCase (`ProgramData`, `ActivityHymn`, `ChurchEventListItem`)
- Functions: camelCase (`getDirectus()`, `fetchChurchEvents()`, `formatDateRange()`)
- Variables: camelCase (`revalidate`, `limit`, `events`)
- Constants: camelCase (`WEEKDAY_MAP_ICS`, `WEEKDAY_ES_SHORT`) for shared constants

## Where to Add New Code

**New Feature (e.g., new page or section):**
- Primary code: Create new directory in `app/` following App Router conventions
  - Example: `app/about/page.tsx` for `/about` route
- Tests: Not currently organized (no test directory visible)
- Config: Update `app/config/` if feature needs site metadata

**New Component/Module:**
- Reusable UI component: `app/components/YourComponent.tsx` or subdirectory if related
- Page section: `app/sections/YourSection.tsx` for navigation/layout pieces
- Service function: `app/lib/directus/services/yourservice.ts` if Directus-related
- Configuration: `app/config/yourconfig.ts` if feature-specific constants

**Utilities:**
- Shared helpers: `app/lib/utils.ts` or create domain-specific file like `app/lib/formatting.ts`
- Domain types: `app/interfaces/YourModel.interface.ts`
- Directus utilities: `app/lib/directus/utils.ts` (if needed)

**Directus Integration:**
- Service functions: Add to `app/lib/directus/services/` with exported async functions
- Type definitions: Use auto-generated types from `app/lib/directus/directus.interface.ts`
- Example pattern:
  ```typescript
  // app/lib/directus/services/programs.ts
  export async function fetchPrograms(options?: { limit?: number }) {
    const client = getDirectus();
    return client.request(readItems('programs', { limit: options?.limit ?? 50 }));
  }
  ```

**API Endpoints:**
- Location: `app/api/[resource]/route.ts` matching REST conventions
- Pattern: Import service, call in GET/POST handler, return NextResponse.json()
- Example: `app/api/programs/route.ts` for program listings

**PDF Documents:**
- Location: `app/components/pdf-components/pdf-documents/YourDocPdf.tsx`
- Pattern: Client component that imports Page component and wraps with PDFViewer
- Register fonts in page component (`Font.register()`)

## Special Directories

**`.next/`**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in .gitignore)

**`node_modules/`**
- Purpose: npm dependencies
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)

**`public/`**
- Purpose: Static assets served at root of domain
- Generated: No (manually maintained)
- Committed: Yes (except large media files may be excluded)

**`contexts/`**
- Purpose: GSD tool context/state (not part of app code)
- Generated: Yes
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-03-28*
