# Testing Patterns

**Analysis Date:** 2026-03-28

## Test Framework

**Status:** Not detected

**Current State:**
- No test framework installed (Jest, Vitest, etc.)
- No test configuration files found (`jest.config.js`, `vitest.config.ts`)
- No test files detected in `app/` directory (no `.test.ts`, `.spec.ts`, etc.)
- No test scripts in `package.json` (no `npm test`, `npm run test:watch`, etc.)

**Recommendation:**
Testing should be implemented as a future phase. The codebase is production-ready for PDF generation and API routes but lacks test coverage.

## Assertion Library

Not applicable — no testing framework installed.

## Run Commands

Not applicable — testing infrastructure not configured.

---

## Test File Organization

**Current Structure:**
No tests exist in the codebase.

**Recommended Pattern (for future implementation):**
- **Location:** Co-located with source code
  - Place tests in same directory as feature: `app/components/__tests__/` or `app/lib/__tests__/`
  - Alternatively, mirror structure: `tests/app/components/`, `tests/app/lib/`
- **Naming:** Follow source file name with `.test.ts` or `.spec.ts`
  - Example: `HorariosClient.tsx` → `HorariosClient.test.tsx`
  - Example: `events.ts` → `events.test.ts`

**Directory Pattern (recommended):**
```
app/
├── components/
│   ├── pdf-components/
│   │   ├── pdf-documents/
│   │   │   ├── HymnDocPdf.tsx
│   │   │   ├── __tests__/
│   │   │   │   └── HymnDocPdf.test.tsx
│   │   └── pdf-pages/
│   ├── ThemeButton.tsx
│   └── __tests__/
│       └── ThemeButton.test.tsx
├── lib/
│   ├── directus/
│   │   ├── services/
│   │   │   ├── events.ts
│   │   │   └── __tests__/
│   │   │       └── events.test.ts
```

---

## Test Structure

**Not applicable — no tests exist.**

**Recommended Pattern (for future implementation):**

### Unit Tests

Use Jest or Vitest with this structure:

```typescript
// Example: app/lib/shadcn/utils.test.ts
import { cn } from '@/lib/shadcn/utils';

describe('cn utility', () => {
  describe('merges clsx and tailwind-merge', () => {
    it('should combine class names', () => {
      const result = cn('px-2', 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2 px-4');
      expect(result).toBe('px-4');
    });

    it('should handle conditional classes', () => {
      const result = cn('px-2', false && 'py-1', true && 'py-2');
      expect(result).toBe('px-2 py-2');
    });
  });
});
```

### Async Function Tests

For server functions and services:

```typescript
// Example: app/lib/directus/services/events.test.ts
import { fetchChurchEvents } from './events';

describe('fetchChurchEvents', () => {
  beforeEach(() => {
    // Mock getDirectus or set up test client
  });

  it('should fetch events with default limit', async () => {
    const events = await fetchChurchEvents();
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeLessThanOrEqual(50);
  });

  it('should respect custom limit', async () => {
    const events = await fetchChurchEvents({ limit: 10 });
    expect(events.length).toBeLessThanOrEqual(10);
  });

  it('should return ChurchEventListItem[] type', async () => {
    const events = await fetchChurchEvents();
    events.forEach((event) => {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
    });
  });

  it('should filter archived events', async () => {
    const events = await fetchChurchEvents();
    events.forEach((event) => {
      // Verify no archived events in result
      // (implementation detail of fetchChurchEvents)
    });
  });
});
```

### React Component Tests

For UI components with hooks:

```typescript
// Example: app/components/ThemeButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeButton } from '@/components/ThemeButton';

describe('ThemeButton', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render switch component', () => {
    render(<ThemeButton />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should read theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeButton />);
    // Verify component reflects dark mode
  });

  it('should toggle theme on switch change', () => {
    render(<ThemeButton />);
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should add/remove dark class on document element', () => {
    render(<ThemeButton />);
    expect(document.documentElement.classList.contains('dark')).toBeFalsy();
    fireEvent.click(screen.getByRole('switch'));
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
  });
});
```

---

## Mocking

**Framework:** Not applicable — testing not configured.

**Recommended Patterns (for future implementation):**

### Mocking Directus Client

```typescript
// tests/mocks/directus.ts
import { vi } from 'vitest';

export const mockDirectusClient = {
  request: vi.fn(),
};

vi.mock('@/app/lib/directus', () => ({
  getDirectus: () => mockDirectusClient,
}));
```

### Mocking Fetch

```typescript
// For API route tests
global.fetch = vi.fn();

// In test:
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => ({ ok: true, data: [...events] }),
} as Response);
```

### Mocking React Hooks

```typescript
import { useEffect, useState } from 'react';
import { vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(actual.useState),
  };
});
```

**What to Mock:**
- External API calls (Directus SDK)
- Environment variables
- Browser APIs (`localStorage`, `fetch`)
- Date/time for consistency (`Date.now()`)

**What NOT to Mock:**
- Internal utility functions (`cn`, `formatTime12`)
- React hooks behavior (test real hook behavior unless external)
- Component rendering (test real component unless external)
- Tailwind class merging

---

## Fixtures and Factories

**Not applicable — no tests exist.**

**Recommended Pattern (for future implementation):**

Create test data factories for consistent fixtures:

```typescript
// tests/fixtures/events.ts
export const createMockEvent = (overrides = {}) => ({
  id: '1',
  title: 'Test Event',
  description: 'Test description',
  start_datetime: '2026-04-01T10:00:00Z',
  end_datetime: '2026-04-01T11:00:00Z',
  is_online: false,
  meeting_link: null,
  cover_image: null,
  location: {
    name: 'Test Location',
    address: '123 Test St',
    latitude: 14.5128,
    longitude: -90.2680,
    waze_link: null,
    googleMaps_link: null,
  },
  recurrence: null,
  ...overrides,
});

export const createMockRecurringEvent = (overrides = {}) => ({
  ...createMockEvent(),
  recurrence: {
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [0, 3], // Sunday, Wednesday
    endDate: '2026-12-31',
  },
  ...overrides,
});
```

**Location:**
- `tests/fixtures/` directory
- One file per domain (e.g., `events.ts`, `hymns.ts`, `programs.ts`)

---

## Coverage

**Requirements:** Not enforced

**Current Status:** No coverage configuration present.

**Recommended Target (for future phases):**
- Statements: 70%+ (focus on critical paths)
- Branches: 60%+ (cover happy path + error cases)
- Functions: 80%+ (all exported functions)
- Lines: 70%+ (same as statements)

**View Coverage (when implemented):**
```bash
npm run test:coverage
# or
vitest run --coverage
```

---

## Test Types

**Unit Tests:**
- Scope: Individual utility functions and services
- Approach: Test function inputs → outputs in isolation
- Examples to test:
  - `cn()` utility merging logic
  - Date formatting functions (`formatTime12`, `formatDateRange`, `formatRecurrenceLabel`)
  - Recurrence calculation (`parseRecurrence`, `getNextOccurrence`)
  - ICS generation (`buildICS`)
  - Event filtering and sorting logic

**Integration Tests:**
- Scope: Service functions with Directus client (mocked)
- Approach: Test that services correctly call SDK and transform data
- Examples to test:
  - `fetchChurchEvents()` query building and response transformation
  - `getHymn()` field selection and data shaping
  - API routes (`/api/events`) with mocked services

**E2E Tests:**
- Framework: Not recommended for this MVP phase
- If added later, use Playwright or Cypress for:
  - Navigation to `/horarios`, `/pdf-gen/hymns/[id]`, `/pdf-gen/programs/[id]`
  - PDF generation and rendering
  - Event countdown and live link visibility
  - ICS download functionality

---

## Common Patterns

**Async Testing (Recommended for future implementation):**

```typescript
// Vitest syntax
it('should fetch and transform event data', async () => {
  const mockEvents = [createMockEvent()];
  vi.mocked(getDirectus).mockReturnValue({
    request: vi.fn().mockResolvedValue(mockEvents),
  });

  const result = await fetchChurchEvents({ limit: 10 });

  expect(result).toEqual(mockEvents);
});

// With async/await
it('should handle fetch errors', async () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

  await expect(fetchChurchEvents()).rejects.toThrow('Network error');
});
```

**Error Testing:**

```typescript
it('should throw on invalid ID', async () => {
  vi.mocked(getDirectus).mockReturnValue({
    request: vi.fn().mockRejectedValue(new Error('Not found')),
  });

  await expect(getHymn('invalid-id')).rejects.toThrow('Not found');
});

it('should gracefully handle missing optional fields', async () => {
  const incompleteEvent = createMockEvent({ description: null });
  const result = await processEvent(incompleteEvent);
  expect(result.description).toBeNull();
});
```

**Date Testing (Mock for consistency):**

```typescript
it('should calculate correct next occurrence', () => {
  vi.useFakeTimers();
  const now = new Date('2026-04-01T10:00:00Z');
  vi.setSystemTime(now);

  const event = createMockRecurringEvent({
    start_datetime: '2026-04-05T10:00:00Z', // Sunday
    recurrence: { frequency: 'weekly', daysOfWeek: [0] },
  });

  const next = getNextOccurrence(event, now);
  expect(next?.toDateString()).toBe('Sun Apr 05 2026');

  vi.useRealTimers();
});
```

---

## Critical Areas to Test (Priority Order)

1. **Recurrence Logic** (`getNextOccurrence`, `formatRecurrenceLabel` in `HorariosClient.tsx`)
   - Complex algorithm with edge cases
   - Affects feature availability (countdown, live link visibility)
   - Risk: High (logic errors go unnoticed in UI)

2. **Event Filtering & Fetching** (`fetchChurchEvents` in `events.ts`)
   - Data layer reliability
   - Filters archived events
   - Risk: Medium (affects all event-driven pages)

3. **Date Formatting Functions** (`formatTime12`, `formatDateRange`, `buildICS`)
   - User-facing, Spanish localized
   - Risk: Medium (bad formatting visible but not critical)

4. **API Route Handlers** (`/api/events`)
   - Request validation
   - Error responses
   - Risk: Medium (affects client-side resilience)

5. **Component Event Handling** (ThemeButton, download handlers)
   - User interactions
   - Risk: Low (visible bugs caught in manual testing)

---

*Testing analysis: 2026-03-28*
