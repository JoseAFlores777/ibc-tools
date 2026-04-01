---
phase: quick
plan: 260331-q3m
subsystem: visualizador
tags: [sse, remote-control, mobile, realtime]
dependency_graph:
  requires: [visualizador-core]
  provides: [remote-control-api, mobile-control-page]
  affects: [visualizador-page, projection-controls]
tech_stack:
  added: [qrcode.react]
  patterns: [SSE, in-memory-room-store, PIN-based-auth]
key_files:
  created:
    - app/visualizador/lib/remote-types.ts
    - app/api/visualizador/rooms/room-store.ts
    - app/api/visualizador/rooms/route.ts
    - app/api/visualizador/rooms/[pin]/stream/route.ts
    - app/api/visualizador/rooms/[pin]/command/route.ts
    - app/api/visualizador/rooms/[pin]/state/route.ts
    - app/visualizador/hooks/useRemoteRoom.ts
    - app/visualizador/control/page.tsx
    - app/visualizador/control/layout.tsx
  modified:
    - app/visualizador/components/ProjectionControls.tsx
    - app/visualizador/components/LivePreviewColumn.tsx
    - app/visualizador/page.tsx
    - package.json
decisions:
  - Used in-memory Map for room storage (sufficient for single-instance deployment)
  - 4-digit numeric PIN for simplicity on mobile keyboards
  - Separate SSE listener sets for desktop (commands) and mobile (state)
  - qrcode.react for client-side QR generation (lightweight, no canvas issues)
  - Suspense boundary wrapper for useSearchParams in control page
metrics:
  duration: 6min 39s
  completed: 2026-03-31
---

# Quick Task 260331-q3m: SSE + POST Remote Control for Visualizador Summary

SSE-based remote control with PIN rooms: desktop creates room, shows QR + PIN, mobile connects and controls slides/modes/audio in real-time.

## What Was Built

### 1. Remote Types (`app/visualizador/lib/remote-types.ts`)
Shared TypeScript types for the remote control protocol: `RemoteCommand` (4 command types), `RemoteState` (lightweight state snapshot), and `SSEEvent` discriminated union.

### 2. Room Store (`app/api/visualizador/rooms/room-store.ts`)
In-memory room management with:
- 4-digit PIN generation (1000-9999, collision-resistant)
- Separate SSE listener sets per role (desktop receives commands, mobile receives state)
- Rate limiting (10 commands/second per room)
- 4-hour room expiry with 30-minute cleanup sweep
- Thread-safe broadcast to all listeners with automatic dead-writer cleanup

### 3. API Routes (4 endpoints)
- `POST /api/visualizador/rooms` - Create room, returns `{ pin, roomId }`
- `GET /api/visualizador/rooms/[pin]/stream?role=desktop|mobile` - SSE stream with 30s keepalive
- `POST /api/visualizador/rooms/[pin]/command` - Mobile-to-desktop command relay with validation
- `POST /api/visualizador/rooms/[pin]/state` - Desktop-to-mobile state broadcast

### 4. Desktop Integration
- `useRemoteRoom` hook: creates room on mount, SSE connection for commands, debounced pushState (100ms)
- ProjectionControls: QR code (120px, white-on-dark), bold monospace PIN, connection dot, "Copiar enlace" button
- page.tsx: maps RemoteCommand to dispatch actions, pushes RemoteState on every state change

### 5. Mobile Control Page (`/visualizador/control`)
- PIN entry form (4-digit numeric, auto-connect from URL `?pin=`)
- SSE connection with reconnection handling
- Touch-friendly dark UI (min-h-screen bg-zinc-950):
  - Current hymn name, slide label, slide counter
  - Prev/Next navigation buttons (h-14 touch targets)
  - Negro/Limpiar/Logo mode buttons with active highlighting
  - "Mostrar diapositiva" button (contextual, appears when not in slide mode)
  - Play/Pause audio toggle
  - Connection status footer with PIN reference

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ab9bb68 | Room store, 4 API routes, remote types |
| 2 | 16ac804 | Desktop integration: useRemoteRoom, QR, state push |
| 3 | 1e88427 | Mobile control page at /visualizador/control |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Suspense boundary for useSearchParams**
- **Found during:** Task 3 build verification
- **Issue:** Next.js 16 requires useSearchParams() to be wrapped in Suspense
- **Fix:** Split ControlPage into a wrapper component with Suspense fallback
- **Files modified:** app/visualizador/control/page.tsx

**2. [Rule 2 - Missing functionality] Added control layout for metadata**
- **Found during:** Task 3
- **Issue:** Client component cannot export metadata; control page needed a title
- **Fix:** Created app/visualizador/control/layout.tsx with metadata export
- **Files modified:** app/visualizador/control/layout.tsx (new)

**3. [Rule 3 - Blocking] npm install required --legacy-peer-deps**
- **Found during:** Task 2
- **Issue:** qrcode.react install failed with peer dep conflicts
- **Fix:** Used --legacy-peer-deps flag (matches existing Docker build pattern)

## Known Stubs

None - all data flows are fully wired.

## Self-Check: PASSED

All 12 files verified present. All 3 commits verified in git log.
