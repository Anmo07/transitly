# Transitly — Product Requirements Document

## Overview

Transitly is a JavaScript-based parcel-management platform for public transport operators. It turns unused vehicle cargo capacity into a reliable, lower-cost delivery network.

## Problem

Public transport vehicles often travel with unused cargo space, while conventional parcel delivery services carry high operating costs and limited network flexibility.

## Goals

- Improve vehicle cargo-capacity utilization.
- Deliver parcels faster through scheduled public-transport routes.
- Create additional revenue for transport operators.
- Reduce logistics costs for customers.
- Provide transparent, real-time shipment tracking.

## Users

- Transport operators: manage vehicles, routes, capacity, and revenue.
- Operations teams: monitor live shipments and resolve delivery exceptions.
- Customers: book, track, and receive parcels.
- Delivery partners: collect, hand over, and confirm delivery of parcels.

## Scope and Functional Requirements

### Parcel booking

- Customers can enter pickup and delivery locations, parcel dimensions, weight, and preferred date.
- The platform calculates an estimated price and eligible vehicle options.
- A successful booking creates a unique shipment ID and customer notification.

### Capacity and route matching

- Operators can publish available cargo capacity by vehicle, route, departure time, and weight limit.
- The platform matches bookings to available capacity using route, schedule, space, and service-level constraints.
- Operations teams can manually reassign a parcel when needed.

### GPS tracking

- The system receives vehicle location updates from a GPS provider or driver application.
- Customers and operators can view a shipment’s current status, route progress, and estimated arrival time.
- Tracking events are retained as a timestamped shipment timeline.

### Route optimization

- The platform recommends parcel-to-vehicle matches that minimize delay, distance, and unused capacity.
- Operations teams can compare routes by capacity utilization, on-time performance, and parcel volume.

### End-to-end secure custody and handoffs

- **QR seal scanning:** Tamper-evident digital and physical QR seals are assigned at booking, validated on initial pickup, and scanned at every custody transfer (vehicle loading, hub sorting, driver handover).
- **OTP delivery confirmation:** A secure, cryptographically hashed One-Time Password is generated and sent to the verified recipient, required for final delivery confirmation.
- **Geofenced custody events:** Pickup, transfer, and delivery operations are verified against spatial geofence boundaries (e.g., origin terminal, route stops, and destination address) to prevent off-route or unauthorized custody transitions.
- **Auditable chain of custody records:** Immutable, append-only transaction logs capture every custody transfer (from-custodian, to-custodian, timestamp, GPS coordinate, geofence audit, and QR seal integrity status).

### Digital proof of delivery

- Delivery partners capture recipient name, phone, verified OTP status, signature or photograph, timestamp, and geofence-validated location.
- Proof of delivery is immutably linked to the shipment record and shared with both customer and operator.

### Revenue management

- Operators can set route, weight, volume, service-level, and peak-time pricing rules.
- Dashboards show revenue, capacity utilization, delivery performance, and route profitability.
- The platform produces settlement data for operators and delivery partners.

### Customer notifications

- Notify customers at booking confirmation, pickup, departure, arrival at terminal, out-for-delivery, delivered, and exception states.
- Support email, SMS, push notification, and in-app channels through configurable providers.

### Door-to-door last-mile orchestration and feasibility

Door-to-door delivery is planned as two independent, geolocation-based last-mile checks:

```mermaid
flowchart LR
  S["Sender location"] --> P["Pickup feasibility check"]
  P --> T["Origin terminal / public transport route"]
  T --> D["Delivery feasibility check"]
  D --> R["Receiver location"]
```

At booking, the system collects the sender’s and receiver’s exact addresses and geocodes each into latitude and longitude coordinates. With the parcel’s weight, dimensions, service level, and desired date, Transitly evaluates two independent legs:
1. **Sender pickup leg:** Sender address $\rightarrow$ selected origin terminal.
2. **Receiver delivery leg:** Destination terminal $\rightarrow$ receiver address.

#### Serviceability & Feasibility Decision Criteria

For each leg, Transitly queries every enabled provider adapter (e.g., Uber Direct, Rapido, inDrive, or approved regional couriers) using:
```text
checkServiceability(
  pickupCoordinates,
  dropoffCoordinates,
  parcelWeight,
  parcelDimensions,
  pickupTimeWindow
)
```

The feasibility engine evaluates:
- Provider service coverage across both coordinates.
- Whether pickup and destination points lie inside active service-area polygons.
- Real-time courier/rider availability.
- Operating hours, holiday schedules, and time window constraints.
- Pickup/delivery travel distance and estimated transit time.
- Vehicle suitability for the parcel's weight and volumetric dimensions.
- Provider-specific constraints for parcel categories or declared value.
- Live quote availability, pricing validity, and quote expiry time.
- Weather alerts, local traffic restrictions, or external provider outages.
- Operational status of the relevant public-transport terminal/depot.

#### Customer Experience Matrix

Customers are presented only with realistic, verified service options:

| Pickup feasible | Delivery feasible | Customer experience |
|---|---|---|
| Yes | Yes | Full door-to-door delivery |
| Yes | No | Home pickup → destination terminal collection |
| No | Yes | Origin terminal drop-off → home delivery |
| No | No | Terminal-to-terminal delivery only |

When a leg is unavailable, the interface uses clear, transparent messaging (e.g., *"Door-to-door pickup is not currently available at your address. You can drop the parcel at Central Bus Terminal."*). A rider is never promised until a provider returns a valid quote and dispatch confirmation.

#### Provider-Neutral Orchestration Architecture

Transitly isolates provider-specific logic behind a uniform adapter interface:
```text
checkServiceability()
createQuote()
confirmDispatch()
trackDispatch()
cancelDispatch()
receiveWebhook()
```

#### Parent-Child Shipment Leg Hierarchy

The public-transport transit shipment serves as the parent transaction, managing distinct child legs:
```text
Shipment (Parent Transaction)
├── Pickup last-mile leg: Sender → Origin terminal
├── Transit leg: Origin terminal → Destination terminal
└── Delivery last-mile leg: Destination terminal → Receiver
```
Each leg maintains its own provider, status, price, ETA, proof of delivery, and failure handling. A failed receiver-delivery attempt isolates to that specific leg (moving it to an exception state) without marking the overall intercity shipment as lost.

### Event-driven WhatsApp parcel assistant

Customer notifications and interactive self-service leverage an event-driven messaging architecture:

```text
Shipment event
→ notification queue
→ WhatsApp template message
→ customer receives update
```

#### Automated Notification Events
- Booking confirmed & dispatch manifest issued
- Rider assigned for sender pickup
- Parcel accepted at origin terminal
- Public transport vehicle departed
- Parcel arrived at destination terminal
- Rider assigned for final delivery
- Recipient delivery OTP required
- Parcel successfully delivered with digital proof
- Delivery exception or terminal collection required

#### Interactive Chatbot Capabilities
The WhatsApp assistant handles the following authenticated customer intents:
- *"Track my parcel"* / *"Where is my parcel?"* / *"What is the ETA?"*
- *"Change delivery preference"* (e.g. switch to terminal collection)
- *"Accept revised last-mile quote"*
- *"Talk to support"* / Human escalation
- *"Stop notifications"* / Opt-out

#### Security & Privacy Guardrails
- Inbound inquiries require customer verification via registered E.164 phone number or tracking ID + OTP before disclosing shipment details.
- Responses display parcel milestone status and ETA, while strictly redacting raw driver GPS trails, internal operational notes, payment tokens, and courier contact details.

## Shipment Lifecycle

1. Customer submits a parcel booking; Transitly assigns a tracking ID, registers a QR seal code, and provisions a delivery OTP.
2. Transitly validates the parcel and matches it to suitable spare vehicle capacity.
3. Operator confirms the shipment and generates the dispatch manifest.
4. The driver/operator accepts the parcel within the pickup geofence, scans the QR seal, and registers the initial custody record.
5. Vehicle GPS and intermediate transit/hub handoff scans update the live tracking timeline and chain of custody.
6. The parcel is handed to the last-mile partner or driver within the authorized delivery zone.
7. Recipient provides the OTP, partner verifies the QR seal, captures signature/photo within the destination geofence, completing digital proof of delivery and closing the custody chain.

## Core Data Models

| Entity | Key fields |
| --- | --- |
| User | id, role, name, email, phone |
| Shipment | id, trackingId, sender, recipient, dimensions, weight, status, price, qrSeal, deliveryOtp, currentCustodian, pickupGeofence, deliveryGeofence |
| Vehicle | id, operatorId, registration, cargoCapacityKg, availableCapacityKg, GPS reference |
| RouteTransaction | id, logicalRouteId, version, operatorId, origin, destination, stops, effectiveFrom, effectiveTo, isLatest, status |
| CustodyHandoff | id, shipmentId, fromCustodian, toCustodian, qrSealCode, sealStatus, handoffType, location, geofenceValidation, timestamp |
| CapacitySlot | id, vehicleId, routeId, date, availableWeightKg, reservedWeightKg, version, status |
| TrackingEvent | id, shipmentId, status, latitude, longitude, timestamp, note |
| ProofOfDelivery | id, shipmentId, recipientName, recipientPhone, otpVerified, qrSealVerified, signatureUrl, photoUrl, location, geofenceValidated, timestamp |
| TransactionSnapshot | id, transactionId, trackingId, operatorId, finalVersion, finalStatus, snapshotData, proofOfDelivery, totalHandoffCount, snapshotHash, closedAt |
| LedgerEntry | id, transactionId, trackingId, operatorId, entryType, amount, currency, debitAccount, creditAccount, postedAt |
| Notification | id, shipmentId, channel, template, status, sentAt |
| LastMileLeg | id, shipmentId, direction, status, provider, serviceability, quotedAmount, acceptedAmount, pickupWindow, deliveryWindow |
| ProviderQuote | id, lastMileLegId, provider, externalQuoteId, amount, currency, expiresAt, capabilities |
| ProviderDispatch | id, lastMileLegId, provider, externalDeliveryId, status, lastWebhookAt, idempotencyKey |
| MessagingConsent | id, customerId, channel, phoneE164, status, source, consentedAt, revokedAt |

## Production Technical Architecture

### Technology baseline

- **Language and runtime:** JavaScript (ES2022+) on Node.js 20 LTS or newer.
- **Service shape:** Modular domain-driven architecture with independently deployable worker services, REST APIs, and WebSockets.
- **Primary datastore:** MongoDB with automated backups, point-in-time recovery, and replica sets for high availability.
- **Fast state and cache:** Redis for rate limiting, short-lived caching, distributed locks, and real-time tracking fan-out.
- **Asynchronous work:** A durable managed queue or event bus for tracking ingestion, notifications, proof-of-delivery processing, route calculations, and settlement exports.
- **Files:** Private object storage for proof-of-delivery assets, accessed only through short-lived signed URLs.

### Domain Modules

The platform is structured into decoupled domain modules, each owning its business logic and data access:
1. **Bookings:** Lifecycle state machine, optimistic concurrency, and aggregate transaction roots.
2. **Capacity:** Route and vehicle capacity slots with atomic OCC reservation and release.
3. **Tracking:** Real-time GPS location ingestion via WebSockets, map projection, and time-series pings.
4. **Custody:** Tamper-evident QR seal verification, geofenced handoffs, and immutable chain-of-custody logs.
5. **Delivery Evidence:** Proof-of-delivery capture, recipient OTP verification, signatures, and photographic records.
6. **Pricing:** Dynamic fare quoting, weight/distance fees, and peak-hour surcharge multipliers.
7. **Settlements:** Financial ledger journal entries (operator earnings, platform commission, partner fees).
8. **Notifications:** Event-driven multi-channel customer dispatch (SMS, email, push).
9. **Identity:** Multi-tenant operator, driver, partner, and customer role-based access control.
10. **Last-mile Orchestration:** Provider-neutral serviceability, quotation, dispatch, cancellation, and reconciliation for collection and recipient-delivery legs.
11. **Messaging Assistant:** Consent-aware WhatsApp notification and customer-intent processing with human support escalation.

### Versioned Event Contracts

Asynchronous integrations and service communications communicate using standardized event envelopes (`eventId`, `eventType`, `version`, `timestamp`, `operatorId`, `correlationId`, `payload`):
- `shipment.opened.v1` & `shipment.booked.v1`
- `capacity.reserved.v1` & `capacity.released.v1` (compensation)
- `parcel.picked_up.v1` & `parcel.handed_over.v1`
- `vehicle.location_received.v1`
- `delivery.confirmed.v1`
- `transaction.closed.v1` & `transaction.disputed.v1`
- `last_mile.serviceability_checked.v1`, `last_mile.quoted.v1`, `last_mile.dispatched.v1`, and `last_mile.completed.v1`
- `whatsapp.message_received.v1`, `whatsapp.notification_queued.v1`, and `whatsapp.consent_revoked.v1`

### Saga & Workflow Management

Distributed workflows (such as booking and dispatch) are executed via durable Sagas with explicit compensating actions:
- **Booking Flow:** Validate Booking $\rightarrow$ Reserve Capacity (OCC) $\rightarrow$ Calculate Pricing $\rightarrow$ Transition to `CONFIRMED` $\rightarrow$ Dispatch Notification.
- **Compensations:** If pricing or confirmation fails, the Saga automatically rolls back by releasing reserved capacity (`capacity.released.v1`) and marking the transaction `CANCELLED`.

### Aggregate Summary, State Machine & Concurrency Control

- **Aggregate Summary Pattern:** The master shipment document is maintained as a lean aggregate summary. Unbounded event streams (GPS pings, custody scans, ledger entries) are isolated into dedicated append-only collections.
- **Explicit State Transitions:**
  $$\text{OPEN} \longrightarrow \text{CONFIRMED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{DELIVERED} \longrightarrow \text{CLOSED}$$
  *(with branches to `CANCELLED` and `DISPUTED`).*
- **Optimistic Concurrency Control (OCC):** Every write to an active transaction requires version verification:
  ```javascript
  db.shipments.findOneAndUpdate(
    { _id: transactionId, status: expectedStatus, version: expectedVersion },
    { $set: updates, $inc: { version: 1 } }
  )
  ```
- **Immutable Closures & Linked Adjustments:** When reaching `CLOSED`, the system creates an immutable `TransactionSnapshot` and posts double-entry journal entries (`LedgerEntry`). Closed transactions cannot be mutated—post-closure adjustments must be recorded as linked `AdjustmentTransaction` documents.

### API standards

- Version public endpoints under `/v1`.
- Authenticate users with OAuth 2.1/OIDC-compatible access tokens; use short-lived access tokens and rotating refresh tokens where applicable.
- Authorize every request with role- and tenant-based policies.
- Require idempotency keys for booking, payment, and proof-of-delivery mutation endpoints.
- Enforce request schemas, pagination, filtering limits, payload size limits, and per-tenant rate limits.
- Publish OpenAPI documentation and maintain backward compatibility within a major API version.
- Treat every third-party webhook as untrusted input: verify signature and timestamp, securely retain the raw payload, deduplicate by provider event ID, then acknowledge quickly and process asynchronously.

### Last-mile provider contract

Every provider adapter must expose `checkServiceability`, `createQuote`, `confirmDispatch`, `getStatus`, `cancelDispatch`, `getProofOfDelivery`, and `verifyWebhook`. Responses are normalized into Transitly states before they touch shipment state.

- Credentials stay server-side and are segregated by production environment.
- Send Transitly idempotency keys on every mutation where a provider supports them.
- Apply strict timeouts, safe retries with exponential backoff, per-provider circuit breakers, and a dead-letter queue. Never blindly retry a non-idempotent dispatch request.
- Record external request IDs, response state, webhook event IDs, timestamps, normalized states, and immutable raw-event references for reconciliation.
- A region/provider capability registry controls feature flags, parcel limits, operating hours, maximum distance, verification types, and whether sender pickup or recipient delivery is supported.

### Deployment model

- Package each service as a container and deploy across multiple availability zones.
- Run at least two API instances in production; use health checks, rolling deployments, and automatic rollback on failed health or error-rate checks.
- Store configuration and secrets in a managed secret store; never in source control, images, logs, or client bundles.
- Apply database migrations through a controlled, forward-only release step. Every migration must have been tested against production-sized data.
- Use infrastructure as code, separate development/staging/production accounts or projects, and environment-specific least-privilege identities.

## Reliability, Security, and Scale Requirements

### Service objectives

| Area                     | Production target                                             |
| --------------------------| ---------------------------------------------------------------|
| Booking API availability | 99.95% monthly                                                |
| Booking API latency      | p95 under 500 ms, excluding third-party payment or maps calls |
| Tracking freshness       | 95% of accepted tracking events visible within 30 seconds     |
| Notification processing  | 95% dispatched within 60 seconds of a qualifying event        |
| Recovery point objective | 15 minutes or less                                            |
| Recovery time objective  | 4 hours or less                                               |

### Security and privacy

- Encrypt data in transit with TLS 1.2+ and at rest with managed encryption keys.
- Hash passwords with a modern adaptive algorithm if local credentials are introduced; prefer an external identity provider.
- Use signed, expiring links for proof-of-delivery files and never expose storage credentials to browsers or mobile clients.
- Record tamper-evident audit events for authentication, permission changes, booking state changes, overrides, and delivery confirmation.
- Minimize personally identifiable information in analytics and logs; redact phone numbers, addresses, tokens, and secrets.
- Run dependency scanning, secret scanning, static analysis, and vulnerability remediation as part of the delivery pipeline.
- Define data retention, deletion, and data-subject-request processes before launch according to the markets in which Transitly operates.
- Share only the minimum address and contact data required for a particular third-party last-mile leg. Redact those fields in logs, dashboards, and WhatsApp messages.
- Store messaging consent, opt-out state, template version, delivery receipt, and inbound-message audit data. Opt-outs must take effect immediately across notification workers.

### Observability and operations

- Emit structured JSON logs with request, tenant, shipment, and trace IDs where safe to do so.
- Collect metrics for API latency, errors, queue age, worker failures, database pool saturation, GPS lag, provider failures, and capacity-matching success.
- Trace a booking and its downstream events end-to-end using OpenTelemetry-compatible traces.
- Alert on breached service objectives, unprocessed queue growth, database saturation, dead-letter events, and elevated delivery failure rates.
- Maintain runbooks for provider outages, queue backlog, GPS data gaps, overbooking attempts, and failed delivery-evidence uploads.

### Performance and growth assumptions

- Design the first production deployment for at least 100 operators, 10,000 active vehicles, 100,000 parcels per day, and 10 GPS updates per minute per moving vehicle.
- Preserve headroom of at least 30% for normal peak load and test at 2× expected peak before major launches.
- Scale event processing independently from API traffic. GPS ingestion must never synchronously wait on notification, reporting, or route-optimization work.
- Use cached read models for live tracking and dashboards; do not calculate analytics from transactional tables on customer requests.

## Quality Gates Before Production Release

- Unit, integration, contract, end-to-end, and load tests pass in CI.
- Backup restoration, failover, and disaster-recovery exercises have been performed and documented.
- Independent security review and threat model are completed for booking, tracking, proof-of-delivery, and tenant authorization flows.
- Production dashboards, alerts, on-call rotation, and incident escalation paths are in place.
- Feature flags protect new matching logic and third-party provider changes.

## Success Metrics

- Cargo utilization rate per vehicle and route.
- Average parcel delivery time.
- On-time delivery rate.
- Revenue generated per route and per kilogram of spare capacity.
- Cost per delivered parcel.
- Customer tracking engagement and notification delivery rate.

## Out of Scope for First Release

- Cross-border customs processing.
- Marketplace bidding between multiple operators.
- Automated claims and insurance adjudication.
- Warehouse management beyond terminal scan events.
