-- ==============================================================================
-- Transitly Master Seed Data
-- ==============================================================================

-- 1. Users
INSERT INTO users (id, name, email, phone, role) VALUES
(1, 'Delhi Transport Corporation', 'operator@dtc.delhi.gov.in', '+911123456789', 'OPERATOR'),
(2, 'Aarav Sharma (Sender)', 'aarav.sharma@example.com', '+919876543210', 'CUSTOMER'),
(3, 'Rohan Verma (Recipient)', 'rohan.verma@example.com', '+919876543211', 'CUSTOMER'),
(4, 'Express Last-Mile Delivery Partners', 'partner@expresslogistics.in', '+919876543212', 'DELIVERY_PARTNER'),
(5, 'Rajesh Kumar (Bus Captain)', 'rajesh.driver@dtc.in', '+919876543213', 'DRIVER')
ON CONFLICT (id) DO NOTHING;

-- 2. Vehicles
INSERT INTO vehicles (id, operator_id, registration, cargo_capacity_kg, available_capacity_kg, last_latitude, last_longitude, last_geom) VALUES
(1, 1, 'DL-01-AB-1234', 500.00, 420.00, 28.6320, 77.2180, ST_SetSRID(ST_MakePoint(77.2180, 28.6320), 4326)),
(2, 1, 'DL-01-CD-5678', 600.00, 600.00, 28.6675, 77.2285, ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326))
ON CONFLICT (id) DO NOTHING;

-- 3. Route Master Transactions (OCP: Logical Route TR-DEL-JAI Version 1)
INSERT INTO route_transactions (id, logical_route_id, version, operator_id, origin_terminal, origin_geom, destination_terminal, destination_geom, is_latest, status) VALUES
(1, 'TR-DEL-JAI', 1, 1, 'ISBT Kashmere Gate, Delhi', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 'Sindhi Camp Bus Stand, Jaipur', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), TRUE, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Route Stops along Delhi-Jaipur Highway
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(1, 'ISBT Kashmere Gate (Origin)', 28.6675, 77.2285, ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 1, 0),
(1, 'IFFCO Chowk, Gurgaon', 28.4720, 77.0725, ST_SetSRID(ST_MakePoint(77.0725, 28.4720), 4326), 2, 45),
(1, 'Dharuhera Express Stop', 28.2055, 76.7942, ST_SetSRID(ST_MakePoint(76.7942, 28.2055), 4326), 3, 90),
(1, 'Behror Mid-way Hub', 27.8920, 76.2840, ST_SetSRID(ST_MakePoint(76.2840, 27.8920), 4326), 4, 150),
(1, 'Kotputli Transit Point', 27.7010, 76.1985, ST_SetSRID(ST_MakePoint(76.1985, 27.7010), 4326), 5, 195),
(1, 'Sindhi Camp, Jaipur (Destination)', 26.9124, 75.7873, ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), 6, 300)
ON CONFLICT DO NOTHING;

-- 5. Capacity Slots
INSERT INTO capacity_slots (id, operator_id, vehicle_id, route_transaction_id, slot_date, total_capacity_kg, available_weight_kg, reserved_weight_kg, version, status) VALUES
(1, 1, 1, 1, CURRENT_DATE, 500.00, 420.00, 80.00, 2, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Active Shipment
INSERT INTO shipments (
    id, tracking_id, operator_id, capacity_slot_id, assigned_vehicle_id, assigned_route_id,
    status, version, sender_name, sender_phone, sender_address,
    recipient_name, recipient_phone, recipient_address,
    weight_kg, price, qr_seal_code, qr_seal_tampered,
    pickup_geom, delivery_geom
) VALUES (
    1, 'TRK-DEL-JAI-9876', 1, 1, 1, 1,
    'IN_TRANSIT', 3, 'Aarav Sharma', '+919876543210', 'Connaught Place, New Delhi',
    'Rohan Verma', '+919876543211', 'Malviya Nagar, Jaipur',
    15.00, 450.00, 'SEAL-8F3A-9B21-4C10', FALSE,
    ST_SetSRID(ST_MakePoint(77.2167, 28.6315), 4326),
    ST_SetSRID(ST_MakePoint(75.8150, 26.8530), 4326)
) ON CONFLICT (id) DO NOTHING;

-- 7. Shipment Legs
INSERT INTO shipment_legs (id, shipment_id, tracking_id, leg_type, provider, status, pickup_address, pickup_geom, dropoff_address, dropoff_geom, price) VALUES
(1, 1, 'TRK-DEL-JAI-9876', 'PICKUP_LAST_MILE', 'UBER_DIRECT', 'COMPLETED', 'Connaught Place, New Delhi', ST_SetSRID(ST_MakePoint(77.2167, 28.6315), 4326), 'ISBT Kashmere Gate', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 85.00),
(2, 1, 'TRK-DEL-JAI-9876', 'TRANSIT', 'PUBLIC_TRANSIT', 'IN_TRANSIT', 'ISBT Kashmere Gate', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 'Sindhi Camp, Jaipur', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), 280.00),
(3, 1, 'TRK-DEL-JAI-9876', 'DELIVERY_LAST_MILE', 'UBER_DIRECT', 'QUOTED', 'Sindhi Camp, Jaipur', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), 'Malviya Nagar, Jaipur', ST_SetSRID(ST_MakePoint(75.8150, 26.8530), 4326), 85.00)
ON CONFLICT (id) DO NOTHING;

-- 8. Custody Handoff
INSERT INTO custody_handoffs (shipment_id, tracking_id, from_user_id, to_user_id, from_role, to_role, qr_seal_code, seal_status, handoff_type, location_geom, is_within_geofence) VALUES
(1, 'TRK-DEL-JAI-9876', 2, 5, 'CUSTOMER', 'DRIVER', 'SEAL-8F3A-9B21-4C10', 'INTACT', 'LOAD_TO_VEHICLE', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), TRUE)
ON CONFLICT DO NOTHING;

-- 9. Sample Telemetry Spatial Pings
INSERT INTO vehicle_telemetry (vehicle_id, operator_id, latitude, longitude, geom, speed_kmh, heading, ping_timestamp) VALUES
('DL-01-AB-1234', '1', 28.6675, 77.2285, ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 0.0, 0, NOW() - INTERVAL '3 hours'),
('DL-01-AB-1234', '1', 28.4720, 77.0725, ST_SetSRID(ST_MakePoint(77.0725, 28.4720), 4326), 62.5, 210, NOW() - INTERVAL '2 hours'),
('DL-01-AB-1234', '1', 28.2055, 76.7942, ST_SetSRID(ST_MakePoint(76.7942, 28.2055), 4326), 70.0, 225, NOW() - INTERVAL '1 hour'),
('DL-01-AB-1234', '1', 27.8920, 76.2840, ST_SetSRID(ST_MakePoint(76.2840, 27.8920), 4326), 68.0, 230, NOW() - INTERVAL '20 minutes')
ON CONFLICT DO NOTHING;

-- Reset sequence IDs
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vehicles));
SELECT setval('route_transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM route_transactions));
SELECT setval('capacity_slots_id_seq', (SELECT COALESCE(MAX(id), 1) FROM capacity_slots));
SELECT setval('shipments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shipments));
SELECT setval('shipment_legs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shipment_legs));
