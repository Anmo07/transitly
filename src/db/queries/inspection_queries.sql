-- ============================================================================
-- Transitly: Master PostgreSQL 16 + PostGIS Terminal Inspection & Query Suite
-- Database: transitly_telemetry | Host: localhost:5433 | User: postgres
-- Run via terminal:
--   docker exec -it transitly-postgis psql -U postgres -d transitly_telemetry -f src/db/queries/inspection_queries.sql
-- Or via npm:
--   npm run db:inspect
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MODULE 1: System Health, IAM & Multi-Tenant Operators
-- ----------------------------------------------------------------------------
\echo '=== 1. SYSTEM EXTENSIONS & DOMAIN ENUMS ==='
SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'pgcrypto', 'uuid-ossp');

\echo '=== 1.1 MULTI-TENANT TRANSIT OPERATORS ==='
SELECT 
    id,
    code,
    name,
    contact_phone,
    contact_email,
    commission_rate,
    is_active,
    config->>'autoAcceptBookings' AS auto_accept
FROM operators
ORDER BY id ASC;

\echo '=== 1.2 MASTER USERS & ROLES ==='
SELECT 
    u.id,
    u.name,
    u.phone,
    u.email,
    u.role,
    o.code AS operator_code
FROM users u
LEFT JOIN operators o ON u.operator_id = o.id
ORDER BY u.id ASC;

-- ----------------------------------------------------------------------------
-- MODULE 2: Transit Network Infrastructure & PostGIS Spatial Geometry
-- ----------------------------------------------------------------------------
\echo '=== 2.1 TERMINALS & GEOFENCE RADII (Point & Polygon Coordinates) ==='
SELECT 
    t.id,
    t.terminal_code,
    t.name,
    t.city,
    t.geofence_radius_meters,
    ST_AsText(t.location) AS location_wkt,
    ST_X(t.location::geometry) AS longitude,
    ST_Y(t.location::geometry) AS latitude
FROM terminals t
ORDER BY t.id ASC;

\echo '=== 2.2 ACTIVE INTERCITY CORRIDORS (OCC Versioned) ==='
SELECT 
    r.logical_route_id,
    r.version,
    r.origin_terminal,
    r.destination_terminal,
    r.is_latest,
    r.status
FROM route_transactions r
WHERE r.is_latest = TRUE
ORDER BY r.logical_route_id ASC;

\echo '=== 2.3 GEOCODED ROUTE STOPS & POSTGIS SPATIAL POINTS ==='
SELECT 
    r.logical_route_id,
    s.sequence_order,
    s.stop_name,
    s.latitude,
    s.longitude,
    ST_AsText(s.geom) AS geom_wkt
FROM route_stops s
JOIN route_transactions r ON s.route_transaction_id = r.id
WHERE r.is_latest = TRUE
ORDER BY r.logical_route_id, s.sequence_order ASC;

-- ----------------------------------------------------------------------------
-- MODULE 3: Fleet & Capacity Management (Optimistic Concurrency Control)
-- ----------------------------------------------------------------------------
\echo '=== 3.1 FLEET VEHICLES & CURRENT SPATIAL GEOMETRIES ==='
SELECT 
    v.id,
    v.registration,
    v.vehicle_type,
    v.cargo_capacity_kg,
    v.available_capacity_kg,
    v.is_active,
    ST_AsText(v.last_geom) AS last_geom_wkt
FROM vehicles v
ORDER BY v.id ASC;

\echo '=== 3.2 DYNAMIC CAPACITY SLOTS & OCC VERSIONING ==='
SELECT 
    cs.id,
    cs.vehicle_id,
    v.registration,
    cs.slot_date,
    cs.total_capacity_kg,
    cs.available_weight_kg,
    cs.reserved_weight_kg,
    cs.version,
    cs.status
FROM capacity_slots cs
JOIN vehicles v ON cs.vehicle_id = v.id
ORDER BY cs.slot_date, cs.id ASC;

-- ----------------------------------------------------------------------------
-- MODULE 4: Multimodal Shipments & Last-Mile Orchestration
-- ----------------------------------------------------------------------------
\echo '=== 4.1 MASTER SHIPMENTS AGGREGATE ROOTS (Cryptographic Seals & OTP) ==='
SELECT 
    s.id,
    s.tracking_id,
    s.status,
    s.version,
    s.sender_name,
    s.recipient_name,
    s.weight_kg,
    s.price,
    s.qr_seal_code,
    s.qr_seal_tampered,
    s.delivery_otp_verified,
    ST_AsText(s.pickup_geom) AS pickup_geom_wkt,
    ST_AsText(s.delivery_geom) AS delivery_geom_wkt
FROM shipments s
ORDER BY s.id ASC;

\echo '=== 4.2 MULTIMODAL CHILD LEGS HIERARCHY ==='
SELECT 
    l.id,
    l.shipment_id,
    s.tracking_id,
    l.leg_type,
    l.provider,
    l.status,
    l.price,
    l.pickup_address,
    l.dropoff_address
FROM shipment_legs l
JOIN shipments s ON l.shipment_id = s.id
ORDER BY l.shipment_id, l.id ASC;

\echo '=== 4.3 THIRD-PARTY PROVIDER QUOTES & DISPATCHES ==='
SELECT 
    pq.id,
    pq.provider,
    pq.external_quote_id,
    pq.amount,
    pq.currency,
    pq.expires_at
FROM provider_quotes pq
ORDER BY pq.id ASC;

-- ----------------------------------------------------------------------------
-- MODULE 5: Real-Time Telemetry & Operations (PostGIS GIST Slow Path)
-- ----------------------------------------------------------------------------
\echo '=== 5.1 TIME-SERIES GPS TELEMETRY TRAIL ==='
SELECT 
    t.id,
    t.vehicle_id,
    t.operator_id,
    t.latitude,
    t.longitude,
    t.speed_kmh,
    t.heading,
    t.ping_timestamp,
    ST_AsText(t.geom) AS geom_wkt
FROM vehicle_telemetry t
ORDER BY t.ping_timestamp DESC
LIMIT 10;

\echo '=== 5.2 IMMUTABLE CHAIN OF CUSTODY AUDIT LOG ==='
SELECT 
    c.id,
    c.tracking_id,
    c.from_role,
    c.to_role,
    c.qr_seal_code,
    c.seal_status,
    c.handoff_type,
    c.is_within_geofence,
    c.handoff_timestamp,
    ST_AsText(c.location_geom) AS location_geom_wkt
FROM custody_handoffs c
ORDER BY c.handoff_timestamp ASC;

\echo '=== 5.3 DIGITAL PROOF OF DELIVERY (Biometrics & Geofence Validations) ==='
SELECT 
    p.id,
    p.tracking_id,
    p.recipient_name,
    p.recipient_phone,
    p.otp_verified,
    p.qr_seal_verified,
    p.geofence_validated,
    p.delivered_at,
    ST_AsText(p.location_geom) AS location_geom_wkt
FROM proof_of_delivery p
ORDER BY p.delivered_at DESC;

-- ----------------------------------------------------------------------------
-- MODULE 6: Settlements, Audits & Notifications
-- ----------------------------------------------------------------------------
\echo '=== 6.1 DOUBLE-ENTRY LEDGER JOURNAL & TRIAL BALANCE ==='
SELECT 
    le.id,
    le.tracking_id,
    le.entry_type,
    le.amount,
    le.currency,
    le.debit_account,
    le.credit_account,
    le.posted_at
FROM ledger_entries le
ORDER BY le.posted_at DESC;

\echo '=== 6.2 LEDGER BALANCE VERIFICATION (Total Debits vs Credits) ==='
SELECT 
    currency,
    SUM(amount) AS total_volume,
    COUNT(*) AS total_postings
FROM ledger_entries
GROUP BY currency;

\echo '=== 6.3 WHATSAPP MESSAGING CONSENT & NOTIFICATION QUEUE ==='
SELECT 
    mc.id,
    mc.phone_e164,
    mc.channel,
    mc.status,
    mc.consented_at
FROM messaging_consents mc;

SELECT 
    n.id,
    n.channel,
    n.template_name,
    n.recipient_e164,
    n.status,
    n.created_at
FROM notifications n
ORDER BY n.created_at DESC
LIMIT 10;

\echo '=== 6.4 ADMIN COMMAND CENTER SECURITY AUDIT LOGS ==='
SELECT 
    al.id,
    al.actor_user_id,
    al.actor_role,
    al.action,
    al.resource_type,
    al.resource_id,
    al.created_at
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 10;
