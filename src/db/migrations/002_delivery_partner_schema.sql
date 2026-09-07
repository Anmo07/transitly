-- =========================================================================
-- Transitly Delivery Partner & Real-Time Logistics Schema (002)
-- Dedicated tables for Rider Cockpit, Dispatch Queue, In-Transit & Wallet
-- =========================================================================

-- 1. Riders Profile & Real-Time Telemetry State
CREATE TABLE IF NOT EXISTS riders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT TRUE,
    auto_accept BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 4.94,
    review_count INT DEFAULT 240,
    acceptance_rate NUMERIC(5, 2) DEFAULT 96.00,
    vehicle_type VARCHAR(100) DEFAULT 'NIU NQi-Sport',
    vehicle_id_code VARCHAR(50) DEFAULT 'DX-412',
    battery_level INT DEFAULT 82,
    battery_range_km NUMERIC(5, 1) DEFAULT 46.0,
    safety_checklist_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    latitude DOUBLE PRECISION DEFAULT 28.6315,
    longitude DOUBLE PRECISION DEFAULT 77.2167,
    active_shift_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_riders_online ON riders(is_online);
CREATE INDEX IF NOT EXISTS idx_riders_user ON riders(user_id);

-- 2. Duty Shifts Tracker
CREATE TABLE IF NOT EXISTS shifts (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT REFERENCES riders(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    total_online_seconds INT DEFAULT 15120, -- 4h 12m
    completed_trips INT DEFAULT 8,
    total_earnings NUMERIC(10, 2) DEFAULT 84.50,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_shifts_rider ON shifts(rider_id);

-- 3. Parcel Orders & Delivery Tasks
CREATE TABLE IF NOT EXISTS parcel_orders (
    id BIGSERIAL PRIMARY KEY,
    tracking_code VARCHAR(50) UNIQUE NOT NULL,
    sender_id BIGINT,
    recipient_id BIGINT,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) DEFAULT '+15550192',
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) DEFAULT '+15550193342',
    pickup_address TEXT NOT NULL,
    pickup_hub VARCHAR(255),
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dropoff_address TEXT NOT NULL,
    dropoff_recipient VARCHAR(255),
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    package_type VARCHAR(100) DEFAULT 'Express Box Delivery',
    package_category VARCHAR(100) DEFAULT 'Fragile & Secure',
    weight_kg NUMERIC(5, 2) DEFAULT 1.8,
    status VARCHAR(50) NOT NULL DEFAULT 'UNASSIGNED',
    delivery_otp VARCHAR(255) DEFAULT '4820',
    base_fare NUMERIC(10, 2) DEFAULT 11.80,
    surge_fare NUMERIC(10, 2) DEFAULT 3.00,
    tip_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_payout NUMERIC(10, 2) DEFAULT 14.80,
    distance_km NUMERIC(5, 2) DEFAULT 5.1,
    pickup_distance_km NUMERIC(5, 2) DEFAULT 2.4,
    estimated_duration_min INT DEFAULT 22,
    assigned_rider_id BIGINT REFERENCES riders(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parcel_orders_status ON parcel_orders(status);
CREATE INDEX IF NOT EXISTS idx_parcel_orders_rider ON parcel_orders(assigned_rider_id);
CREATE INDEX IF NOT EXISTS idx_parcel_orders_tracking ON parcel_orders(tracking_code);

-- 4. 30-Second Timed Priority Dispatch Offers
CREATE TABLE IF NOT EXISTS dispatch_offers (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES parcel_orders(id) ON DELETE CASCADE,
    rider_id BIGINT REFERENCES riders(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    offered_payout NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispatch_offers_rider_status ON dispatch_offers(rider_id, status);

-- 5. Wallet & Financial Ledger
CREATE TABLE IF NOT EXISTS wallet_ledgers (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT REFERENCES riders(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES parcel_orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'SETTLED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledgers_rider ON wallet_ledgers(rider_id);

-- 6. Quests and Incentives
CREATE TABLE IF NOT EXISTS quest_progress (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT REFERENCES riders(id) ON DELETE CASCADE,
    quest_title VARCHAR(255) NOT NULL,
    target_count INT NOT NULL DEFAULT 10,
    current_count INT NOT NULL DEFAULT 8,
    bonus_amount NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    expires_at TIMESTAMPTZ,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Initial Master Seed Data for Delivery Partner Testing
-- Perfectly matches Screen 1, 2, 3, 4 Data & Metrics
-- =========================================================================

-- Seed Primary Rider (ID: 1) corresponding to Rajesh Kumar (User 11)
INSERT INTO riders (id, user_id, is_online, auto_accept, rating, review_count, acceptance_rate, vehicle_type, vehicle_id_code, battery_level, battery_range_km, latitude, longitude)
VALUES (1, 11, TRUE, TRUE, 4.94, 240, 96.00, 'NIU NQi-Sport', 'DX-412', 82, 46.0, 28.6315, 77.2167)
ON CONFLICT (id) DO UPDATE SET
    is_online = EXCLUDED.is_online,
    auto_accept = EXCLUDED.auto_accept,
    rating = EXCLUDED.rating,
    battery_level = EXCLUDED.battery_level;

-- Seed Shift for Rider 1
INSERT INTO shifts (id, rider_id, started_at, total_online_seconds, completed_trips, total_earnings, is_active)
VALUES (1, 1, CURRENT_TIMESTAMP - INTERVAL '4 hours 12 minutes', 15120, 8, 84.50, TRUE)
ON CONFLICT (id) DO NOTHING;

UPDATE riders SET active_shift_id = 1 WHERE id = 1;

-- Seed Delivery Tasks (In-Transit #TRZ-4820 and Next Pickup #TRZ-9921)
INSERT INTO parcel_orders (
    id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone,
    pickup_address, pickup_hub, pickup_lat, pickup_lng,
    dropoff_address, dropoff_recipient, dropoff_lat, dropoff_lng,
    package_type, package_category, weight_kg, status, delivery_otp,
    base_fare, surge_fare, tip_amount, total_payout, distance_km, pickup_distance_km, estimated_duration_min,
    assigned_rider_id
) VALUES 
(
    1, '#TRZ-4820', 'TechCorp Logistics', '+15550192', 'David Miller', '+15550193342',
    'TechCorp Logistics • Hub B4, Industrial Zone', 'Hub B4', 28.6350, 77.2150,
    '428 Elm Street, Riverdale • Apt 4B', 'David Miller • Apt 4B', 28.6315, 77.2167,
    'Express Box Delivery', 'Fragile & Secure', 1.8, 'IN_TRANSIT', '4820',
    11.80, 3.00, 0.00, 14.80, 5.1, 2.4, 22,
    1
),
(
    2, '#TRZ-9921', 'Central Medical Supply', '+15550192', 'Dr. Sarah Jenkins', '+15550193355',
    'Central Hub Terminal 4, Bay 12, Level 2 • Gate B Secure Dock', 'Central Hub Terminal 4', 28.6400, 77.2200,
    'St. Jude Medical Care, Sector 5', 'Emergency Desk', 28.6250, 77.2100,
    'Expedited Medic/Supply', 'Medical Essential', 1.8, 'ACCEPTED', '9921',
    18.50, 2.50, 2.00, 23.00, 3.8, 1.2, 16,
    1
)
ON CONFLICT (id) DO NOTHING;

-- Seed Available Queue Parcels for Screen 3
INSERT INTO parcel_orders (
    id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone,
    pickup_address, dropoff_address, package_type, package_category, weight_kg,
    status, base_fare, surge_fare, total_payout, distance_km, pickup_distance_km, estimated_duration_min
) VALUES
(
    3, '#TRZ-5501', 'Artisan Bakery & Pantry', '+1555019881', 'Kensington Terraces #12', '+1555019882',
    'High Street Central, Bakery Lane', 'Kensington Terraces #12', 'Fresh Goods / Pastries', 'Standard', 2.1,
    'UNASSIGNED', 16.20, 3.00, 19.20, 4.2, 1.2, 28
),
(
    4, '#TRZ-5502', 'CarePharmacy Express', '+1555019883', 'Oakridge Medical Center Rm 204', '+1555019884',
    '7th Avenue Clinic', 'Oakridge Medical Center Rm 204', 'Prescription Medicine', 'Fragile', 0.8,
    'UNASSIGNED', 11.00, 1.50, 12.50, 2.4, 0.6, 15
),
(
    5, '#TRZ-5503', 'E-Commerce Return Bundles', '+1555019885', 'Hub Drop Center', '+1555019886',
    'Pickups: High St Commercial Hub', 'Central Hub Drop 2', 'E-Commerce Return', '2 Stops', 4.4,
    'UNASSIGNED', 20.40, 3.00, 23.40, 6.8, 2.8, 36
)
ON CONFLICT (id) DO NOTHING;

-- Seed Wallet Ledgers (Starting balance $148.50 with recent deliveries)
INSERT INTO wallet_ledgers (id, rider_id, order_id, type, description, amount, balance_after, status, created_at)
VALUES
(1, 1, NULL, 'INITIAL_BALANCE', 'Opening Wallet Balance', 127.80, 127.80, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(2, 1, NULL, 'FARE', 'Oakwood Pharmacy (0.6 kg Cold Chain)', 9.20, 137.00, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '24 minutes'),
(3, 1, NULL, 'TIP', 'Customer Tip — Oakwood Pharmacy', 2.00, 139.00, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '24 minutes'),
(4, 1, NULL, 'FARE', 'Riverside Office Park (3.2 kg Documents)', 9.50, 148.50, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '1 hour 5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Seed Daily Quest (Sprint Bonus Tier 2)
INSERT INTO quest_progress (id, rider_id, quest_title, target_count, current_count, bonus_amount, expires_at, is_claimed)
VALUES (1, 1, 'Sprint Bonus Tier 2', 10, 8, 25.00, CURRENT_TIMESTAMP + INTERVAL '1 hour 42 minutes', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Reset Sequences
SELECT setval('riders_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM riders));
SELECT setval('shifts_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM shifts));
SELECT setval('parcel_orders_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM parcel_orders));
SELECT setval('dispatch_offers_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM dispatch_offers));
SELECT setval('wallet_ledgers_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM wallet_ledgers));
SELECT setval('quest_progress_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM quest_progress));
