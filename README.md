# Transitly — Intercity Public Bus Cargo & Multimodal Parcel Platform

[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://transitly.netlify.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://transitly-api.onrender.com)
[![Neon](https://img.shields.io/badge/Database-Neon_Postgres-00E599?style=flat-square&logo=neon&logoColor=white)](https://neon.tech)
[![Security: Zero-Leakage](https://img.shields.io/badge/Security-Zero--Leakage%20Verified-blueviolet?style=flat-square)](docs/POSTMAN_SECURITY_WORKFLOWS.md)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

> **Transitly** is an enterprise-grade multimodal parcel logistics platform that monetizes idle public transportation cargo capacity (intercity buses, state transit fleets) for scheduled, low-cost freight delivery. It pairs public transit trunk routes with hyper-local first/last-mile delivery partners (Uber Direct, Rapido, inDrive), powered by a modern **React 18/19 Single Page Application**, real-time GPS telematics via WebSockets, PostGIS spatial indexing, Higgsfield 3D WebGL2 cargo-bay frame scrubbers, and NIST SP 800-63B compliant cryptographic authentication.

---

## 🌐 Live Hosted Infrastructure

The platform is deployed and running across serverless cloud primitives:

| Component | Platform | Live URL / Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **Frontend SPA & Static Fallback** | Netlify | [https://transitly.netlify.app](https://transitly.netlify.app) | ![Netlify Status](https://img.shields.io/badge/Status-Online-emerald?style=flat-square) |
| **Core REST & WebSocket API** | Render | [https://transitly-api.onrender.com](https://transitly-api.onrender.com) | ![Render Status](https://img.shields.io/badge/Status-Online-emerald?style=flat-square) |
| **Health Monitor** | Render | [https://transitly-api.onrender.com/health](https://transitly-api.onrender.com/health) | ![Health Check](https://img.shields.io/badge/Health-200%20OK-emerald?style=flat-square) |
| **OpenAPI / Swagger UI** | Render | [https://transitly-api.onrender.com/api/docs](https://transitly-api.onrender.com/api/docs) | ![Interactive Docs](https://img.shields.io/badge/Docs-Swagger%20v1-blue?style=flat-square) |
| **Spatial Database (PostGIS)** | Neon | `muddy-mountain-78061291` (`production`) | ![PostGIS 3.6](https://img.shields.io/badge/PostGIS-3.6%20Active-blue?style=flat-square) |

---

## 🏗️ System Architecture & Multimodal Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TRANSITLY SYSTEM TOPOLOGY                                 │
│                                                                                        │
│   [Sender Doorstep]                                                                    │
│          │                                                                             │
│          ▼ (First-Mile Partner / Uber Direct / InDrive)                                │
│   [Origin ISBT Hub Terminal] (e.g. Kashmere Gate, Delhi)                               │
│          │                                                                             │
│          ▼ (Scheduled Intercity Bus Trunk Line / Haryana Roadways Luggage Bay)         │
│   [Destination Terminal] (e.g. Sector 17 ISBT, Chandigarh)                             │
│          │                                                                             │
│          ▼ (Last-Mile Delivery Partner / Regional Courier)                             │
│   [Recipient Doorstep]                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Highlights
* **Trunk-and-Feeder Hierarchy:** Long-haul intercity journeys run on scheduled public transit capacity at a fraction of air courier cost, while hyper-local legs handle doorstep pickup and delivery.
* **Dual Geolocation Feasibility Matrix:** Independent origin and destination checks calculate serviceability across 4 modes: Door-to-Door, Home $\rightarrow$ Terminal, Terminal $\rightarrow$ Home, or Terminal-to-Terminal.
* **Two-Step Cryptographic Verification (NIST SP 800-63B):** Salted SHA-256 OTP verification, purpose-binding (`login`, `signup`, `reset_password`, `confirm_payment`), per-destination rate limits (5 sends/hr), exponential backoff, and tamper-resistant audit logging.
* **Dual-Path Telemetry Engine:**
  * **Fast Path (Redis Streams):** High-throughput `XADD` GPS coordinates fan out to WebSockets for live driver/bus tracking at $<100\text{ms}$ latency.
  * **Slow Path (PostgreSQL + PostGIS):** Batched spatial flushes write immutable GPS breadcrumbs using `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
* **State Machine & OCC Sagas:** Booking, dispatch, and settlement lifecycles enforce Optimistic Concurrency Control (`version` checks) with automated compensation rollbacks.
* **Micro3D Tactile Physics Engine:** Pointer-tracked zero-reflow $\pm 6^\circ$ perspective tilt, mechanical press scaling, canvas particle emitters, and HTML5 Web Vibration API integration.

---

## 📂 Monorepo Directory & Essential Files Matrix

Transitly is architected as a modular monorepo cleanly partitioning the modern React SPA, backend domain services, static fallbacks, and developer tooling:

```
Transitly/
├── client/                              # Modern React 18/19 Single Page Application (SPA)
│   ├── index.html                       # Single Page Application HTML mount point
│   └── src/
│       ├── App.jsx                      # 23-route application router with <RoleRoute> gatekeeping
│       ├── index.css                    # Tailwind directives, glassmorphic styles & 3D layout containment
│       ├── main.jsx                     # React 18 root mounting with BrowserRouter & AuthProvider
│       ├── components/                  # Atomic Design Component Hierarchy
│       │   ├── atoms/                   # Button3D, Input3D, Icon, Badge, Card3D
│       │   ├── molecules/               # DutyToggle, SearchBar, CorridorTimeline, CargoBayModal,
│       │   │                            # DispatchQueue, OtpPinInput, SwipeConfirm, TelematicsHud
│       │   ├── organisms/               # WebGLScrubber (60 FPS canvas), LiveMap (Leaflet GIS)
│       │   └── layouts/                 # CustomerLayout, PartnerLayout, AuthLayout
│       ├── hooks/                       # useMicro3D, useScrubber, useAuth, useSocket
│       └── pages/                       # 23 Application Views (Customer, Partner, Public)
│
├── src/                                 # Enterprise Express 5 & PostGIS Backend
│   ├── app.js                           # Express app setup, compression, static routes, security headers
│   ├── server.js                        # HTTP & WebSocket (Socket.io) server entrypoint
│   ├── api/routes/apiRoutes.js          # Consolidated REST endpoints across 8 business domains
│   ├── api/swagger.yaml                 # OpenAPI 3.0 canonical specification (/api/docs)
│   ├── config/                          # Centralized PostgreSQL (pg.Pool) & Redis connection pools
│   ├── db/migrations/                   # Versioned DDL migrations (000, 001, 002, 003_expressive_views)
│   ├── db/seeds/                        # Seed data (users, DTC buses, Haryana Roadways express corridors)
│   ├── models/                          # PostgreSQL DAOs (Shipment, Leg, CapacitySlot, CustodyHandoff, POD)
│   ├── modules/                         # Business domains: bookings, capacity, pricing, lastMile, tracking, whatsapp
│   ├── sagas/bookingSaga.js             # Multimodal distributed booking saga with compensation rollback
│   ├── utils/security.js                # HMAC-SHA256 QR seals, timing-safe OTP verify, PostGIS geofencing
│   └── websockets/trackingSocket.js     # Real-time GPS broadcast via Redis pub/sub
│
├── public/                              # Production Distribution & Static Fallbacks
│   ├── dist/                            # Production Vite React SPA bundle (index.html, JS/CSS chunks)
│   ├── pages/                           # 23 Static Semantic HTML Templates (SSR Fallback)
│   ├── assets/3d/                       # Pre-rendered Higgsfield WebGL2 frame sequences (75 WebP frames)
│   ├── css/ & js/                       # Modular CSS stylesheets & ES controllers for static pages
│   ├── sitemap.svg & sitemap.mmd        # Scalable Vector Graphics & Mermaid platform topology sitemaps
│   └── _redirects                       # Netlify SPA routing rules & API proxying
│
├── scripts/                             # Operational CLI & Developer Tooling
│   ├── db-studio.js                     # Browser-based DB Studio (Local Postgres + Neon Cloud switcher)
│   ├── generate-postman-artifacts.js    # Postman Cloud SDK synchronizer & artifact exporter
│   ├── generate-3d-scrubbers.js         # WebGL2 sequence generator
│   ├── generate-demo-frames.js          # Procedural canvas frame generator for 3D scrubber demos
│   └── ingest-higgsfield-video.js       # Video-to-frame WebGL pipeline
│
├── docs/                                # Enterprise Technical Documentation & API Specifications
│   ├── PROJECT_DOCUMENTATION.md         # Master architectural reference & operations manual
│   ├── TRD.md                           # Technical Requirements Document & engineering constraints
│   ├── POSTMAN_SECURITY_WORKFLOWS.md    # Postman Cloud encrypted workflow specification & guide
│   ├── POSTGRES_TERMINAL_GUIDE.md       # Interactive PostgreSQL & PostGIS CLI terminal runbook
│   ├── stitch_design_prompts.md         # UI/UX design specifications & prompt catalog
│   ├── transitly_postman_collection.json # Versioned Postman v2.1.0 Collection (32 encrypted requests)
│   └── transitly_postman_environment.json # Versioned Postman Environment (secret variables)
│
├── tests/                               # 16 Comprehensive Automated Test Suites
└── Root Configs                         # Dockerfile, docker-compose.yml, package.json, vite.config.js,
                                         # tailwind.config.js, postcss.config.js, netlify.toml, render.yaml
```

---

## 📦 Dependencies & Technology Stack Breakdown

All project dependencies are declared in [`package.json`](package.json) and locked in `package-lock.json`:

### Production Runtime Dependencies

| Package | Version | Architectural Role & Usage |
| :--- | :--- | :--- |
| **`express`** | `^5.2.1` | Next-generation asynchronous web and REST API routing framework |
| **`react`** | `^19.3.0` | Declarative UI component library with Concurrent Rendering |
| **`react-dom`** | `^19.3.0` | React DOM renderer for browser mounting |
| **`react-router-dom`** | `^7.18.4` | Client-side routing engine with `<RoleRoute>` domain isolation |
| **`pg`** | `^8.23.0` | High-performance PostgreSQL client connection pool supporting PostGIS |
| **`@neon/config`** | `^1.3.1` | Neon Cloud Serverless PostgreSQL connection and pooling configuration |
| **`@neon/env`** | `^1.2.2` | Automated branch environment variable injection for Neon |
| **`ioredis`** | `^6.0.0` | Robust Redis client powering Fast Path streams, GeoSearch, and Pub/Sub |
| **`bullmq`** | `^6.1.2` | Distributed message queue for asynchronous email and notification dispatch |
| **`socket.io`** | `^4.8.3` | Low-latency bi-directional WebSocket telemetry broadcast engine |
| **`jsonwebtoken`** | `^9.0.3` | Cryptographically signed HS256 JWT session tokens for client auth |
| **`bcryptjs`** | `^3.0.3` | Constant-time password hashing and verification |
| **`helmet`** | `^8.3.0` | Production HTTP security headers (CSP, HSTS, X-Frame-Options) |
| **`cors`** | `^2.8.6` | Configurable Cross-Origin Resource Sharing middleware |
| **`compression`** | `^1.8.1` | Gzip/Brotli response compression for optimized payload delivery |
| **`morgan`** | `^1.11.0` | HTTP request logging and latency measurement |
| **`swagger-ui-express`** | `^5.0.1` | Embedded interactive OpenAPI 3.0 documentation explorer (`/api/docs`) |
| **`yamljs`** | `^0.3.0` | YAML parsing engine for canonical OpenAPI specification loading |
| **`nodemailer`** | `^9.1.0` | Transactional email delivery client for notifications and receipts |
| **`dotenv`** | `^17.4.2` | Environment configuration manager loading `.env` variables |

### Development & Build Dependencies

| Package | Version | Architectural Role & Usage |
| :--- | :--- | :--- |
| **`vite`** | `^8.3.0` | Next-generation ultra-fast frontend build tool and HMR dev server |
| **`@vitejs/plugin-react`** | `^6.1.1` | Official Vite plugin providing React Fast Refresh and JSX compilation |
| **`tailwindcss`** | `^3.4.19` | Utility-first CSS framework generating tactile 3D and glassmorphic designs |
| **`postcss`** | `^8.5.26` | CSS transformation pipeline processing modern CSS syntax |
| **`autoprefixer`** | `^10.5.4` | Automated vendor prefixing for cross-browser CSS compatibility |
| **`nodemon`** | `^3.1.14` | Hot-reloading development process monitor for Express backend |
| **`neon`** | `^4.14.3` | Neon Serverless CLI integration tooling |

---

## 🔒 Security Architecture & Zero-Leakage Guarantee

Transitly strictly enforces enterprise-grade security practices to prevent credential leakage and vulnerabilities:

> ### 🛡️ Zero Tracked Secrets Verified
> - **No Hardcoded Secrets:** No live database passwords, API keys, private keys (`.pem`, `.key`), JWT secrets, or cloud tokens are tracked in this repository.
> - **Zero-Trust Environment Template:** [` .env.example `](.env.example) contains only structured placeholders (`replace_with_...`) and local development defaults (`localhost:5432`).
> - **Strict `.gitignore` Enforcement:** The repository ignores all `.env`, `.env.*`, `*credential*`, `*secret*`, `*.pem`, `*.key`, `*.cert`, `*.pfx`, `id_rsa*`, `Connections*.plist`, and database dumps.
> - **Masked Postman Tokens:** All Postman variables (`jwt_token`, `auth_otp`, `idempotency_key`, `webhook_verify_token`) are declared as `type: "secret"` in [`docs/transitly_postman_environment.json`](docs/transitly_postman_environment.json), preventing credential exposure in logs or UI.
> - **NIST SP 800-63B §5.1.4 Compliance:** All OTP codes are purpose-bound, salted with 8 random bytes, hashed with SHA-256, verified in constant time via `crypto.timingSafeEqual`, and auto-invalidated after single use.
> - **Domain Isolation Gatekeeper:** The `<RoleRoute>` wrapper prevents cross-domain data leakage, redirecting Customers visiting driver cockpit routes to `/`, and Delivery Partners to `/rider-dashboard`.

---

## 🚀 Operations & npm Scripts Reference

The root [`package.json`](package.json) provides unified task runners for local development, database administration, 3D graphics generation, and test execution:

| Script | Command | Purpose & Environment |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon src/server.js` | Starts Express backend on `http://localhost:4000` with hot-reload |
| `npm run dev:react` | `vite` | Starts Vite React SPA development server on `http://localhost:5173` |
| `npm run build:react` | `vite build` | Compiles production React SPA bundle into `public/dist/` |
| `npm start` | `node run.js` | Unified process runner (verifies DB, builds Tailwind, launches on Port 3000) |
| `npm run db:init` | `node src/db/initDb.js` | Executes DDL migrations (000-003) & seeds on Cloud Neon DB |
| `npm run db:init:local` | `DATABASE_URL=... initDb.js` | Executes DDL migrations & seeds on local Postgres.app instance |
| `npm run db:inspect` | `node src/db/viewDb.js` | CLI diagnostic table & PostGIS geometry inspector (Cloud Neon) |
| `npm run db:inspect:local`| `DATABASE_URL=... viewDb.js` | CLI diagnostic table & PostGIS geometry inspector (Local DB) |
| `npm run db:visualize` | `node scripts/db-studio.js` | Launches interactive browser-based DB Studio on `http://localhost:5050` |
| `npm run db:tableplus` | `open -a TablePlus ...` | Launches native TablePlus connected to Local Postgres (`localhost:5432`) |
| `npm run db:tableplus:cloud` | `open -a TablePlus "$DATABASE_URL"` | Launches native TablePlus connected to Neon Cloud Postgres |
| `npm run postman:generate`| `node scripts/generate-postman-artifacts.js` | Regenerates versioned Postman collection and environment JSON files |
| `npm run 3d:scan` | `node scripts/generate-3d-scrubbers.js` | Generates WebGL2 frame scrubber sequences from input media |
| `npm run 3d:frames` | `node scripts/generate-demo-frames.js` | Procedurally generates demo WebP frames for 3D scrubber canvas |
| `npm run 3d:ingest` | `node scripts/ingest-higgsfield-video.js` | Extracts 75 WebP frames from Higgsfield AI camera sweep video |
| `npm run build:css` | `tailwindcss -i ... -o ...` | Compiles Tailwind CSS input into `public/css/style.css` |
| `npm test` | `node tests/*.test.js` | Executes all 16 automated test suites in sequence (100% passing) |

---

## 🧪 Verification & Automated Test Suites (16 Master Suites)

Transitly enforces 100% passing automated test assertions across 16 domain test suites:

```bash
npm test
```

### Complete Test Suite Catalog
1. **`tests/security.test.js`**: Cryptographic OTP hashing, constant-time verification, QR seal signatures, geofence boundary math.
2. **`tests/architecture.test.js`**: Optimistic Concurrency Control (`version` checks), booking saga rollbacks, state machine transitions.
3. **`tests/lastMile.test.js`**: Last-Mile Feasibility Matrix, provider adapter fallbacks (Uber Direct, inDrive, Regional courier).
4. **`tests/whatsapp.test.js`**: WhatsApp notification templates, conversational intent classification bot, PII redaction.
5. **`tests/telemetry.test.js`**: Redis Fast Path stream buffer (`XADD`), PostGIS bulk geometry persistence, durable consumer groups.
6. **`tests/schema.test.js`**: 16 relational tables, PostGIS spatial columns (`GEOMETRY(Point, 4326)`), GIST indexing.
7. **`tests/haryanaRoadways.test.js`**: Haryana Roadways Delhi $\leftrightarrow$ Chandigarh express corridors, Meta webhook challenge verification.
8. **`tests/adminAuth.test.js`**: Admin authentication security, FIDO2 biometric credentials, RBAC route gates.
9. **`tests/legalAndSeoRoutes.test.js`**: Privacy Policy, Terms, FAQ, SVG vector sitemap (`/sitemap.svg`), Mermaid sitemap (`/sitemap.mmd`), custom 404 handler.
10. **`tests/authLanding.test.js`**: Two-step OTP verification, server & client authorization gates, Google/Apple SSO, anti-injection sanitization.
11. **`tests/proofOfDelivery.test.js`**: Digital Proof of Delivery, signature captures, delivery photos, PostGIS handoff coordinates.
12. **`tests/riderWorkflow.test.js`**: Driver duty state machine, real-time GPS location updates, assigned task lifecycles.
13. **`tests/deliveryPartnerSuite.test.js`**: Cockpit metrics, 30s TTL dispatch locks, 4-digit recipient PIN, geofenced handoffs (<150m), IMPS cash-outs.
14. **`tests/trackingAndNotificationInTransit.test.js`**: In-transit notification suppression, clean badges, unobstructed map viewport recalibration.
15. **`tests/reactMigrationVerification.test.js`**: React SPA mounting, deep routing, 23 application views validation, 3D CSS containment.
16. **`tests/postmanWorkflow.test.js`**: Postman Cloud 32-request synchronization, secret variable masking, dynamic token chaining assertions.

---

## 📖 Architecture & Documentation References

* **[Master Technical Documentation](docs/PROJECT_DOCUMENTATION.md)** — Comprehensive architecture, 23-view registry, atomic design system, and operations guide
* **[Technical Requirements Document (TRD)](docs/TRD.md)** — Canonical technical specifications, NFRs, and performance budgets
* **[Postman Secure & Encrypted API Workflows Guide](docs/POSTMAN_SECURITY_WORKFLOWS.md)** — 32-request Postman Cloud workflow runbook
* **[PostgreSQL & PostGIS Terminal Operations Guide](docs/POSTGRES_TERMINAL_GUIDE.md)** — Interactive CLI terminal guide for spatial querying
* **[Master Product Requirements Document (PRD)](PRD.md)** — Product vision, business objectives, and user stories
* **[Interactive Swagger API Documentation](https://transitly-api.onrender.com/api/docs)** — Live OpenAPI 3.0 specification

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

