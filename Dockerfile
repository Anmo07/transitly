# ============================================================================
# Transitly — Multi-stage Production Dockerfile
# Node.js Express + PostGIS + Redis Microservices + React.js SPA + WebGL2
# ============================================================================

# ---- Stage 1: Build CSS, React SPA & Static Assets ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install all dependencies (including devDependencies needed for Vite & Tailwind)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy configurations and source trees
COPY tailwind.config.js postcss.config.js vite.config.mjs ./
COPY src/ ./src/
COPY public/ ./public/
COPY client/ ./client/

# Compile production CSS bundle and React Single Page Application
RUN npm run build:css:min && npm run build:react

# ---- Stage 2: Production Runtime Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Stage 3: Production Minimal Runtime Image ----
FROM node:22-alpine AS runner
LABEL maintainer="Anmo07 <anmolrajotiya@gmail.com>"
LABEL org.opencontainers.image.title="Transitly"
LABEL org.opencontainers.image.description="Enterprise Intercity Bus Parcel Logistics Platform & 3D Telematics"

WORKDIR /app

# Upgrade OS packages to patch vulnerabilities and remove npm CLI
RUN apk upgrade --no-cache && \
  rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Security: non-root user and group
RUN addgroup --system --gid 1001 transitly && \
  adduser --system --uid 1001 transitly

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application runtime files
COPY package.json run.js ./
COPY src/ ./src/
COPY public/ ./public/
COPY --from=builder /app/public/css/style.css ./public/css/style.css
COPY --from=builder /app/public/dist ./public/dist
COPY docs/ ./docs/

# Enforce non-root file ownership
RUN chown -R transitly:transitly /app

USER transitly

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Automated healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the Transitly production server
CMD ["node", "src/server.js"]
