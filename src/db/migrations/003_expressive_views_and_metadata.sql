-- =========================================================================
-- Transitly Expressive Domain Views & Schema Metadata (003)
-- Provides plain-English SQL Views and comprehensive Table/Column Comments
-- to make TablePlus and database inspection immediately clear to new users.
-- =========================================================================

-- =========================================================================
-- SECTION 1: IN-DATABASE DOCUMENTATION (TABLE COMMENTS)
-- =========================================================================

COMMENT ON TABLE users IS 'Registered platform actors including Customers, Fleet Operators, Bus Drivers, and Last-Mile Riders.';
COMMENT ON TABLE shipments IS 'Master parcel consignments: Tracks packages from initial booking through highway transit to final delivery.';
COMMENT ON TABLE shipment_legs IS 'Multimodal journey segments: Divides a parcel trip into Pickup (First-Mile), Bus Transit (Middle-Mile), and Dropoff (Last-Mile).';
COMMENT ON TABLE route_transactions IS 'Intercity bus route corridors and timetables operated by transit authorities like Haryana Roadways and DTC.';
COMMENT ON TABLE route_stops IS 'Sequential bus terminals, highway toll plazas, and depot waypoints along an intercity bus corridor.';
COMMENT ON TABLE capacity_slots IS 'Cargo bay space allocations: Represents available and booked luggage capacity (in kg) on specific bus departures.';
COMMENT ON TABLE vehicles IS 'Transit vehicles (public buses, electric fleet, intercity coaches) with cargo capacity and GPS tracking.';
COMMENT ON TABLE custody_handoffs IS 'Chain-of-custody transfer log: Records every handoff of a parcel between customer, delivery rider, and bus driver.';
COMMENT ON TABLE proof_of_delivery IS 'Cryptographic proof of completed delivery: Stores recipient signatures, geofence validations, OTP, and photos.';
COMMENT ON TABLE delivery_partner_profiles IS 'Delivery rider equipment and licensing: Tracks vehicle type (Bike, EV Scooter), license, and duty status.';
COMMENT ON TABLE riders IS 'Real-time delivery partner cockpit telemetry: Battery level, live GPS coordinates, rating, and auto-accept state.';
COMMENT ON TABLE shifts IS 'Delivery partner active duty shifts: Tracks shift duration, completed orders, and earnings ledger.';
COMMENT ON TABLE parcel_orders IS 'Rider-assigned parcel dispatch queue: Individual pickup and delivery tasks with distance, fare, and customer PIN.';
COMMENT ON TABLE dispatch_offers IS '30-second TTL priority order dispatch offers broadcasted to nearby delivery riders.';
COMMENT ON TABLE wallet_ledgers IS 'Double-entry partner financial ledger: Itemized earnings, tips, surge fares, and instant cash-out transactions.';
COMMENT ON TABLE support_tickets IS 'Customer care tickets: Support requests, missing parcel inquiries, and damaged seal reports.';
COMMENT ON TABLE saved_addresses IS 'Customer address book: Frequently used pickup and delivery locations with GPS coordinates and tags (home/work).';
COMMENT ON TABLE payment_methods IS 'Customer payment credentials: Saved credit/debit cards, UPI Virtual Payment Addresses, and digital wallets.';
COMMENT ON TABLE vehicle_telemetry IS 'High-frequency GPS tracking: Bus speed, heading, altitude, and live highway locations.';
COMMENT ON TABLE ledger_entries IS 'Platform-level financial ledger: Tracks platform fees, operator earnings, partner commissions, and refunds.';

-- Column Comments for Key Tables
COMMENT ON COLUMN shipments.tracking_id IS 'Unique customer-facing tracking number (e.g. TRK-88219)';
COMMENT ON COLUMN shipments.qr_seal_code IS 'Cryptographic tamper-evident barcode printed on the security seal lock';
COMMENT ON COLUMN shipments.qr_seal_tampered IS 'Boolean flag: Set to TRUE if the physical tamper seal was reported broken or compromised';
COMMENT ON COLUMN shipments.delivery_otp_verified IS 'Boolean flag: Set to TRUE when recipient presents the matching 4-digit PIN upon handover';
COMMENT ON COLUMN shipments.weight_kg IS 'Billable gross physical weight of the consignment in kilograms';
COMMENT ON COLUMN shipments.price IS 'Total delivery fee charged to the customer in Indian Rupees (INR)';

COMMENT ON COLUMN vehicles.registration IS 'Official Motor Vehicle registration number (e.g. HR-68-A-1001 or DL-01-AB-1234)';
COMMENT ON COLUMN vehicles.cargo_capacity_kg IS 'Maximum certified undercarriage cargo bay weight limit in kilograms';
COMMENT ON COLUMN vehicles.available_capacity_kg IS 'Remaining unbooked cargo capacity currently available on the bus';

COMMENT ON COLUMN route_transactions.logical_route_id IS 'Public corridor code (e.g. HR-DEL-CHD for Delhi to Chandigarh)';
COMMENT ON COLUMN route_transactions.origin_terminal IS 'Starting bus station or terminus (e.g. ISBT Kashmere Gate, New Delhi)';
COMMENT ON COLUMN route_transactions.destination_terminal IS 'Final terminus (e.g. ISBT Sector 17, Chandigarh)';

-- =========================================================================
-- SECTION 2: EXPRESSIVE BUSINESS VIEWS (RESOLVED FOREIGN KEYS)
-- =========================================================================

-- View 1: Complete Parcel Tracking & Delivery Overview
CREATE OR REPLACE VIEW view_parcel_delivery_overview AS
SELECT 
    s.id AS parcel_id,
    s.tracking_id,
    s.status AS delivery_status,
    s.sender_name,
    s.sender_phone,
    s.sender_address,
    s.recipient_name,
    s.recipient_phone,
    s.recipient_address,
    s.weight_kg,
    s.price AS total_fare_inr,
    COALESCE(v.registration, 'Unassigned') AS assigned_bus_registration,
    COALESCE(op.name, u_op.name, 'Transitly Intercity Network') AS fleet_operator,
    COALESCE(rt.logical_route_id, 'Direct Route') AS route_code,
    COALESCE(rt.origin_terminal, 'Origin Depot') AS departure_terminal,
    COALESCE(rt.destination_terminal, 'Destination Depot') AS arrival_terminal,
    s.qr_seal_code AS tamper_evident_seal_code,
    s.qr_seal_tampered,
    s.delivery_otp_verified,
    s.created_at AS booked_at
FROM shipments s
LEFT JOIN vehicles v ON s.assigned_vehicle_id = v.id
LEFT JOIN users u_op ON s.operator_id = u_op.id
LEFT JOIN operators op ON s.operator_id = op.id
LEFT JOIN route_transactions rt ON s.assigned_route_id = rt.id;

-- View 2: Intercity Bus Schedules & Undercarriage Cargo Space
CREATE OR REPLACE VIEW view_intercity_bus_schedules AS
SELECT 
    cs.id AS schedule_id,
    cs.slot_date AS departure_date,
    v.registration AS bus_registration_number,
    COALESCE(op.name, u.name, 'Haryana Roadways') AS bus_operator,
    rt.logical_route_id AS route_code,
    rt.origin_terminal AS origin_bus_station,
    rt.destination_terminal AS destination_bus_station,
    cs.total_capacity_kg AS total_cargo_capacity_kg,
    cs.available_weight_kg AS remaining_capacity_kg,
    cs.reserved_weight_kg AS booked_cargo_kg,
    ROUND((cs.reserved_weight_kg / NULLIF(cs.total_capacity_kg, 0) * 100), 1) AS cargo_bay_utilization_pct,
    cs.status AS schedule_status
FROM capacity_slots cs
JOIN vehicles v ON cs.vehicle_id = v.id
JOIN route_transactions rt ON cs.route_transaction_id = rt.id
LEFT JOIN users u ON cs.operator_id = u.id
LEFT JOIN operators op ON cs.operator_id = op.id;

-- View 3: Bus Corridors & Sequenced Intermediate Stops
CREATE OR REPLACE VIEW view_route_corridors_and_stops AS
SELECT 
    rt.logical_route_id AS corridor_code,
    rt.origin_terminal || ' ➔ ' || rt.destination_terminal AS corridor_title,
    rs.sequence_order AS stop_number,
    rs.stop_name AS station_or_depot_name,
    rs.latitude AS stop_latitude,
    rs.longitude AS stop_longitude,
    rs.estimated_stop_offset_minutes AS travel_minutes_from_origin,
    rt.status AS route_status
FROM route_stops rs
JOIN route_transactions rt ON rs.route_transaction_id = rt.id
ORDER BY rt.logical_route_id, rs.sequence_order;

-- View 4: Delivery Partner & Rider Cockpit Dashboard
CREATE OR REPLACE VIEW view_delivery_partner_cockpit AS
SELECT 
    r.id AS rider_id,
    u.name AS rider_full_name,
    u.phone AS rider_mobile_number,
    u.email AS rider_email,
    r.vehicle_type AS vehicle_model,
    r.vehicle_id_code AS vehicle_number,
    r.is_online AS is_currently_on_duty,
    r.auto_accept AS auto_accept_orders,
    r.rating AS partner_rating,
    r.review_count AS total_reviews_count,
    r.battery_level AS ev_battery_pct,
    r.battery_range_km AS estimated_driving_range_km,
    r.latitude AS current_gps_latitude,
    r.longitude AS current_gps_longitude,
    COALESCE(sh.completed_trips, 0) AS shift_completed_trips,
    COALESCE(sh.total_earnings, 0.00) AS shift_earnings_inr
FROM riders r
JOIN users u ON r.user_id = u.id
LEFT JOIN shifts sh ON r.active_shift_id = sh.id;

-- View 5: Chain of Custody & Parcel Transfer Audit Log
CREATE OR REPLACE VIEW view_custody_transfer_timeline AS
SELECT 
    ch.id AS transfer_id,
    ch.tracking_id AS parcel_tracking_code,
    ch.handoff_type AS custody_transition_phase,
    COALESCE(u_from.name, 'Customer / Sender') AS handed_over_by,
    COALESCE(ch.from_role, 'SENDER') AS sender_role,
    COALESCE(u_to.name, 'Transitly Delivery Agent') AS received_by,
    COALESCE(ch.to_role, 'CARRIER') AS receiver_role,
    ch.qr_seal_code AS security_tamper_seal,
    ch.seal_status AS tamper_seal_integrity,
    ch.is_within_geofence AS verified_inside_hub_geofence,
    ch.distance_meters AS distance_from_hub_meters,
    ch.notes AS audit_notes,
    ch.handoff_timestamp AS transfer_timestamp
FROM custody_handoffs ch
LEFT JOIN users u_from ON ch.from_user_id = u_from.id
LEFT JOIN users u_to ON ch.to_user_id = u_to.id
ORDER BY ch.handoff_timestamp DESC;

-- View 6: Customer Support Desk & Inquiry Log
CREATE OR REPLACE VIEW view_customer_support_cases AS
SELECT 
    st.id AS ticket_id,
    u.name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    st.tracking_id AS related_tracking_number,
    st.category AS inquiry_category,
    st.description AS issue_details,
    st.status AS ticket_status,
    st.created_at AS submitted_at
FROM support_tickets st
JOIN users u ON st.user_id = u.id;

-- View 7: Customer Profiles & Wallet Ecosystem
CREATE OR REPLACE VIEW view_customer_profiles_and_accounts AS
SELECT 
    u.id AS user_id,
    u.user_uuid,
    u.name AS customer_full_name,
    u.email AS primary_email,
    u.phone AS contact_phone,
    u.role AS user_role,
    (SELECT COUNT(*) FROM saved_addresses sa WHERE sa.user_id = u.id) AS saved_delivery_addresses,
    (SELECT COUNT(*) FROM payment_methods pm WHERE pm.user_id = u.id) AS saved_payment_methods,
    u.created_at AS account_created_at
FROM users u;
