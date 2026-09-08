# Transitly — Intercity Public Bus Cargo & Multimodal Parcel Platform

[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://transitly.netlify.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://transitly-api.onrender.com)
[![Neon](https://img.shields.io/badge/Database-Neon_Postgres-00E599?style=flat-square&logo=neon&logoColor=white)](https://neon.tech)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

> **Transitly** is an enterprise-grade multimodal parcel logistics platform that monetizes idle public transportation cargo capacity (intercity buses, state transit fleets) for scheduled, low-cost freight delivery. It pairs public transit trunk routes with hyper-local first/last-mile delivery partners (Uber Direct, Rapido, inDrive), powered by real-time GPS telematics via WebSockets, PostGIS spatial indexing, and NIST SP 800-63B compliant cryptographic authentication.

---

## 🌐 Live Hosted Infrastructure

The platform is deployed and running across serverless cloud primitives:

| Component | Platform | Live URL / Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Netlify | [https://transitly.netlify.app](https://transitly.netlify.app) | ![Netlify Status](https://img.shields.io/badge/Status-Online-emerald?style=flat-square) |
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
* **Two-Step Cryptographic Verification (NIST SP 800-63B):** Salted SHA-256 OTP verification, purpose-binding, per-destination rate limits (5 sends/hr), exponential backoff, and tamper-resistant audit logging.
* **Dual-Path Telemetry Engine:**
  * **Fast Path (Redis Streams):** High-throughput `XADD` GPS coordinates fan out to WebSockets for live driver/bus tracking at $<100\text{ms}$ latency.
  * **Slow Path (PostgreSQL + PostGIS):** Batched spatial flushes write immutable GPS breadcrumbs using `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
* **State Machine & OCC Sagas:** Booking, dispatch, and settlement lifecycles enforce Optimistic Concurrency Control (`version` checks) with automated compensation rollbacks.

---

## 📦 Planned Roles

| Role | Responsibility |
| :--- | :--- |
| **Customer** | Books parcels, calculates dynamic quotes, tracks shipments in real-time, manages saved addresses & payments. |
| **Operator** | Publishes scheduled vehicle routes, manages cargo weight/volume capacity slots, tracks fleet health. |
| **Operations Manager (Admin)** | Fleet command center, resolves transit exceptions, monitors telemetry health, audits system logs. |
| **Delivery Partner (Rider)** | Dedicated cockpit view (`/rider-dashboard.html`), priority dispatch offers, geofenced handoffs (<100m), cash-out ledger. |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* **Node.js:** 20 LTS or newer (`node --version`)
* **npm:** 10+ (`npm --version`)
* **Docker & Docker Compose:** *(Optional, for containerized local PostGIS + Redis)*

### 2. Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/Anmo07/transitly.git
cd transitly

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Database Initialization & Seeding
```bash
# Initialize schema, PostGIS extensions, and seed master routes & users
npm run db:init

# Inspect tables, multimodal shipments, and spatial geometries in terminal
npm run db:inspect
```

### 4. Run Development Server
```bash
# Start backend server with nodemon (Port 4000)
npm run dev

# Or run the unified process orchestrator (compiles Tailwind, verifies DB, binds server)
npm start
```

Visit the local application at **`http://localhost:4000`** (or `http://localhost:3000`).

---

## 🐳 Docker Deployment

The project includes a production-grade multi-stage Dockerfile and Docker Compose setup:

```bash
# Launch entire stack (App + Redis 7 + PostgreSQL 16 PostGIS)
docker compose up -d --build

# View container logs
docker compose logs -f app

# Stop containers
docker compose down
```

---

## 🧪 Verification & Automated Test Suites

Transitly features comprehensive automated end-to-end and unit test suites:

```bash
npm test
```

### Test Suite Breakdown
1. **Security Utility Tests:** Cryptographic OTP hashing, constant-time verification, QR seal signatures, geofence boundary math.
2. **Architecture & Domain Tests:** Optimistic concurrency control, booking saga rollbacks, state machine transitions.
3. **Last-Mile Orchestration:** Feasibility matrix, provider adapter fallback (Uber Direct, inDrive, Regional).
4. **WhatsApp Assistant:** Event notification templates, inbound bus route intent bot, sensitive data redaction.
5. **Telemetry Ingestion Engine:** Redis stream buffer, PostGIS bulk geometry persistence, stream consumer groups.
6. **Master Database Schema:** 16 relational tables, PostGIS spatial indexes (`GIST`), DDD schema evolution.
7. **Intercity Corridors:** Haryana Roadways Delhi $\leftrightarrow$ Chandigarh routes, Meta webhook security challenge.
8. **Admin Security & Biometrics:** Master password, WebAuthn FIDO2 biometric challenges, emergency recovery dispatch.
9. **Legal, Policy & SEO:** Privacy Policy, Terms, FAQ, SVG vector sitemap (`/sitemap.svg`), Mermaid text sitemap (`/sitemap.mmd`), custom 404 handler.
10. **User Authentication & Route Gates:** Two-step OTP verification, server & client authorization gates, Google/Apple SSO.
11. **Delivery Partner Infrastructure:** Duty toggle, spatial dispatch queue, 30s TTL locks, 4-digit recipient PIN, instant payouts.

---

## 📖 Architecture & Documentation References

* **[Master Product Requirements Document (PRD)](PRD.md)**
* **[Master Technical Documentation](docs/PROJECT_DOCUMENTATION.md)**
* **[Technical Requirements Document (TRD)](docs/TRD.md)**
* **[PostgreSQL & PostGIS Terminal Operations Guide](docs/POSTGRES_TERMINAL_GUIDE.md)**
* **[Interactive Swagger API Documentation](https://transitly-api.onrender.com/api/docs)**

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
