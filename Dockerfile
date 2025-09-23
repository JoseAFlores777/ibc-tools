# syntax=docker/dockerfile:1.7

# ---------- Base ----------
FROM node:20-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
# Dependencias del sistema necesarias para sharp (en Debian/Bookworm suelen existir binarios precompilados)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiamos SOLO package.json (sin lockfile)
COPY package.json ./

# Instalar desde package.json (sin lock); incluye dev deps para el build
ENV NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
RUN --mount=type=cache,target=/root/.npm npm install --include=dev

# ---------- builder ----------
FROM deps AS builder
WORKDIR /app
COPY . .

# Build-args para variables públicas (ajusta/añade las que uses)
ARG NEXT_PUBLIC_DIRECTUS_URL
ENV NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL}

RUN npm run build

# ---------- runner (standalone) --------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_CACHE_DIR=/app/.next/cache \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Herramienta para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN groupadd -g 1001 nodejs && useradd -m -u 1001 -g nodejs nextjs

# Copia el bundle standalone + estáticos + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Asegurar permisos para cache de Next.js (evita EACCES en /app/.next/cache)
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app

EXPOSE 3000

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/ || exit 1

USER nextjs
CMD ["node", "server.js"]