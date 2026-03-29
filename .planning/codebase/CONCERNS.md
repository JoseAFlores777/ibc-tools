# Codebase Concerns

**Analysis Date:** 2026-03-28

## Tech Debt

### Type Safety Issues (High Priority)

**Problem:** Widespread use of `any` types bypassing TypeScript safety

- Files: `app/pdf-gen/programs/[id]/page.tsx`, `app/pdf-gen/hymns/[id]/page.tsx`, `app/lib/directus.tsx`, `app/horarios/HorariosClient.tsx`, `app/lib/directus/services/events.ts`
- Impact: Silent failures, runtime errors, difficulty refactoring. Type system provides no protection for Directus queries.
- Examples:
  - `readItem<any, any, any>('programs', id as any, queryItem as any)` in `app/pdf-gen/programs/[id]/page.tsx`
  - `let _client: any;` in `app/lib/directus.tsx`
  - `recurrence?: any;` in `app/lib/directus/services/events.ts`
- Fix approach:
  1. Create proper generic types for Directus client wrapping SDK
  2. Replace `any` types in service functions with explicit interfaces
  3. Use TypeScript `as const` for field arrays instead of `as unknown as string[]`

### TypeScript Ignores (Medium Priority)

**Problem:** Multiple `@ts-ignore` comments indicate unresolved type issues

- Files: `app/horarios/HorariosClient.tsx` (line 494), `app/lib/directus/services/events.ts` (line 39)
- Impact: Suppresses legitimate type errors, makes code harder to maintain
- Fix approach: Create proper discriminated union types for location objects and Directus request responses

### Type Coercion in Location Handling

**Problem:** Inconsistent handling of location types (can be string or object)

- Files: `app/horarios/HorariosClient.tsx` (multiple locations), `app/lib/directus/services/events.ts`
- Symptoms: Repeated `as any` casts and type guards `typeof loc === 'object'`
- Current risk: If Directus returns unexpected format, code fails silently
- Fix: Create Location discriminated union type:
  ```typescript
  type LocationData = { name?: string; address?: string; latitude?: number; longitude?: number; ... } | string | null
  ```

## Known Bugs

### HTML Parsing in PDF Generation

**Bug:** Unsafe HTML parsing using DOM methods in server component context

- Files: `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` (lines 288-312)
- Symptoms: Uses `innerHTML` to parse HTML entities; `decodeHtmlEntities()` creates DOM elements
- Trigger: Hymn content with encoded HTML entities or special characters
- Issue: Server-side React component shouldn't access DOM APIs; could cause SSR failures or XSS if user-controlled HTML is rendered
- Fix approach: Use proper HTML entity decoding library (e.g., `html-entities`) instead of DOM manipulation

### Dangerous Setup in Client-Side PDF Parsing

**Problem:** `extractParagraphs()` in `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` marked `'use client'` but uses DOM APIs

- Line 295: `document.createElement('div')` in React component
- Risk: This works in browser but tightly couples component to DOM; could break if attempted server-side rendering
- Better approach: Move HTML parsing to server action or utility function

## Security Considerations

### HTML/XSS Risk in Chatwoot Widget

**Risk:** Script injection via environment variables

- Files: `app/layout.tsx` (lines 40-60)
- Current state: Uses `dangerouslySetInnerHTML` with environment variables in production-only code
- Mitigation: Variables come from build-time `.env` (not runtime), so token injection window is at build time only
- Recommendation:
  1. Validate `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` matches expected format (alphanumeric, specific length)
  2. Add Content Security Policy header to restrict script sources
  3. Consider if token should be hardcoded instead of env var

### HTML Parsing Without Sanitization

**Risk:** User-generated hymn content rendered directly

- Files: `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` (lines 294-312)
- Symptoms: `extractParagraphs()` uses regex to remove tags but doesn't sanitize attributes
- Mitigation: Content likely curated in Directus CMS (not user-facing input)
- Recommendation: Add sanitization library (e.g., DOMPurify) if hymn content ever becomes user-editable

### Secrets in Environment

**Risk:** Docker build args contain public tokens

- Files: `Dockerfile` (lines 51-61)
- Current state: `NEXT_PUBLIC_*` variables are intentionally public; credentials (DOCKERHUB_TOKEN) are Jenkins secrets
- Issue: If `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` is exposed, could allow chat spoofing (low risk since it's public API token)
- Status: This is by design (Next.js public vars are meant for browser), but document that Chatwoot token is non-sensitive

## Performance Bottlenecks

### Large Generated Type File

**Problem:** Monolithic Directus types file

- Files: `app/lib/directus/directus.interface.ts` (741 lines)
- Impact: Auto-generated, but any manual edit requires re-syncing; slow IDE autocompletion
- Cause: All Directus collections and relations included; file regenerates from schema
- Improvement path:
  1. Keep as-is if auto-generated from Directus schema
  2. Consider splitting into subdirectories by domain (e.g., `types/events.ts`, `types/programs.ts`)
  3. Add generation script documentation to CLAUDE.md

### Client-Side Event Processing

**Problem:** Complex recurrence logic in HorariosClient

- Files: `app/horarios/HorariosClient.tsx` (600+ lines)
- Symptoms: Date calculation, ICS generation, and recurrence formatting all in one component
- Cost: Every render recalculates nextMap for all events; sorting and filtering on client
- Improvement path:
  1. Move recurrence parsing to shared utils (`app/lib/recurrence.ts`)
  2. Move ICS generation to server API route
  3. Pre-calculate next occurrence on server for display (reduces client-side work)
  4. Consider memoizing recurrence calculations per event

### PDF Rendering Without Limits

**Problem:** PDF generation fetches full program with all nested relations

- Files: `app/pdf-gen/programs/[id]/page.tsx` (lines 31-105)
- Symptoms: Queries all program_activities with full hymn details and authors
- Risk: Large programs (50+ activities) could timeout or consume excessive memory
- Fix approach:
  1. Add pagination or activity count limits
  2. Add timeout handling for Directus requests
  3. Cache PDF output for 24+ hours (currently force-dynamic)

## Fragile Areas

### Recurrence Date Calculation

**Files:** `app/horarios/HorariosClient.tsx` (lines 251-340+)

**Why fragile:**
- Complex DST and timezone handling with JavaScript Date
- Weekly recurrence logic creates candidate dates and filters (lines 296-330)
- Interval arithmetic could miss edge cases near month/year boundaries
- No test coverage

**Safe modification:**
- Never change calculation logic without adding comprehensive date test cases
- Test leap years, month transitions, DST boundaries
- Consider using `date-fns` recurrence instead of custom logic

**Test coverage:** None - this is critical path code with high bug potential

### PDF Component Styling

**Files:** `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx`, `app/components/pdf-components/pdf-pages/ProgramPagePdf.tsx`

**Why fragile:**
- Uses @react-pdf/renderer which has limited styling capabilities
- Hardcoded colors, fonts, spacing (no design tokens)
- Font registration at module level (line 11-14) could fail silently
- Content parsing with regex assumes specific HTML structure from Directus

**Safe modification:**
- Test all changes with actual Directus content samples
- Add visual regression tests if possible
- Don't assume HTML structure from letter_hymn field

**Test coverage:** None - styling changes are manual visual verification only

### Directus Client Singleton

**Files:** `app/lib/directus.tsx` (lines 5-14)

**Why fragile:**
- Global mutable state (`let _client`)
- No re-initialization if base URL changes
- Won't work in multi-tenant scenarios
- Tests can't properly isolate or mock

**Safe modification:**
- Consider moving to request context instead of global
- Add validation of baseUrl format
- Document that this assumes single Directus instance

## Scaling Limits

### Directus Query Complexity

**Current capacity:** Tested with small datasets (< 100 events, < 50 programs)

**Limit:**
- `fetchChurchEvents()` fetches up to 50 events with all relations (current hardcoded limit)
- `getProgram()` fetches all activities with nested hymn + author details
- No pagination implemented

**Scaling path:**
1. Implement pagination in HorariosClient
2. Add lazy-loading for program activities
3. Implement Directus query depth limits
4. Cache program PDFs in CDN or Redis

### Browser Cache Management

**Current:** Uses Next.js `unstable_cache()` and Cache-Control headers (5 min revalidate)

**Issue:** Cache invalidation only via time; if Directus updates events outside cache window, users see stale data for up to 5 minutes

**Scaling:** Consider webhook integration to invalidate cache on Directus changes

### PDF Generation at Runtime

**Current:** PDFs generated on-demand, no caching

**Limit:** Large PDF requests (50+ page programs) could timeout or cause memory issues

**Path:**
1. Implement PDF caching with 24h TTL
2. Use queue system for large requests
3. Add abort signal with 30s timeout for PDF generation

## Dependencies at Risk

### @react-pdf/renderer (Medium Risk)

**Risk:** Library has limited browser API support and known rendering issues

- Version: 3.4.4
- Impact: PDF styling doesn't perfectly match web designs; font loading can fail silently
- Migration plan: Switch to server-side PDF generation (e.g., Playwright, puppeteer) if rendering issues become blocking

### Directus SDK (Low Risk)

**Risk:** Version 17.0.0 is relatively new

- Mitigation: SDK is actively maintained; code already uses minimal SDK API surface
- Recommendation: Pin to minor version (^17.0.0) and test before major upgrades

### Unused Dependencies

**Found:** `cors` package in `package.json` (line 48) is imported nowhere

- Fix: Remove from package.json (this is Next.js, not Express)
- `file-saver` (line 51) is imported in HorariosClient but not used (ICS download uses native Blob/URL methods)
- Remove unused: `cors`, `file-saver`

## Test Coverage Gaps

### No Tests for Core Functionality

**Untested areas:**

1. **Date/Recurrence Logic**
   - Files: `app/horarios/HorariosClient.tsx`
   - What's missing: Test cases for getNextOccurrence(), formatRecurrenceLabel(), ICS generation
   - Risk: Calculation errors silently produce wrong event dates; date math errors cause missed events
   - Priority: High

2. **PDF Generation**
   - Files: `app/pdf-gen/programs/[id]/page.tsx`, `app/pdf-gen/hymns/[id]/page.tsx`
   - What's missing: Integration tests for Directus queries, error handling, missing fields
   - Risk: PDFs fail to generate without user feedback; malformed data causes crashes
   - Priority: High

3. **Directus Service Functions**
   - Files: `app/lib/directus/services/events.ts`
   - What's missing: Mock tests for fetchChurchEvents() with various field combinations
   - Risk: Type mismatches between query response and consumer expectations
   - Priority: Medium

4. **API Routes**
   - Files: `app/api/events/route.ts`
   - What's missing: Tests for error handling, limit parameter validation, cache headers
   - Risk: Invalid requests could cause 500 errors without proper error messages
   - Priority: Medium

### Missing HTML Parsing Tests

**Files:** `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx`

**What's not tested:**
- `extractParagraphs()` with various HTML structures
- `decodeHtmlEntities()` with edge cases (encoded quotes, line breaks)

**Risk:** Hymn text rendering could break with unexpected HTML from Directus

## Missing Critical Features

### No Error Boundary

**Problem:** PDF routes lack error boundaries

- Files: `app/pdf-gen/programs/[id]/page.tsx`, `app/pdf-gen/hymns/[id]/page.tsx`
- Current: Errors are thrown and cause 500 page
- Missing: User-friendly error page with fallback content
- Impact: Users see blank page instead of informative error when Directus is down

### No Loading State for PDF Generation

**Problem:** PDF generation can take 2-5 seconds but provides no feedback

- Files: PDF components have no suspense boundary
- Impact: Users think page hung

### No Fallback Content for Failed Directus Queries

**Problem:** If Directus is unreachable, pages hard error

- Files: All pages in `/pdf-gen/*`, `/horarios/*`, `/api/events`
- Missing: Graceful degradation, cached fallback, retry logic
- Impact: Entire feature unavailable during Directus outages

---

*Concerns audit: 2026-03-28*
