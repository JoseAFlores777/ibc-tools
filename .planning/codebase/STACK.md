# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript 5.x - Full codebase, strict mode enabled
- JavaScript (ES2017 target) - Configuration files and build scripts
- JSX/TSX - React component syntax

## Runtime

**Environment:**
- Node.js 20.x (node:20-bookworm-slim)
- npm (package manager)

**Package Manager:**
- npm with lockfile (`package-lock.json`)
- Legacy peer deps enabled in Docker build for compatibility

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI Component System:**
- shadcn/ui (Radix + Tailwind) - Component library built on atomic primitives
  - Radix UI primitives (accordion, dialog, dropdown, select, tooltip, etc.)
  - Complete shadcn/ui component set in `app/lib/shadcn/ui/`
  - Barrel export: `@/lib/shadcn/ui`

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS
- PostCSS 8.x - CSS transformation
- tailwind-merge 2.5.2 - Smart class merging utility
- tailwindcss-animate 1.0.7 - Animation utilities

**PDF Generation:**
- @react-pdf/renderer 3.4.4 - Server-side PDF rendering from React components
  - Components in `app/components/pdf-components/`
  - Full documents: `pdf-documents/` (HymnDocPdf, ProgramDocPdf)
  - Page layouts: `pdf-pages/` (HymnPagePdf, ProgramPagePdf)

**Form Handling:**
- react-hook-form 7.52.2 - Lightweight form state management
- @hookform/resolvers 3.9.0 - Schema validation adapters
- Zod 3.23.8 - TypeScript-first schema validation

**UI Features:**
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

**Data Visualization:**
- Recharts 2.12.7 - Charting library built on React components

**Utilities:**
- date-fns 3.6.0 - Date manipulation and formatting
- clsx 2.1.1 - Conditional class merging
- class-variance-authority 0.7.0 - Type-safe CSS variants
- file-saver 2.0.5 - File download utility
- sharp 0.33.5 - Image processing and optimization
- cors 2.8.5 - CORS middleware

**Theming:**
- next-themes 0.3.0 - Light/dark mode theme switching

## Key Dependencies

**Critical:**
- @directus/sdk 17.0.0 - Headless CMS backend client
  - Singleton pattern in `app/lib/directus.tsx` (getDirectus())
  - Auto-generated types in `app/lib/directus/directus.interface.ts`
  - Service functions in `app/lib/directus/services/`

**Development:**
- ESLint 8.x - Code linting
- Prettier 3.3.3 - Code formatting
- TypeScript (dev) 5.x - Type checking

## Configuration

**TypeScript:**
- `tsconfig.json` - Strict mode enabled, path aliases configured
  - `@/*` → project root
  - `@/lib/*` → `app/lib/*`
- Target: ES2017
- Module system: esnext with bundler resolution

**ESLint:**
- Config: `.eslintrc.json` (minimal, extends Next.js config)

**Prettier:**
- Config: `.prettierrc` (minimal configuration)

**Build:**
- `next.config.mjs` - Next.js configuration
  - Output: `standalone` (Docker-optimized)
  - Strict mode: enabled
  - Remote image patterns configured for admin.ibchn.org, fonts.gstatic.com, s3.joseiz.com
  - Cache control headers for `/pdf-gen` (no-store)

**PostCSS:**
- `postcss.config.mjs` - Tailwind integration

**Tailwind:**
- `tailwind.config.ts` - Form plugin included (@tailwindcss/forms)

## Environment Configuration

**Build-time Variables:**
- `NEXT_PUBLIC_DIRECTUS_URL` - Directus backend URL (exposed to browser)
- `NEXT_PUBLIC_DIRECTUS_HOST` - Alternative Directus hostname
- `NEXT_PUBLIC_CHATWOOT_BASE_URL` - Chatwoot widget server URL (exposed to browser)
- `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` - Chatwoot authentication token (exposed to browser)

**Server-only Variables:**
- `DIRECTUS_URL` - Server-side Directus backend URL (preferred over NEXT_PUBLIC variant)

**Docker Environment (runtime):**
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `NEXT_CACHE_DIR=/tmp/next-cache`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`

## Platform Requirements

**Development:**
- Node.js 20.x with npm
- Git for version control
- Docker for local containerization (optional)

**Production:**
- Docker container (Node.js 20-bookworm-slim base)
- Port 3000 exposure
- Curl for healthchecks (included in production image)

**CI/CD:**
- Jenkins with Docker agent
- Docker Hub credentials for image push
- Dokploy webhook endpoint for deployment trigger

**External Services:**
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

---

*Stack analysis: 2026-03-28*
