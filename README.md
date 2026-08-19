# Transitly

Transitly is a JavaScript parcel-management platform concept that helps public transport operators sell unused cargo capacity for parcel delivery.

## What it will support

- Parcel booking and pricing
- Spare-capacity matching
- GPS-based real-time tracking via WebSockets and estimated arrival times
- End-to-end secure custody (QR seal scanning, geofenced handoffs, and immutable audit logs)
- Recipient OTP delivery confirmation and digital proof of delivery
- Route optimization
- Revenue reporting
- Customer notifications
- Optional door-to-door pickup and delivery through approved third-party providers
- Consent-based WhatsApp parcel-status assistant

## Production technology baseline

Transitly is specified as a JavaScript (ES2022+) platform running on Node.js 20 LTS or newer. A production deployment separates the stateless API, background workers, and web application so each can scale independently.

| Area | Production choice |
| --- | --- |
| API and workers | Node.js JavaScript services, deployed as stateless containers |
| Transactional data | Managed MongoDB with backups, point-in-time recovery, and replica sets |
| Real-time state | Redis for caching, rate limits, locks, and tracking fan-out |
| Event processing | Durable queue or event bus with retries and a dead-letter queue |
| Delivery evidence | Private object storage with short-lived signed URLs |
| Observability | Structured logs, metrics, alerts, and distributed traces |

## Architecture & Scalability Principles

- **Domain Modules:** Decoupled modules (`Bookings`, `Capacity`, `Tracking`, `Custody`, `Delivery Evidence`, `Pricing`, `Settlements`, `Notifications`, `Identity`) own their specific rules and storage logic.
- **Versioned Event Contracts:** Event-driven architecture with standardized envelope schemas (`shipment.booked.v1`, `capacity.reserved.v1`, `delivery.confirmed.v1`, etc.).
- **Saga Workflow Orchestration:** Booking and dispatch lifecycles are orchestrated via distributed sagas with automatic compensation rollbacks (e.g. releasing capacity on payment/confirmation failure).
- **Aggregate Summary & OCC:** Master transaction records are lean aggregates that avoid document growth by offloading tracking streams and handoff records to dedicated collections. Writes enforce Optimistic Concurrency Control (`version` checks).
- **Immutable Closures:** Transitions to `CLOSED` produce tamper-evident archive snapshots and double-entry ledger entries. Post-closure adjustments are recorded as linked adjustment transactions.
- **Real-Time GPS Tracking:** Live telematics and location streaming via WebSockets with Redis pub/sub fan-out.

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
- Automated unit, integration, contract, end-to-end, and load testing.
- Managed secrets, encrypted storage, audit logging, dependency scanning, and access controls.
- Health checks, rolling deployments, rollback, backup restoration tests, dashboards, alerts, and operational runbooks.

## Planned roles

| Role | Primary responsibility |
| --- | --- |
| Customer | Books and tracks parcels |
| Operator | Publishes vehicle capacity and routes |
| Operations manager | Monitors shipments and resolves exceptions |
| Delivery partner | Collects and confirms delivery |

## Environment setup

1. Copy `.env.example` to `.env`.
2. Supply values for your database, cache, queue, authentication, maps, GPS, notification, and storage providers.
3. Use a managed secret store in staging and production; `.env` is for local development only.
4. Never commit the completed `.env` file.

See [PRD.md](PRD.md) for detailed product requirements.
