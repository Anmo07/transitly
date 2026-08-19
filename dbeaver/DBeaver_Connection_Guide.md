# Transitly — DBeaver Integration & Spatial Viewer Guide

This guide walks you through connecting **DBeaver** to the Transitly Master Database (PostgreSQL + PostGIS) and utilizing DBeaver's built-in **GIS Spatial Map Viewer** to inspect routes, geofences, and vehicle GPS pings visually on OpenStreetMap.

---

## 1. Quick Connection Settings

Open DBeaver and click **New Database Connection** (Plug icon with plus sign).

| Setting | Value |
| :--- | :--- |
| **Driver** | **PostgreSQL** |
| **Host** | `localhost` |
| **Port** | `5433` *(mapped container port, or `5432` if accessing container directly)* |
| **Database** | `transitly_telemetry` |
| **Authentication** | Database Native |
| **Username** | `postgres` |
| **Password** | `postgrespassword` |

> [!TIP]
> **Docker Startup:** Before connecting, ensure your database container is running:
> ```bash
> docker-compose up -d
> npm run db:init
> ```

---

## 2. Enabling DBeaver PostGIS Spatial Viewer (Interactive Map)

All spatial columns in Transitly (`geom`, `origin_geom`, `destination_geom`, `pickup_geom`, `delivery_geom`, `location_geom`) use the **PostGIS `GEOMETRY(Point, 4326)`** standard.

### How to View Locations on an Interactive Map:
1. In DBeaver, open any table with spatial data (e.g. `route_stops`, `vehicles`, `vehicle_telemetry`, or `shipment_legs`).
2. Click on the **Data** tab to view rows.
3. Select any cell in the `geom` column.
4. On the right-hand panel, click the **Spatial (GIS)** view tab (Globe/Map icon).
5. DBeaver will automatically render the exact pinpoint location overlaid on an OpenStreetMap / Leaflet tile layer!

---

## 3. Pre-Built SQL Bookmarks for DBeaver

You can open an SQL Editor tab (`F3` or `Ctrl+]` / `Cmd+]`) in DBeaver and execute these queries:

### Query A: Inspect Master Bus Routes & Geocoded Stops
```sql
SELECT 
    r.logical_route_id,
    r.version,
    r.origin_terminal,
    r.destination_terminal,
    s.sequence_order,
    s.stop_name,
    s.latitude,
    s.longitude,
    s.geom
FROM route_transactions r
JOIN route_stops s ON r.id = s.route_transaction_id
WHERE r.is_latest = TRUE
ORDER BY s.sequence_order ASC;
```

### Query B: Inspect Multimodal Shipment Parent-Child Legs
```sql
SELECT 
    s.tracking_id,
    s.status AS parent_status,
    s.sender_name,
    s.recipient_name,
    l.leg_type,
    l.provider,
    l.status AS leg_status,
    l.pickup_address,
    l.dropoff_address,
    l.price AS leg_price,
    l.pickup_geom,
    l.dropoff_geom
FROM shipments s
JOIN shipment_legs l ON s.id = l.shipment_id
ORDER BY s.id, l.id;
```

### Query C: Real-Time Vehicle Telemetry Trail & Speed
```sql
SELECT 
    vehicle_id,
    operator_id,
    latitude,
    longitude,
    speed_kmh,
    heading,
    ping_timestamp,
    geom
FROM vehicle_telemetry
ORDER BY ping_timestamp DESC
LIMIT 50;
```

### Query D: Immutable Chain of Custody Audit Log
```sql
SELECT 
    c.tracking_id,
    c.from_role,
    c.to_role,
    c.qr_seal_code,
    c.seal_status,
    c.handoff_type,
    c.is_within_geofence,
    c.handoff_timestamp,
    c.location_geom
FROM custody_handoffs c
ORDER BY c.handoff_timestamp ASC;
```

---

## 4. Optional MongoDB Connection in DBeaver

If you are using **DBeaver Enterprise / Ultimate Edition** or **MongoDB Compass**:
- **Driver:** MongoDB
- **Host:** `localhost`
- **Port:** `27017`
- **Database:** `transitly`
