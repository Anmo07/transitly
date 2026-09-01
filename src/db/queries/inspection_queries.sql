-- ============================================================================
-- Transitly — Master PostgreSQL & PostGIS Terminal Inspection Scripts
-- Database: transitly_telemetry | Host: localhost:5433 | User: postgres
-- Run via terminal:
--   docker exec -it transitly-postgis psql -U postgres -d transitly_telemetry -f /docker-entrypoint-initdb.d/../queries/inspection_queries.sql
-- Or via npm:
--   npm run db:inspect
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. OVERVIEW: Check all Tables & Record Counts
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_rows
FROM pg_stat_user_tables
ORDER BY relname ASC;

-- ----------------------------------------------------------------------------
-- 2. MASTER BUS ROUTES & GEOCODED STOPS (Spatial Coordinates & Geometries)
-- ----------------------------------------------------------------------------
SELECT 
    r.logical_route_id,
    r.version,
    r.origin_terminal,
    r.destination_terminal,
    s.sequence_order,
    s.stop_name,
    s.latitude,
    s.longitude,
    ST_AsText(s.geom) AS geom_wkt
FROM route_transactions r
JOIN route_stops s ON r.id = s.route_transaction_id
WHERE r.is_latest = TRUE
ORDER BY r.logical_route_id, s.sequence_order ASC;

-- ----------------------------------------------------------------------------
-- 3. MULTIMODAL SHIPMENTS & CHILD LEGS (End-to-End Tracking)
-- ----------------------------------------------------------------------------
SELECT 
    s.tracking_id,
    s.status AS parent_status,
    s.sender_name,
    s.recipient_name,
    l.sequence_order AS leg_seq,
    l.leg_type,
    l.provider,
    l.status AS leg_status,
    l.pickup_address,
    l.dropoff_address,
    l.price AS leg_price,
    ST_AsText(l.pickup_geom) AS pickup_geom_wkt,
    ST_AsText(l.dropoff_geom) AS dropoff_geom_wkt
FROM shipments s
JOIN shipment_legs l ON s.id = l.shipment_id
ORDER BY s.id, l.sequence_order ASC;

-- ----------------------------------------------------------------------------
-- 4. FLEET VEHICLES & CARGO CAPACITIES
-- ----------------------------------------------------------------------------
SELECT 
    v.id,
    v.registration,
    v.vehicle_type,
    v.cargo_capacity_kg,
    v.available_capacity_kg,
    v.status,
    v.last_latitude,
    v.last_longitude,
    ST_AsText(v.geom) AS geom_wkt
FROM vehicles v
ORDER BY v.id ASC;

-- ----------------------------------------------------------------------------
-- 5. REAL-TIME GPS TELEMETRY & SPATIAL BREADCRUMBS
-- ----------------------------------------------------------------------------
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
LIMIT 50;

-- ----------------------------------------------------------------------------
-- 6. IMMUTABLE CHAIN OF CUSTODY AUDIT LOG (QR Seals & Geofencing)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. AUDIT LOGS & EVENT TRACE
-- ----------------------------------------------------------------------------
SELECT 
    id,
    aggregate_type,
    aggregate_id,
    event_type,
    actor_id,
    actor_role,
    created_at,
    payload
FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;
