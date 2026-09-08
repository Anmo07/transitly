# ============================================================================
# Transitly — Multi-stage Production Dockerfile
# Node.js Express + PostGIS + Redis Microservices & Unified Frontend
# ============================================================================

# ---- Stage 1: Build CSS & Static Assets ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies needed for CSS compilation
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source, templates, and Tailwind/PostCSS configs
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js postcss.config.js ./
RUN npm run build:css:min

# ---- Stage 2: Production Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Stage 3: Production Runtime Image ----
FROM node:22-alpine AS runner
LABEL maintainer="Anmo07 <anmolrajotiya@gmail.com>"
LABEL org.opencontainers.image.title="Transitly"
LABEL org.opencontainers.image.description="Enterprise Intercity Bus Parcel Logistics Platform"

WORKDIR /app

# Upgrade OS packages to patch vulnerabilities (e.g., openssl)
# and remove npm to eliminate npm-related vulnerabilities (tar, brace-expansion)
RUN apk upgrade --no-cache && \
  rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Security: run as non-root
RUN addgroup --system --gid 1001 transitly && \
  adduser --system --uid 1001 transitly

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source & built assets
COPY package.json run.js ./
COPY sitemap.svg sitemap.mmd ./
COPY src/ ./src/
COPY public/ ./public/
COPY --from=builder /app/public/css/style.css ./public/css/style.css
COPY docs/ ./docs/

# Set file ownership to non-root user
RUN chown -R transitly:transitly /app

# Switch to non-root user
USER transitly

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Launch production server
CMD ["node", "src/server.js"]
