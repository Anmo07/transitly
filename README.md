# Transitly

Transitly is a JavaScript parcel-management platform concept that helps public transport operators sell unused cargo capacity for parcel delivery.

## What it will support

- Parcel booking and pricing
- Spare-capacity matching
- User authentication with two-step OTP verification (NIST SP 800-63B compliant)
- Server & client-side route authorization gates protecting internal application views
- Social sign-in options (Google OAuth 2.0 and Apple ID)
- Purpose-binding, rate limiting, and exponential backoff cooldowns against telephony abuse
- Anti-injection & parameter sanitization engine protecting all entry forms
- Legal compliance suite (Privacy Policy, Terms of Service, FAQ, Cookie Consent pop-up)
- Search Engine Optimization (SEO canonical URLs, SVG vector sitemap, and Mermaid text format specifications)
- GPS-based real-time tracking via WebSockets and estimated arrival times
- End-to-end secure custody (QR seal scanning, geofenced handoffs, and immutable audit logs)
- Recipient OTP delivery confirmation and digital proof of delivery
- Route optimization and revenue reporting
- Consent-based WhatsApp parcel-status assistant

## Production technology baseline

Transitly is specified as a JavaScript (ES2022+) platform running on Node.js 20 LTS or newer. A production deployment separates the stateless API, background workers, and web application so each can scale independently.

| Area | Production choice |
| --- | --- |
| API and workers | Node.js JavaScript services, deployed as stateless containers |
| Authentication & Identity | JWT session tokens (30d), NIST SP 800-63B OTP engine, WebAuthn FIDO2 Biometrics |
| Transactional & spatial data | Managed PostgreSQL (PostGIS) with backups, point-in-time recovery, and connection pooling |
| Real-time state | Redis for caching, rate limits, locks, and tracking fan-out |
| Event processing | Durable queue or event bus with retries and a dead-letter queue |
| Delivery evidence | Private object storage with short-lived signed URLs |
| Observability | Structured logs, metrics, alerts, distributed traces, and delivery audit log |

## Architecture & Scalability Principles

- **Primary Landing Page & Route Protection:** `/login` is the primary entry point. Direct surfing to internal routes (`/`, `/deliver`, `/tracking`, `/profile`, etc.) without an authenticated session is blocked at both the Express server tier (302 redirect preserving target URL) and client-side router.
- **Hardened OTP Verification Engine:** Single-use, purpose-bound (`login`, `signup`, `reset_password`), rate-limited (5 sends/hr destination, 10 sends/hr IP), exponential resend backoff (`30s→60s→120s→300s`), and auto-revocation on 5 failed attempts (`HTTP 423 Locked`).
- **Domain Modules:** Decoupled modules (`Bookings`, `Capacity`, `Tracking`, `Custody`, `Delivery Evidence`, `Pricing`, `Settlements`, `Notifications`, `Identity`) own their specific rules and storage logic.
- **Versioned Event Contracts:** Event-driven architecture with standardized envelope schemas (`shipment.booked.v1`, `capacity.reserved.v1`, `delivery.confirmed.v1`, etc.).
- **Saga Workflow Orchestration:** Booking and dispatch lifecycles are orchestrated via distributed sagas with automatic compensation rollbacks (e.g. releasing capacity on payment/confirmation failure).
- **Aggregate Summary & OCC:** Master transaction records are lean relational rows that avoid table bloat by offloading tracking streams and handoff records to dedicated normalized tables. Writes enforce Optimistic Concurrency Control (`version` checks).
- **Immutable Closures:** Transitions to `CLOSED` produce tamper-evident archive snapshots and double-entry ledger entries. Post-closure adjustments are recorded as linked adjustment transactions.
- **Real-Time GPS Tracking:** Live telematics and location streaming via WebSockets with Redis pub/sub fan-out and PostGIS slow-path persistence.

## Last-Mile Orchestration & WhatsApp Integration

### Door-to-Door Last-Mile Orchestration
- **Dual Geolocation Checks:** Independent feasibility checks for the Sender Pickup Leg (Sender $\rightarrow$ Origin Terminal) and Receiver Delivery Leg (Destination Terminal $\rightarrow$ Receiver).
- **Realistic Experience Matrix:** Dynamically surfaces Full Door-to-Door, Home Pickup $\rightarrow$ Terminal, Terminal Drop-off $\rightarrow$ Home Delivery, or Terminal-to-Terminal only with clear fallback messaging.
- **Provider-Neutral Adapter Contract:** Standardized operations (`checkServiceability()`, `createQuote()`, `confirmDispatch()`, `trackDispatch()`, `cancelDispatch()`, `receiveWebhook()`) supporting Uber Direct, Rapido, inDrive, and regional couriers.
- **Parent-Child Leg Hierarchy:** Public transport transit serves as parent transaction (`Shipment`) with child pickup and delivery legs. Per-leg failure isolation ensures last-mile issues do not corrupt the overall intercity transit state.

### Event-Driven WhatsApp Parcel Assistant
- **Automated Milestone Updates:** Event-driven notifications via approved WhatsApp templates (booking confirmed, rider assigned, terminal arrival, OTP required, delivered, exception).
- **Interactive Chatbot Intents:** Real-time tracking, ETA queries, delivery preference changes, quote consent, support handoff, and opt-out.
- **Security & Privacy:** Authentication via E.164 phone or tracking ID + OTP, with strict redaction of raw GPS trails, driver phone numbers, internal notes, and payment credentials.

## Delivery quality bar

- Versioned APIs with schema validation, OpenAPI documentation, pagination, and idempotency keys on write operations.
- Automated unit, integration, contract, end-to-end, and load testing across 10 distinct test suites.
- Managed secrets, encrypted storage, audit logging, dependency scanning, and access controls.
- Health checks, rolling deployments, rollback, backup restoration tests, dashboards, alerts, and operational runbooks.

## Planned roles

| Role | Primary responsibility |
| --- | --- |
| Customer | Books, tracks parcels, and authenticates via two-step OTP or SSO |
| Operator | Publishes vehicle capacity and routes |
| Operations manager | Monitors shipments, commands fleet, and resolves exceptions |
| Delivery partner | Collects and confirms delivery |
## Live Hosted Services & Cloud Topology

Transitly is configured and deployed across free-tier serverless cloud infrastructure:

- **Frontend Application (Netlify):** [https://transitly.netlify.app](https://transitly.netlify.app)
- **Core API & WebSocket Gateway (Render):** [https://transitly-api.onrender.com](https://transitly-api.onrender.com)
- **API Health Monitor:** [https://transitly-api.onrender.com/health](https://transitly-api.onrender.com/health)
- **Swagger / OpenAPI Documentation:** [https://transitly-api.onrender.com/api/docs](https://transitly-api.onrender.com/api/docs)
- **Credentials & Connection Map:** Refer to local `dev_credentials.json` (git-ignored) or `.env`

> [!NOTE]
> Two-step authentication enforces NIST SP 800-63B standards. Auto-verifying `123456` bypass codes are disabled. Dynamic 6-digit verification codes are dispatched to user emails/SMS or can be viewed in real-time in the Render Console Logs under `🔑 [TRANSITLY 2-STEP AUTHENTICATION OTP]`.

## Quick Start & Database Commands

```bash
# 1. Initialize and Seed Master PostgreSQL 16 + PostGIS 3.4 Database (Local or Cloud via DATABASE_URL)
npm run db:init

# 2. Inspect Master Routes, Shipments, Vehicles & Telemetry in Terminal
npm run db:inspect

# 3. Open Interactive psql Console
npm run db:psql

# 4. Run All Automated Test Suites (including Auth, Route Gates & 28-point Operations)
npm test
```

## Documentation & Architecture References

- [PRD (Product Requirements Document)](PRD.md)
- [Master Project Documentation](docs/PROJECT_DOCUMENTATION.md)
- [Credentials & Environment Map](dev_credentials.json)
- [TRD (Technical Requirements Document)](docs/TRD.md)
- [PostgreSQL & PostGIS Terminal Guide](docs/POSTGRES_TERMINAL_GUIDE.md)
- [OpenAPI / Swagger API Docs](https://transitly-api.onrender.com/api/docs)
