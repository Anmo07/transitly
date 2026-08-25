-- ==============================================================================
-- Official Haryana Roadways Major Intercity Corridors & Stops
-- ==============================================================================

-- 1. Operator: State Express Transport
INSERT INTO users (id, name, email, phone, role) VALUES
(10, 'State Express Transport (SE-Transit)', 'logistics@stateexpress.transit.gov.in', '+911722704510', 'OPERATOR')
ON CONFLICT (id) DO NOTHING;

-- 2. Haryana Roadways Fleet Vehicles
INSERT INTO vehicles (id, operator_id, registration, cargo_capacity_kg, available_capacity_kg, last_latitude, last_longitude, last_geom) VALUES
(101, 10, 'HR-55-AB-1234', 500.00, 450.00, 28.9950, 77.0190, ST_SetSRID(ST_MakePoint(77.0190, 28.9950), 4326)),
(102, 10, 'HR-68-CD-5678', 650.00, 600.00, 29.6857, 76.9905, ST_SetSRID(ST_MakePoint(76.9905, 29.6857), 4326)),
(103, 10, 'HR-39-EF-9012', 550.00, 500.00, 28.8955, 76.6066, ST_SetSRID(ST_MakePoint(76.6066, 28.8955), 4326)),
(104, 10, 'HR-24-GH-3456', 500.00, 480.00, 28.1920, 76.6180, ST_SetSRID(ST_MakePoint(76.6180, 28.1920), 4326)),
(105, 10, 'HR-01-IJ-7890', 600.00, 550.00, 30.1290, 77.2670, ST_SetSRID(ST_MakePoint(77.2670, 30.1290), 4326))
ON CONFLICT (id) DO NOTHING;

-- 3. Route Transactions (OCP Version 1 for 5 Major Corridors)
INSERT INTO route_transactions (id, logical_route_id, version, operator_id, origin_terminal, origin_geom, destination_terminal, destination_geom, is_latest, status) VALUES
-- Corridor 1: GT Road Trunk (Delhi to Chandigarh)
(10, 'HR-DEL-CHD', 1, 10, 'ISBT Kashmere Gate, Delhi', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 'ISBT Sector 17, Chandigarh', ST_SetSRID(ST_MakePoint(76.7790, 30.7410), 4326), TRUE, 'ACTIVE'),

-- Corridor 2: South Haryana Express (Delhi to Narnaul via Rewari)
(11, 'HR-DEL-NRN', 1, 10, 'ISBT Kashmere Gate, Delhi', ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 'Narnaul Central Bus Depot', ST_SetSRID(ST_MakePoint(76.1080, 28.0430), 4326), TRUE, 'ACTIVE'),

-- Corridor 3: West Haryana Highway (Delhi to Sirsa via Rohtak & Hisar)
(12, 'HR-DEL-SRS', 1, 10, 'Delhi Tikri Border', ST_SetSRID(ST_MakePoint(76.9650, 28.6920), 4326), 'Sirsa Central Bus Stand', ST_SetSRID(ST_MakePoint(75.0280, 29.5340), 4326), TRUE, 'ACTIVE'),

-- Corridor 4: NCR Southern Link (Gurgaon to Hodal via Faridabad & Palwal)
(13, 'HR-GGN-HDL', 1, 10, 'Gurgaon Central Bus Stand', ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326), 'Hodal Border Terminal', ST_SetSRID(ST_MakePoint(77.3710, 27.8920), 4326), TRUE, 'ACTIVE'),

-- Corridor 5: North-East Industrial (Chandigarh to Yamunanagar/Jagadhri)
(14, 'HR-CHD-YMN', 1, 10, 'ISBT Sector 17, Chandigarh', ST_SetSRID(ST_MakePoint(76.7790, 30.7410), 4326), 'Jagadhri Terminal', ST_SetSRID(ST_MakePoint(77.2910, 30.1340), 4326), TRUE, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Route Stops for Corridor 1: GT Road Trunk (Delhi ➔ Chandigarh)
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(10, 'ISBT Kashmere Gate, Delhi (Origin)', 28.6675, 77.2285, ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 1, 0),
(10, 'Sonipat Bus Stand', 28.9950, 77.0190, ST_SetSRID(ST_MakePoint(77.0190, 28.9950), 4326), 2, 45),
(10, 'Panipat Toll Plaza Hub', 29.3909, 76.9635, ST_SetSRID(ST_MakePoint(76.9635, 29.3909), 4326), 3, 90),
(10, 'Karnal Central Bus Stand', 29.6857, 76.9905, ST_SetSRID(ST_MakePoint(76.9905, 29.6857), 4326), 4, 135),
(10, 'Kurukshetra Pipli Junction', 29.9695, 76.8783, ST_SetSRID(ST_MakePoint(76.8783, 29.9695), 4326), 5, 175),
(10, 'Ambala Cantt Bus Stand', 30.3610, 76.8375, ST_SetSRID(ST_MakePoint(76.8375, 30.3610), 4326), 6, 220),
(10, 'Zirakpur Flyover Hub', 30.6425, 76.8173, ST_SetSRID(ST_MakePoint(76.8173, 30.6425), 4326), 7, 260),
(10, 'ISBT Sector 17, Chandigarh (Destination)', 30.7410, 76.7790, ST_SetSRID(ST_MakePoint(76.7790, 30.7410), 4326), 8, 290)
ON CONFLICT DO NOTHING;

-- Route Stops for Corridor 2: South Haryana Express (Delhi ➔ Narnaul)
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(11, 'ISBT Kashmere Gate, Delhi (Origin)', 28.6675, 77.2285, ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326), 1, 0),
(11, 'Dhaula Kuan Transit Hub', 28.5921, 77.1610, ST_SetSRID(ST_MakePoint(77.1610, 28.5921), 4326), 2, 30),
(11, 'IFFCO Chowk, Gurgaon', 28.4720, 77.0725, ST_SetSRID(ST_MakePoint(77.0725, 28.4720), 4326), 3, 60),
(11, 'Manesar Industrial Depot', 28.3580, 76.9380, ST_SetSRID(ST_MakePoint(76.9380, 28.3580), 4326), 4, 85),
(11, 'Dharuhera Express Stop', 28.2055, 76.7942, ST_SetSRID(ST_MakePoint(76.7942, 28.2055), 4326), 5, 115),
(11, 'Rewari New Bus Stand', 28.1920, 76.6180, ST_SetSRID(ST_MakePoint(76.6180, 28.1920), 4326), 6, 150),
(11, 'Kund Crossing Junction', 28.1420, 76.4150, ST_SetSRID(ST_MakePoint(76.4150, 28.1420), 4326), 7, 185),
(11, 'Narnaul Central Bus Depot (Destination)', 28.0430, 76.1080, ST_SetSRID(ST_MakePoint(76.1080, 28.0430), 4326), 8, 220)
ON CONFLICT DO NOTHING;

-- Route Stops for Corridor 3: West Haryana Highway (Delhi ➔ Sirsa)
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(12, 'Delhi Tikri Border (Origin)', 28.6920, 76.9650, ST_SetSRID(ST_MakePoint(76.9650, 28.6920), 4326), 1, 0),
(12, 'Bahadurgarh Bus Stand', 28.6880, 76.9240, ST_SetSRID(ST_MakePoint(76.9240, 28.6880), 4326), 2, 20),
(12, 'Rohtak New Bus Stand', 28.8955, 76.6066, ST_SetSRID(ST_MakePoint(76.6066, 28.8955), 4326), 3, 65),
(12, 'Meham Transit Point', 28.9680, 76.2950, ST_SetSRID(ST_MakePoint(76.2950, 28.9680), 4326), 4, 105),
(12, 'Hansi Bus Stand', 29.1020, 75.9620, ST_SetSRID(ST_MakePoint(75.9620, 29.1020), 4326), 5, 145),
(12, 'Hisar Central Bus Depot', 29.1539, 75.7229, ST_SetSRID(ST_MakePoint(75.7229, 29.1539), 4326), 6, 180),
(12, 'Agroha Highway Hub', 29.3510, 75.6120, ST_SetSRID(ST_MakePoint(75.6120, 29.3510), 4326), 7, 215),
(12, 'Fatehabad Bus Stand', 29.5150, 75.4540, ST_SetSRID(ST_MakePoint(75.4540, 29.5150), 4326), 8, 250),
(12, 'Sirsa Central Bus Stand (Destination)', 29.5340, 75.0280, ST_SetSRID(ST_MakePoint(75.0280, 29.5340), 4326), 9, 295)
ON CONFLICT DO NOTHING;

-- Route Stops for Corridor 4: NCR Southern Link (Gurgaon ➔ Hodal)
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(13, 'Gurgaon Central Bus Stand (Origin)', 28.4595, 77.0266, ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326), 1, 0),
(13, 'Faridabad NIT Bus Depot', 28.3980, 77.3060, ST_SetSRID(ST_MakePoint(77.3060, 28.3980), 4326), 2, 40),
(13, 'Ballabhgarh Bus Stand', 28.3370, 77.3240, ST_SetSRID(ST_MakePoint(77.3240, 28.3370), 4326), 3, 60),
(13, 'Palwal Central Hub', 28.1430, 77.3320, ST_SetSRID(ST_MakePoint(77.3320, 28.1430), 4326), 4, 95),
(13, 'Hodal Border Terminal (Destination)', 27.8920, 77.3710, ST_SetSRID(ST_MakePoint(77.3710, 27.8920), 4326), 5, 130)
ON CONFLICT DO NOTHING;

-- Route Stops for Corridor 5: North-East Industrial (Chandigarh ➔ Yamunanagar)
INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, geom, sequence_order, estimated_stop_offset_minutes) VALUES
(14, 'ISBT Sector 17, Chandigarh (Origin)', 30.7410, 76.7790, ST_SetSRID(ST_MakePoint(76.7790, 30.7410), 4326), 1, 0),
(14, 'Ambala City Hub', 30.3780, 76.7760, ST_SetSRID(ST_MakePoint(76.7760, 30.3780), 4326), 2, 50),
(14, 'Saha Industrial Junction', 30.2450, 76.9850, ST_SetSRID(ST_MakePoint(76.9850, 30.2450), 4326), 3, 85),
(14, 'Yamunanagar Central Bus Stand', 30.1290, 77.2670, ST_SetSRID(ST_MakePoint(77.2670, 30.1290), 4326), 4, 120),
(14, 'Jagadhri Terminal (Destination)', 30.1340, 77.2910, ST_SetSRID(ST_MakePoint(77.2910, 30.1340), 4326), 5, 140)
ON CONFLICT DO NOTHING;

-- 5. Capacity Slots for Haryana Roadways Corridors
INSERT INTO capacity_slots (id, operator_id, vehicle_id, route_transaction_id, slot_date, total_capacity_kg, available_weight_kg, reserved_weight_kg, version, status) VALUES
(10, 10, 101, 10, CURRENT_DATE, 500.00, 450.00, 50.00, 1, 'AVAILABLE'),
(11, 10, 102, 10, CURRENT_DATE, 650.00, 600.00, 50.00, 1, 'AVAILABLE'),
(12, 10, 103, 12, CURRENT_DATE, 550.00, 500.00, 50.00, 1, 'AVAILABLE'),
(13, 10, 104, 11, CURRENT_DATE, 500.00, 480.00, 20.00, 1, 'AVAILABLE'),
(14, 10, 105, 14, CURRENT_DATE, 600.00, 550.00, 50.00, 1, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence IDs
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vehicles));
SELECT setval('route_transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM route_transactions));
SELECT setval('capacity_slots_id_seq', (SELECT COALESCE(MAX(id), 1) FROM capacity_slots));
