# ============================================================================
# Transitly — Multi-stage Production Dockerfile
# Node.js Express + Static Frontend (Google Stitch Design)
# ============================================================================

# ---- Stage 1: Build CSS & Assets ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install all dependencies including devDependencies for Tailwind CSS
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and public assets to build CSS bundle
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js postcss.config.js ./
RUN npm run build:css:min

# ---- Stage 2: Production Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Stage 3: Production Image (Runner) ----
FROM node:22-alpine AS runner
LABEL maintainer="Anmo07 <anmolrajotiya@gmail.com>"
LABEL org.opencontainers.image.title="Transitly"
LABEL org.opencontainers.image.description="Bus-to-Door Intercity Parcel Logistics Platform"

WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 transitly && \
    adduser --system --uid 1001 transitly

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source & built CSS
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY --from=builder /app/public/css/style.css ./public/css/style.css
COPY docs/ ./docs/

# Set ownership
RUN chown -R transitly:transitly /app

# Switch to non-root user
USER transitly

# Environment defaults (overridable via docker-compose or --env-file)
ENV NODE_ENV=production
ENV PORT=3000

# Expose Express server port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "src/server.js"]
