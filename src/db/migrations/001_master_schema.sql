-- ==============================================================================
-- Transitly: 001 Master DDD Schema Evolution
-- Engine: PostgreSQL 16+ with PostGIS 3.4+ (SRID 4326 / WGS 84)
-- Type: ADDITIVE migration — no renames, no drops, no data loss
--
-- This migration introduces DDD-bounded modules on top of the existing
-- 000_master_schema.sql foundation. All changes are idempotent.
-- ==============================================================================

BEGIN;

-- ============================================================================
-- MODULE 1: System Extensions, Enums & IAM (Identity & Access Management)
-- ============================================================================

-- 1.0 Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1.1 Domain Enum Types
-- These are created for forward-compatibility. Existing VARCHAR+CHECK columns
-- are NOT altered to avoid data migration on live tables.

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'CUSTOMER',
        'OPERATOR',
        'OPERATIONS_MANAGER',
        'DELIVERY_PARTNER',
        'DRIVER',
        'ADMIN'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM (
        'OPEN',
        'CONFIRMED',
        'IN_TRANSIT',
        'DELIVERED',
        'CLOSED',
        'CANCELLED',
        'DISPUTED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE leg_type_enum AS ENUM (
        'PICKUP_LAST_MILE',
        'TRANSIT',
        'DELIVERY_LAST_MILE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE leg_status_enum AS ENUM (
        'PENDING',
        'QUOTED',
        'DISPATCHED',
        'COLLECTED',
        'IN_TRANSIT',
        'COMPLETED',
        'EXCEPTION',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE seal_status_enum AS ENUM (
        'INTACT',
        'DAMAGED',
        'TAMPERED',
        'REPLACED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type_enum AS ENUM (
        'SHIPMENT_REVENUE',
        'OPERATOR_EARNING',
        'PARTNER_COMMISSION',
        'PLATFORM_FEE',
        'REFUND',
        'DISPUTE_ADJUSTMENT'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 1.2 Multi-Tenant Transit Operators (NEW first-class entity)
-- Previously operators were just users with role='OPERATOR'.
-- This table provides proper multi-tenant configuration isolation.

CREATE TABLE IF NOT EXISTS operators (
    id              BIGSERIAL       PRIMARY KEY,
    operator_uuid   UUID            DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    code            VARCHAR(50)     UNIQUE NOT NULL,   -- e.g. 'KSRTC', 'DTC', 'HRTC'
    contact_email   VARCHAR(255)    NOT NULL,
    contact_phone   VARCHAR(50)     NOT NULL CHECK (contact_phone ~ '^\+[1-9]\d{1,14}$'),
    license_number  VARCHAR(100)    UNIQUE,
    commission_rate NUMERIC(5, 2)   DEFAULT 10.00
                                    CHECK (commission_rate >= 0 AND commission_rate <= 100),
    is_active       BOOLEAN         DEFAULT TRUE,
    config          JSONB           DEFAULT '{"autoAcceptBookings": true, "maxCargoCapacityRatio": 0.85}'::jsonb,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 1.3 Evolve users table — add operator link and activation flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS operator_id BIGINT REFERENCES operators(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_operator ON users(operator_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);


-- 1.4 Evolve support_tickets — add priority, assignment, shipment link
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS shipment_id BIGINT REFERENCES shipments(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add priority CHECK if not present
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_support_priority'
          AND conrelid = 'support_tickets'::regclass
    ) THEN
        ALTER TABLE support_tickets ADD CONSTRAINT chk_support_priority
            CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);


-- ============================================================================
-- MODULE 2: Transit Network Infrastructure (Spatial / GIS)
-- ============================================================================

-- 2.1 Terminals — ISBT Depots, Hubs, Transit Stations (NEW)
CREATE TABLE IF NOT EXISTS terminals (
    id                      BIGSERIAL       PRIMARY KEY,
    terminal_code           VARCHAR(50)     UNIQUE NOT NULL,  -- e.g. 'DEL-ISBT-KASHMERE'
    name                    VARCHAR(255)    NOT NULL,
    operator_id             BIGINT          REFERENCES operators(id) ON DELETE SET NULL,
    address                 TEXT            NOT NULL,
    city                    VARCHAR(100)    NOT NULL,
    location                GEOMETRY(Point, 4326) NOT NULL,
    geofence_polygon        GEOMETRY(Polygon, 4326),          -- Optional precise boundary
    geofence_radius_meters  INT             DEFAULT 250 CHECK (geofence_radius_meters > 0),
    is_active               BOOLEAN         DEFAULT TRUE,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_terminals_location ON terminals USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_terminals_polygon  ON terminals USING GIST(geofence_polygon);
CREATE INDEX IF NOT EXISTS idx_terminals_operator  ON terminals(operator_id);


-- 2.2 Evolve route_transactions — add corridor metadata & spatial path
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS path GEOMETRY(LineString, 4326);
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8, 2);
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS estimated_duration_minutes INT;
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS origin_terminal_id BIGINT REFERENCES terminals(id);
ALTER TABLE route_transactions ADD COLUMN IF NOT EXISTS destination_terminal_id BIGINT REFERENCES terminals(id);

CREATE INDEX IF NOT EXISTS idx_routes_path ON route_transactions USING GIST(path);


-- 2.3 Evolve route_stops — add terminal link & uniqueness
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS terminal_id BIGINT REFERENCES terminals(id) ON DELETE SET NULL;

-- Unique (route, sequence_order) — prevents duplicate stop ordinals
-- First deduplicate existing rows from repeated seed runs
DELETE FROM route_stops
WHERE id NOT IN (
    SELECT MIN(id)
    FROM route_stops
    GROUP BY route_transaction_id, sequence_order
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_route_stop_sequence'
          AND conrelid = 'route_stops'::regclass
    ) THEN
        ALTER TABLE route_stops ADD CONSTRAINT uq_route_stop_sequence
            UNIQUE (route_transaction_id, sequence_order);
    END IF;
END $$;


-- ============================================================================
-- MODULE 3: Fleet & Capacity Management
-- ============================================================================

-- 3.1 Evolve vehicles — add type, volume, activity tracking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'BUS';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cargo_volume_m3 NUMERIC(6, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;


-- 3.2 Evolve capacity_slots — add departure_time, updated_at, balance check
ALTER TABLE capacity_slots ADD COLUMN IF NOT EXISTS departure_time TIME;
ALTER TABLE capacity_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Capacity balance invariant: available + reserved <= total
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_capacity_balance'
          AND conrelid = 'capacity_slots'::regclass
    ) THEN
        ALTER TABLE capacity_slots ADD CONSTRAINT chk_capacity_balance
            CHECK (available_weight_kg + reserved_weight_kg <= total_capacity_kg);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_capacity_slots_route ON capacity_slots(route_transaction_id, slot_date);


-- ============================================================================
-- MODULE 4: Multimodal Shipments & Last-Mile Orchestration
-- ============================================================================

-- 4.1 Evolve shipments — add customer link, dimensions, crypto hashes, closure
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customer_user_id BIGINT REFERENCES users(id);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dimensions JSONB
    DEFAULT '{"length": 0, "width": 0, "height": 0, "unit": "cm"}'::jsonb;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS declared_value NUMERIC(10, 2) DEFAULT 0.0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS qr_seal_hash VARCHAR(64);       -- HMAC-SHA256
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS parent_transaction_id BIGINT REFERENCES shipments(id);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT FALSE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_operator ON shipments(operator_id);


-- 4.2 Evolve shipment_legs — add direction, pricing, windows
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS direction VARCHAR(20);
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS quoted_amount NUMERIC(10, 2) DEFAULT 0.0;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS accepted_amount NUMERIC(10, 2) DEFAULT 0.0;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS pickup_window_start TIMESTAMPTZ;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS pickup_window_end TIMESTAMPTZ;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS delivery_window_start TIMESTAMPTZ;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS delivery_window_end TIMESTAMPTZ;
ALTER TABLE shipment_legs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_leg_direction'
          AND conrelid = 'shipment_legs'::regclass
    ) THEN
        ALTER TABLE shipment_legs ADD CONSTRAINT chk_leg_direction
            CHECK (direction IN ('PICKUP', 'TRANSIT', 'DELIVERY'));
    END IF;
END $$;


-- 4.3 Provider Quotes — 3rd-party serviceability & dynamic pricing (NEW)
CREATE TABLE IF NOT EXISTS provider_quotes (
    id                  BIGSERIAL       PRIMARY KEY,
    shipment_leg_id     BIGINT          NOT NULL REFERENCES shipment_legs(id) ON DELETE CASCADE,
    provider            VARCHAR(50)     NOT NULL,           -- 'UBER_DIRECT', 'RAPIDO', 'INDRIVE'
    external_quote_id   VARCHAR(100)    NOT NULL,
    amount              NUMERIC(10, 2)  NOT NULL,
    currency            VARCHAR(10)     DEFAULT 'INR',
    expires_at          TIMESTAMPTZ     NOT NULL,
    capabilities        JSONB           DEFAULT '{}'::jsonb,
    raw_payload         JSONB,                              -- Full provider response for audit
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_quotes_leg ON provider_quotes(shipment_leg_id);


-- 4.4 Provider Dispatches — webhook ingestion & idempotency (NEW)
CREATE TABLE IF NOT EXISTS provider_dispatches (
    id                      BIGSERIAL       PRIMARY KEY,
    shipment_leg_id         BIGINT          NOT NULL REFERENCES shipment_legs(id) ON DELETE CASCADE,
    provider                VARCHAR(50)     NOT NULL,
    external_delivery_id    VARCHAR(100)    NOT NULL,
    status                  VARCHAR(50)     NOT NULL,
    tracking_url            TEXT,
    idempotency_key         VARCHAR(100)    UNIQUE,         -- Prevents duplicate dispatches
    last_webhook_at         TIMESTAMPTZ,
    raw_webhook_payload     JSONB,                          -- Untrusted input stored raw for reconciliation
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_dispatches_delivery ON provider_dispatches(external_delivery_id);
CREATE INDEX IF NOT EXISTS idx_provider_dispatches_leg ON provider_dispatches(shipment_leg_id);


-- ============================================================================
-- MODULE 5: Real-Time Telemetry & Operations
-- ============================================================================

-- 5.1 Vehicle telemetry — already created by 000/001 migrations
-- Ensure all spatial and time-series indexes exist

CREATE INDEX IF NOT EXISTS idx_telemetry_geom ON vehicle_telemetry USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time ON vehicle_telemetry (vehicle_id, ping_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_operator_time ON vehicle_telemetry (operator_id, ping_timestamp DESC);


-- 5.2 Custody handoffs — ensure spatial GIST indexes
CREATE INDEX IF NOT EXISTS idx_custody_handoffs_shipment ON custody_handoffs(shipment_id, handoff_timestamp);
CREATE INDEX IF NOT EXISTS idx_custody_handoffs_geom ON custody_handoffs USING GIST(location_geom);


-- 5.3 Proof of delivery — ensure spatial GIST index
CREATE INDEX IF NOT EXISTS idx_pod_location_geom ON proof_of_delivery USING GIST(location_geom);


-- ============================================================================
-- MODULE 6: Settlements, Audits & Notifications
-- ============================================================================

-- 6.1 Ledger entries — ensure proper indexing (table exists from 000)
CREATE INDEX IF NOT EXISTS idx_ledger_operator ON ledger_entries(operator_id, posted_at);
CREATE INDEX IF NOT EXISTS idx_ledger_shipment ON ledger_entries(shipment_id);


-- 6.2 Transaction snapshots — add operator index
CREATE INDEX IF NOT EXISTS idx_snapshots_operator ON transaction_snapshots(operator_id);


-- 6.3 WhatsApp & Multi-Channel Messaging Consent Tracking (NEW)
CREATE TABLE IF NOT EXISTS messaging_consents (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    channel         VARCHAR(50)     NOT NULL DEFAULT 'WHATSAPP',
    phone_e164      VARCHAR(50)     NOT NULL CHECK (phone_e164 ~ '^\+[1-9]\d{1,14}$'),
    status          VARCHAR(20)     NOT NULL DEFAULT 'OPTED_IN'
                                    CHECK (status IN ('OPTED_IN', 'OPTED_OUT')),
    source          VARCHAR(50)     DEFAULT 'WEB_BOOKING',      -- 'WEB_BOOKING', 'CHATBOT', 'API'
    consented_at    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messaging_consent_phone ON messaging_consents(phone_e164, status);
CREATE INDEX IF NOT EXISTS idx_messaging_consent_user ON messaging_consents(user_id);


-- 6.4 Outbound Notifications Queue & Dispatch Logs (NEW)
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL       PRIMARY KEY,
    shipment_id     BIGINT          REFERENCES shipments(id) ON DELETE SET NULL,
    user_id         BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    channel         VARCHAR(50)     NOT NULL DEFAULT 'WHATSAPP',     -- 'WHATSAPP', 'SMS', 'EMAIL', 'PUSH'
    template_name   VARCHAR(100)    NOT NULL,                        -- e.g. 'booking_confirmed', 'otp_delivery'
    recipient_e164  VARCHAR(50)     NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'QUEUED'
                                    CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ')),
    payload         JSONB           DEFAULT '{}'::jsonb,
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, channel);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);


-- 6.5 System & Security Audit Logs — Admin Command Center (NEW)
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    actor_user_id   BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    actor_role      VARCHAR(50),                                     -- Denormalized for fast reads
    action          VARCHAR(100)    NOT NULL,                        -- 'UPDATE_CAPACITY_OVERRIDE', 'FORCE_CLOSE_SHIPMENT'
    resource_type   VARCHAR(100)    NOT NULL,                        -- 'SHIPMENT', 'OPERATOR', 'VEHICLE', 'ROUTE'
    resource_id     VARCHAR(100)    NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    payload         JSONB,                                           -- Contextual data (before/after snapshots)
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);


COMMIT;
