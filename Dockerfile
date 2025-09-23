# syntax=docker/dockerfile:1.7

# ---------- Base ----------
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- builder ----------
FROM deps AS builder
WORKDIR /app
COPY . .

# Build-args para variables públicas (ajusta/añade las que uses)
ARG NEXT_PUBLIC_DIRECTUS_URL
ENV NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL}

RUN npm run build

# ---------- runner (standalone) --------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Herramienta para healthcheck
RUN apk add --no-cache curl

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

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