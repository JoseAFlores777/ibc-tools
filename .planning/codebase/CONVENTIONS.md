# Coding Conventions

**Analysis Date:** 2026-03-28

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `ThemeButton.tsx`, `HorariosClient.tsx`)
- Service/utility functions: camelCase with `.ts` extension (e.g., `events.ts`, `directus.tsx`)
- Interfaces/types: PascalCase with `.interface.ts` or `.ts` suffix (e.g., `Program.interface.ts`, `TranslationObject.ts`)
- Directories: kebab-case for routes (`/pdf-gen/hymns/`, `/api/events/`), camelCase for feature folders (`app/components/`, `app/lib/`)

**Functions:**
- Regular functions: camelCase (e.g., `formatTime12`, `parseRecurrence`, `getDirectus`)
- React hooks (custom): camelCase with `use` prefix (e.g., `useCountdown`)
- Event handlers: camelCase with descriptive names (e.g., `downloadICS`, `toggleMenu`)
- Async functions: camelCase (e.g., `fetchChurchEvents`, `getHymn`, `getAssetUrl`)

**Variables:**
- Constants: camelCase (e.g., `WEEKDAY_MAP_ICS`, `WEEKDAY_ES_PLURAL`, `WEEKDAY_ES_SHORT`)
- State variables: camelCase (e.g., `darkMode`, `events`, `error`)
- Props interfaces: PascalCase ending with `Props` (e.g., `NavbarProps`, `Props`)
- Type unions/mapped types: PascalCase (e.g., `ChurchEventListItem`, `Recurrence`)

**Types:**
- Interfaces: PascalCase with `interface` keyword (e.g., `ProgramData`, `ProgramActivity`, `ActivityHymn`)
- Type definitions: PascalCase with `type` keyword
- Discriminated unions: PascalCase fields with literal values (e.g., `frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'`)

## Code Style

**Formatting:**
- Formatter: Prettier v3.3.3
- Key settings:
  - `printWidth: 100` — wrap lines at 100 characters
  - `singleQuote: true` — use single quotes for strings
  - `semi: true` — require semicolons
  - `trailingComma: "es5"` — trailing commas in ES5-compatible contexts
  - `tabWidth: 2` — 2-space indentation
  - `arrowParens: "always"` — parenthesize arrow function params always
  - `quoteProps: "consistent"` — consistent quote style for object properties

**Linting:**
- Linter: ESLint v8 with Next.js core web vitals config
- Config file: `.eslintrc.json`
- Extends: `next/core-web-vitals`
- Uses default Next.js rules for best practices

**Example formatting from codebase:**
```typescript
// Single quotes, trailing commas, semicolons
export const siteConfig = {
  name: 'shadcn/ui',
  url: 'https://ui.shadcn.com',
  ogImage: 'https://ui.shadcn.com/og.jpg',
  description: 'Beautifully designed components...',
};

// Arrow functions with parens, 100-char wrapping
const formatTime12 = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  // ...
};
```

## Import Organization

**Order:**
1. Built-in modules and third-party packages (React, Next.js, SDK clients, UI libraries)
2. Relative imports using aliases (`@/`, `@/lib/`, `@/components/`)
3. Type imports (using `import type`)

**Pattern:**
```typescript
// 1. React/Next.js
import { createDirectus, rest } from '@directus/sdk';
import { readItems } from '@directus/sdk';
import { readItem } from '@directus/sdk';

// 2. Relative alias imports
import { getDirectus } from '@/app/lib/directus';
import type { ChurchEvents } from '@/app/lib/directus/directus.interface';
import BodyProviders from '@/app/providers/BodyProviders';

// 3. Type imports (explicit)
import type { Metadata } from 'next';
import type { ClassValue } from 'clsx';
```

**Path Aliases:**
- `@/*` → project root (`./`)
- `@/lib/*` → `./app/lib/*`
- All imports use forward slashes
- No relative path crawling (prefer aliases)

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (data fetching, Directus queries)
- Log errors with `console.error()` including descriptive context
- Re-throw errors to propagate them upstream in server functions
- Client-side error state via `useState<string | null>(null)` for user feedback

**Examples from codebase:**

Server-side (throw to Next.js error boundary):
```typescript
async function getHymn(id: string): Promise<ActivityHymn> {
  try {
    const data = await directus.request(readItem<any, any, any>(...));
    return data;
  } catch (error) {
    console.error('Error al obtener el programa:', error);
    throw error; // Propagate to error boundary
  }
}
```

Client-side (set state for display):
```typescript
try {
  const res = await fetch('/api/events?limit=50', { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  setEvents(json.data as ChurchEventListItem[]);
} catch (e: any) {
  if (!cancelled) {
    setError('No se pudieron cargar los eventos.');
    setEvents([]);
  }
}
```

API routes:
```typescript
try {
  const events = await fetchChurchEvents({ limit });
  return NextResponse.json({ ok: true, data: events }, { headers: {...} });
} catch (error: any) {
  console.error('GET /api/events error:', error?.message || error);
  return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 });
}
```

## Logging

**Framework:** `console` (built-in Node.js/browser logging)

**Patterns:**
- Use `console.error()` for errors with descriptive message
- Use `console.log()` for diagnostic output (function results, data received)
- Use `console.warn()` for non-fatal issues (missing expected config)
- Always include context: `console.error('Failed operation context:', error)`
- Log at function level, not in inline conditionals

**Examples:**
```typescript
console.log('Programa obtenido:', data); // Diagnostic
console.error('Error al obtener el programa:', error); // Error case
console.warn('No se encontró el formato condicional...'); // Non-fatal
```

## Comments

**When to Comment:**
- Complex business logic (e.g., recurrence calculation in `HorariosClient.tsx`)
- Non-obvious algorithm decisions or workarounds
- Explanations of why something is done a certain way (not what it does)
- Spanish comments preferred to match codebase and domain language

**JSDoc/TSDoc:**
- Not consistently used; prefer clear function signatures with types
- When used, document parameters, return type, and purpose
- Example from codebase (missing but recommended):
```typescript
/**
 * Fetch church events from Directus.
 * Mirrors how other pages call Directus (see app/pdf-gen/hymns/[id]/page.tsx).
 */
export async function fetchChurchEvents(options?: { limit?: number }) {
```

## Function Design

**Size:**
- Keep functions small and focused (100-300 lines for complex utilities)
- Complex logic extracted to helper functions (e.g., `formatRecurrenceLabel`, `getNextOccurrence`)
- Long client components (600+ lines) acceptable for isolated feature pages (e.g., `HorariosClient.tsx`)

**Parameters:**
- Use object parameters for multiple arguments: `{ limit?: number }`
- Spread destructuring in function declarations: `({ children }: Props) =>`
- Optional fields use `?` and provide defaults: `const limit = options?.limit ?? 50`

**Return Values:**
- Type-annotated return values: `Promise<ActivityHymn>`, `Date | null`
- Use nullish coalescing (`??`) over logical OR (`||`) for defaults
- Throw errors from async functions rather than returning error states
- Return null or `[]` for empty collections rather than error values

**Example patterns:**
```typescript
// Multiple args as object, with defaults
async function fetchChurchEvents(options?: { limit?: number }) {
  const limit = options?.limit ?? 50;
  // ...
}

// Return type with union
function getNextOccurrence(ev: ChurchEventListItem, from = new Date()): Date | null {
  // ...
}

// Destructured props in component
const ThemeButton: React.FC = () => {
  // ...
}

// Spread and nullish coalescing
const data = (await directus.request(...)) as ActivityHymn;
```

## Module Design

**Exports:**
- Named exports for utilities and services: `export function fetchChurchEvents(...)`
- Default exports for React components: `export default function HorariosClient(...)`
- Default exports for config objects: `export default getDirectus`
- Explicit type exports: `export type SiteConfig = typeof siteConfig`

**Barrel Files:**
- Used in `app/lib/shadcn/ui/` for component library re-export
- Single import for convenience: `import { Button, Card, ... } from '@/lib/shadcn/ui'`
- Not used for service modules (import directly from service)

**Example structure:**
```typescript
// Barrel file (app/lib/shadcn/ui/index.ts, implied)
export { Button } from './button';
export { Card, CardContent, CardHeader, CardTitle } from './card';

// Service module (no barrel export)
// app/lib/directus/services/events.ts
export async function fetchChurchEvents(...) { }

// Component (default export)
export default function HorariosClient(...) { }
```

## React & Next.js Specific

**Component Declarations:**
- Typed with `React.FC` for functional components with explicit props type
- Example: `const ThemeButton: React.FC = () => { ... }`
- Props interfaces named `ComponentNameProps`

**Directives:**
- `'use client'` at top of file for client-side components
- `'use server'` not used (all async functions are implicit server functions)
- Used consistently in component files, not in utility files

**Server vs Client:**
- Server components by default (RSC first)
- Client-side: event handlers, hooks (useState, useEffect), browser APIs
- Server-side: data fetching, Directus queries, API routes

---

*Convention analysis: 2026-03-28*
