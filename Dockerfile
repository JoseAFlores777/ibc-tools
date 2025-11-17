# syntax=docker/dockerfile:1.7

##########################
#  Base
##########################
FROM node:20-bookworm-slim AS base

# Aseguramos PATH y desactivamos telemetría
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/app/node_modules/.bin"

WORKDIR /app


##########################
#  deps: instala dependencias de sistema + npm install
##########################
FROM base AS deps

# Dependencias del sistema necesarias para sharp / build
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copiamos sólo los manifest de npm
# (si no usas lockfile, puedes borrar la línea de package-lock.json)
COPY package.json package-lock.json* ./

# Config de npm para acelerar
ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Usamos ruta absoluta a npm para evitar problemas de PATH en Jenkins
RUN --mount=type=cache,target=/root/.npm \
    /usr/local/bin/npm install --include=dev


##########################
#  builder: build de Next
##########################
FROM deps AS builder

WORKDIR /app
COPY . .

# Build args que vienen de Jenkins (ajusta/añade según necesites)
ARG NEXT_PUBLIC_DIRECTUS_HOST
ARG NEXT_PUBLIC_DIRECTUS_URL
ARG NEXT_PUBLIC_CHATWOOT_BASE_URL
ARG NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN

# Variables públicas para Next.js
ENV NEXT_PUBLIC_DIRECTUS_HOST=${NEXT_PUBLIC_DIRECTUS_HOST} \
    NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL} \
    NEXT_PUBLIC_CHATWOOT_BASE_URL=${NEXT_PUBLIC_CHATWOOT_BASE_URL} \
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=${NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN}

# Build de la app (ruta absoluta a npm)
RUN /usr/local/bin/npm run build


##########################
#  runner: imagen final (standalone)
##########################
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_CACHE_DIR=/tmp/next-cache \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# curl para healthcheck
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Usuario no root
RUN groupadd -g 1001 nodejs \
 && useradd -m -u 1001 -g nodejs nextjs

# Copia del bundle standalone generado por Next
# (asegúrate que en next.config.mjs tengas `output: 'standalone'`)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Permisos para cache de Next
RUN mkdir -p /tmp/next-cache \
 && chown -R nextjs:nodejs /tmp/next-cache

EXPOSE 3000

# Healthcheck sencillo
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/ || exit 1

USER nextjs

# server.js viene del output standalone de Next
CMD ["node", "server.js"]