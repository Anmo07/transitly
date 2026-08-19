-- PostGIS Spatial Telemetry Schema Migration
CREATE EXTENSION IF NOT EXISTS postgis;

-- Durable Slow-Path Telemetry Storage
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

-- Spatial GIST Index for high-performance geospatial queries & geofence joins
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_geom 
ON vehicle_telemetry USING GIST (geom);

-- B-Tree Compound Index for vehicle route history & playback
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_vehicle_time 
ON vehicle_telemetry (vehicle_id, ping_timestamp DESC);

-- Index on operator for tenant-based telemetry reporting
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_operator_time 
ON vehicle_telemetry (operator_id, ping_timestamp DESC);
