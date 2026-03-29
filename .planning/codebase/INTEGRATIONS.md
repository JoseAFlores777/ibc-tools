# External Integrations

**Analysis Date:** 2026-03-28

## APIs & External Services

**Directus CMS:**
- Service: Headless content management system
- What it's used for: Central data source for hymns, church events, programs, authors, church members, and all domain data
  - SDK/Client: @directus/sdk 17.0.0
  - Server initialization: `app/lib/directus.tsx` (singleton getDirectus())
  - Service layer: `app/lib/directus/services/` (e.g., `events.ts`)
  - Types: Auto-generated in `app/lib/directus/directus.interface.ts`
  - Authentication: None (public read access configured)
  - Env vars: `DIRECTUS_URL` (server-only, preferred), `NEXT_PUBLIC_DIRECTUS_URL` (browser fallback)
  - Base URLs:
    - Development: `http://localhost:8055`
    - Production: `https://admin.ibchn.org`

**Chatwoot (Customer Support Widget):**
- Service: Omnichannel customer engagement platform
- What it's used for: Live chat and support widget embedded in production frontend
  - SDK/Client: Dynamically loaded JavaScript SDK
  - Initialization: `app/layout.tsx` (lines 38-60) - Conditional script injection
  - Loading: `afterInteractive` strategy (non-blocking)
  - Auth: `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` (token-based)
  - Env vars:
    - `NEXT_PUBLIC_CHATWOOT_BASE_URL` (e.g., https://atencion.ibchn.org)
    - `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` (website token)
  - Trigger: Script loads only in production when both env vars are defined
  - Script source: `{BASE_URL}/packs/js/sdk.js`
  - Window integration: `window.chatwootSDK.run()`

**Analytics (joseiz.com):**
- Service: Web analytics tracking
- What it's used for: Usage metrics and behavior tracking
  - Script: `https://analytics.joseiz.com/script.js`
  - Data attribute: `data-website-id="097889f1-b030-4066-9a99-29e6e308ac27"`
  - Trigger: Production environment only
  - Loading: `afterInteractive` strategy (non-blocking)
  - Initialization: `app/layout.tsx` (lines 33-37)

## Data Storage

**Databases:**
- Type/Provider: Directus-managed (SQL backend, typically PostgreSQL or MySQL)
- Connection: Via Directus REST API
- Client: @directus/sdk (JavaScript SDK)
- Queries: REST endpoint through SDK's `readItems()` and related methods

**File Storage:**
- S3-compatible storage at `s3.joseiz.com`
  - Used for: Asset hosting (images, documents)
  - Protocol: HTTPS
  - Integration: Image remotePatterns configured in `next.config.mjs`

**Caching:**
- HTTP caching: 5-minute cache-control headers on API responses
  - `/api/events` endpoint: `s-maxage=300, stale-while-revalidate=60`
  - `/horarios` route: `unstable_cache()` with 5-minute TTL
- Next.js cache: `NEXT_CACHE_DIR=/tmp/next-cache` (production)

## Authentication & Identity

**Directus:**
- Auth Provider: None (public read access)
- Implementation: No authentication required for CMS reads
- Note: Directus backend handles all data access control server-side

**Chatwoot:**
- Auth Provider: Token-based (website token)
- Implementation: Static token in `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`
- Scope: Read-only widget initialization (no data modification from frontend)

## Monitoring & Observability

**Error Tracking:**
- Method: Console logging (native)
- Example: `app/api/events/route.ts` logs errors to server console
- Strategy: No external error tracking service integrated
- Coverage: API routes log caught exceptions

**Logs:**
- Approach: Server-side console logging
- Visibility: Docker container stdout/stderr (captured by Docker/Dokploy)
- Examples:
  - API error logging: `console.error('GET /api/events error:', error?.message)`
  - Build-time logging: Dockerfile uses RUN commands that output to Docker build logs

**Health Checks:**
- Docker healthcheck: `curl -fsS http://localhost:3000/` every 30s
- Entry point: Root route `/` (landing page)
- Timeout: 5 seconds per check, 3 retries before unhealthy

## CI/CD & Deployment

**Hosting:**
- Platform: Dokploy (self-hosted deployment platform)
- Container runtime: Docker
- Image base: `node:20-bookworm-slim`
- Port: 3000 (Hostname 0.0.0.0 in container)

**CI Pipeline:**
- Service: Jenkins
- Trigger: `main` branch push
- Stages:
  1. Clean workspace
  2. Checkout from GitHub (https://github.com/JoseAFlores777/ibc-tools.git)
  3. Load `.env` secret file credentials
  4. Prepare Docker image metadata
  5. Docker build (with NEXT_PUBLIC_* build args)
  6. Push to Docker Hub (only on main branch)
  7. Trigger Dokploy redeploy webhook
- File: `Jenkinsfile` (declarative pipeline)
- Docker agent: `docker:27.1.2-cli`

**Build Process:**
- Build args extracted: All `NEXT_PUBLIC_*` variables passed to Docker build
- Command: `docker build [--build-arg ...] -t IMAGE_REPO:TAG -t IMAGE_REPO:latest .`
- Output: Standalone Next.js output (optimized for Docker)
- Multi-stage build:
  - base: Node.js 20 setup
  - deps: System dependencies + npm install
  - builder: Next.js compilation with env vars
  - runner: Slim production image with standalone output

**Docker Hub:**
- Registry: docker.io
- Credentials: Username + token (Jenkins credential: dockerhub-creds)
- Push condition: Only when CI environment succeeds on main branch
- Image naming: `{DOCKERHUB_NAMESPACE}/{DOCKERHUB_REPOSITORY}:TAG`

**Dokploy Deployment:**
- Trigger: Webhook (Jenkins credential: IBC_TOOLS_DOKPLOY_WEBHOOK_URL)
- Payload: `{"force":true,"pull":true}`
- Condition: Automatic on successful Docker Hub push
- Purpose: Pull latest image and restart application

## Environment Configuration

**Required env vars (production):**
- `NEXT_PUBLIC_DIRECTUS_URL` - Directus backend URL exposed to browser
- `DIRECTUS_URL` - Server-side Directus URL (preferred, server-only)
- `NEXT_PUBLIC_CHATWOOT_BASE_URL` - Chatwoot server URL (optional, widget loads only if set)
- `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` - Chatwoot auth (optional, widget loads only if set)

**Build-time only:**
- All `NEXT_PUBLIC_*` variables are embedded in the Docker image at build time
- Static values (cannot be changed after container starts)

**Secrets location:**
- Jenkins: Stored as credential type "Secret file" (credentialsId: ibc-tools-ci-env)
- File format: `.env` format (KEY=VALUE, one per line)
- Docker Hub: Username/token stored in Jenkins credentials (dockerhub-creds)
- Dokploy: Webhook URL stored in Jenkins credentials (IBC_TOOLS_DOKPLOY_WEBHOOK_URL)
- GitHub: Personal Access Token (PAT) in Jenkins credentials (github-pat)

## Webhooks & Callbacks

**Incoming:**
- `/api/events` (GET) - Public JSON API for church events
  - Response: `{ ok: true, data: ChurchEventListItem[] }`
  - Cache: 5 minutes (s-maxage=300)
  - Error response: `{ ok: false, error: string }` (HTTP 500)

**Outgoing:**
- Dokploy redeploy webhook - Triggered after Docker Hub push
  - Endpoint: `{IBC_TOOLS_DOKPLOY_WEBHOOK_URL}` (from Jenkins credential)
  - Method: POST
  - Payload: `{"force":true,"pull":true}`
  - Purpose: Redeploy with fresh image pull

## External API Patterns

**REST Client:**
- Library: @directus/sdk (REST module)
- Cache strategy: `onRequest: (options) => ({ ...options, cache: 'no-store' })`
- Error handling: Manual try-catch in API routes
- Field selection: Explicit field arrays to reduce payload

**Server-side Rendering:**
- PDF routes fetch Directus data server-side, then render @react-pdf/renderer components
- Example: `/pdf-gen/hymns/[id]` and `/pdf-gen/programs/[id]`
- Data passed to BodyProviders wrapper which renders PDF document

**Image Proxying:**
- Remote patterns configured in `next.config.mjs`
- Domains: admin.ibchn.org, fonts.gstatic.com, s3.joseiz.com
- Method: Next.js Image component optimization

---

*Integration audit: 2026-03-28*
