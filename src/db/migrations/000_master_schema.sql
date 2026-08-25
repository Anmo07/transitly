-- ==============================================================================
-- Transitly Master Relational Schema (PostgreSQL 16 + PostGIS)
-- Fully compatible with DBeaver Spatial Viewer & OpenGIS Standards
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Users & Actors
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'OPERATOR', 'OPERATIONS_MANAGER', 'DELIVERY_PARTNER', 'DRIVER')),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"pushNotifications": true, "emailUpdates": true, "locationServices": true, "language": "English (US)"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 1b. Customer Saved Addresses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    address_line TEXT NOT NULL,
    tag VARCHAR(50) DEFAULT 'home',
    is_default BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON saved_addresses(user_id);

-- ------------------------------------------------------------------------------
-- 1c. Customer Payment Methods
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CARD', 'UPI')),
    card_name VARCHAR(255),
    card_last_four VARCHAR(10),
    card_expiry VARCHAR(20),
    upi_vpa VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);

-- ------------------------------------------------------------------------------
-- 1d. Customer Support Tickets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    tracking_id VARCHAR(100),
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

-- ------------------------------------------------------------------------------
-- 2. Vehicles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    registration VARCHAR(50) UNIQUE NOT NULL,
    cargo_capacity_kg NUMERIC(8, 2) NOT NULL,
    available_capacity_kg NUMERIC(8, 2) NOT NULL,
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    last_geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_operator ON vehicles(operator_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_geom ON vehicles USING GIST(last_geom);

-- ------------------------------------------------------------------------------
-- 3. Route Master Transactions (Open for Update, Closed for Modification - OCP)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_transactions (
    id BIGSERIAL PRIMARY KEY,
    logical_route_id VARCHAR(100) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    origin_terminal VARCHAR(255) NOT NULL,
    origin_geom GEOMETRY(Point, 4326),
    destination_terminal VARCHAR(255) NOT NULL,
    destination_geom GEOMETRY(Point, 4326),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMPTZ,
    is_latest BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_route_logical_version UNIQUE (logical_route_id, version)
);

CREATE INDEX IF NOT EXISTS idx_routes_active ON route_transactions(logical_route_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_routes_origin_geom ON route_transactions USING GIST(origin_geom);
CREATE INDEX IF NOT EXISTS idx_routes_dest_geom ON route_transactions USING GIST(destination_geom);

-- ------------------------------------------------------------------------------
-- 4. Route Stops
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_transaction_id BIGINT NOT NULL REFERENCES route_transactions(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    sequence_order INT NOT NULL,
    estimated_stop_offset_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq ON route_stops(route_transaction_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_route_stops_geom ON route_stops USING GIST(geom);

-- ------------------------------------------------------------------------------
-- 5. Capacity Slots (Optimistic Concurrency Control)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capacity_slots (
    id BIGSERIAL PRIMARY KEY,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
    route_transaction_id BIGINT NOT NULL REFERENCES route_transactions(id),
    slot_date DATE NOT NULL,
    total_capacity_kg NUMERIC(8, 2) NOT NULL,
    available_weight_kg NUMERIC(8, 2) NOT NULL,
    reserved_weight_kg NUMERIC(8, 2) DEFAULT 0.0,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'FULL', 'DEPARTED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capacity_slots_search ON capacity_slots(vehicle_id, slot_date, version);

-- ------------------------------------------------------------------------------
-- 6. Master Shipments (Aggregate Root with Explicit State Machine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL PRIMARY KEY,
    tracking_id VARCHAR(100) UNIQUE NOT NULL,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    capacity_slot_id BIGINT REFERENCES capacity_slots(id),
    assigned_vehicle_id BIGINT REFERENCES vehicles(id),
    assigned_route_id BIGINT REFERENCES route_transactions(id),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'CANCELLED', 'DISPUTED')),
    version INT NOT NULL DEFAULT 1,
    
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    sender_address TEXT NOT NULL,
    
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_address TEXT NOT NULL,
    
    weight_kg NUMERIC(8, 2) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    
    -- Security: QR Seal & Delivery OTP
    qr_seal_code VARCHAR(100),
    qr_seal_tampered BOOLEAN DEFAULT FALSE,
    delivery_otp_hash VARCHAR(255),
    delivery_otp_salt VARCHAR(50),
    delivery_otp_verified BOOLEAN DEFAULT FALSE,
    
    -- Spatial Geofences
    pickup_geom GEOMETRY(Point, 4326),
    delivery_geom GEOMETRY(Point, 4326),
    
    -- Closure & Adjustments
    closed_at TIMESTAMPTZ,
    parent_transaction_id BIGINT REFERENCES shipments(id),
    is_adjustment BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_occ ON shipments(id, status, version);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_geom ON shipments USING GIST(pickup_geom);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_geom ON shipments USING GIST(delivery_geom);

-- ------------------------------------------------------------------------------
-- 7. Multi-Modal Shipment Legs (Parent-Child Hierarchy)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_legs (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    tracking_id VARCHAR(100) NOT NULL,
    leg_type VARCHAR(50) NOT NULL CHECK (leg_type IN ('PICKUP_LAST_MILE', 'TRANSIT', 'DELIVERY_LAST_MILE')),
    provider VARCHAR(50) NOT NULL,
    provider_dispatch_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUOTED', 'DISPATCHED', 'COLLECTED', 'IN_TRANSIT', 'COMPLETED', 'EXCEPTION', 'CANCELLED')),
    
    pickup_address TEXT NOT NULL,
    pickup_geom GEOMETRY(Point, 4326),
    dropoff_address TEXT NOT NULL,
    dropoff_geom GEOMETRY(Point, 4326),
    
    price NUMERIC(10, 2) DEFAULT 0.0,
    estimated_arrival TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_legs_parent ON shipment_legs(shipment_id, leg_type);
CREATE INDEX IF NOT EXISTS idx_shipment_legs_pickup_geom ON shipment_legs USING GIST(pickup_geom);
CREATE INDEX IF NOT EXISTS idx_shipment_legs_dropoff_geom ON shipment_legs USING GIST(dropoff_geom);

-- ------------------------------------------------------------------------------
-- 8. Custody Handoffs (Immutable Chain of Custody Audit Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custody_handoffs (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id),
    tracking_id VARCHAR(100) NOT NULL,
    from_user_id BIGINT REFERENCES users(id),
    to_user_id BIGINT REFERENCES users(id),
    from_role VARCHAR(50),
    to_role VARCHAR(50),
    qr_seal_code VARCHAR(100) NOT NULL,
    seal_status VARCHAR(50) NOT NULL DEFAULT 'INTACT' CHECK (seal_status IN ('INTACT', 'DAMAGED', 'TAMPERED', 'REPLACED')),
    handoff_type VARCHAR(50) NOT NULL,
    location_geom GEOMETRY(Point, 4326),
    is_within_geofence BOOLEAN NOT NULL DEFAULT TRUE,
    distance_meters NUMERIC(8, 2),
    signature_url TEXT,
    photo_url TEXT,
    notes TEXT,
    handoff_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custody_handoffs_shipment ON custody_handoffs(shipment_id, handoff_timestamp);
CREATE INDEX IF NOT EXISTS idx_custody_handoffs_geom ON custody_handoffs USING GIST(location_geom);

-- ------------------------------------------------------------------------------
-- 9. Proof of Delivery
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT UNIQUE NOT NULL REFERENCES shipments(id),
    tracking_id VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    otp_verified BOOLEAN NOT NULL DEFAULT TRUE,
    qr_seal_verified BOOLEAN NOT NULL DEFAULT TRUE,
    qr_seal_code VARCHAR(100) NOT NULL,
    signature_url TEXT,
    photo_url TEXT,
    location_geom GEOMETRY(Point, 4326),
    geofence_validated BOOLEAN DEFAULT TRUE,
    delivered_by_user_id BIGINT REFERENCES users(id),
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pod_location_geom ON proof_of_delivery USING GIST(location_geom);

-- ------------------------------------------------------------------------------
-- 10. Financial & Settlement Ledger Entries (Double-Entry Bookkeeping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id),
    tracking_id VARCHAR(100) NOT NULL,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('SHIPMENT_REVENUE', 'OPERATOR_EARNING', 'PARTNER_COMMISSION', 'PLATFORM_FEE', 'REFUND', 'DISPUTE_ADJUSTMENT')),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    debit_account VARCHAR(100) NOT NULL,
    credit_account VARCHAR(100) NOT NULL,
    description TEXT,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_operator ON ledger_entries(operator_id, posted_at);
CREATE INDEX IF NOT EXISTS idx_ledger_shipment ON ledger_entries(shipment_id);

-- ------------------------------------------------------------------------------
-- 11. Transaction Snapshots (Tamper-Evident Immutable JSON Archives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_snapshots (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT UNIQUE NOT NULL REFERENCES shipments(id),
    tracking_id VARCHAR(100) NOT NULL,
    operator_id BIGINT NOT NULL REFERENCES users(id),
    final_version INT NOT NULL,
    final_status VARCHAR(50) NOT NULL,
    snapshot_data JSONB NOT NULL,
    proof_of_delivery_data JSONB,
    total_handoff_count INT DEFAULT 0,
    snapshot_hash VARCHAR(64) NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 12. Spatial Vehicle Telemetry (Slow Path Partitioned / GIST Indexed)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(100) NOT NULL,
    operator_id VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    speed_kmh NUMERIC(6, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    altitude NUMERIC(7, 2),
    accuracy_meters NUMERIC(6, 2),
    ping_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_geom ON vehicle_telemetry USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time ON vehicle_telemetry (vehicle_id, ping_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_operator_time ON vehicle_telemetry (operator_id, ping_timestamp DESC);
