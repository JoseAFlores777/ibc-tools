# Quick Task: Security Mitigations

## Goal
Fix 20 vulnerabilities from security audit across 3 phases.

## Task 1: Input validation + token fix
- api/hymns/audio/[fileId]/route.ts: UUID validation
- api/hymns/[id]/route.ts: UUID validation
- api/events/route.ts: Clamp limit 1-100
- lib/directus/services/hymns.ts: Replace getAssetUrl token-in-URL with fetchAsset using Auth header
- lib/zip/generate-hymn-zip.ts: Use fetchAsset instead of getAssetUrl+fetch

## Task 2: Security headers + package protection
- next.config.mjs: Add security headers to all routes
- api/hymns/package/route.ts: Content-Length check (1MB max)

## Task 3: Error sanitization
- lib/zip/generate-hymn-zip.ts: Sanitize ERROR.txt messages
- All API routes: Ensure generic error messages to client
