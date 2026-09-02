# Transitly — PostgreSQL & PostGIS Terminal & Extension Guide

This guide establishes the direct, fast, terminal-first and IDE extension workflow for developing and inspecting the Transitly Master Database (PostgreSQL 16 + PostGIS).

---

## 1. Quick Terminal Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Interactive `psql` shell** | `npm run db:psql` | Opens an interactive `psql` console inside the PostGIS Docker container |
| **Table & Telemetry Summary** | `npm run db:inspect` | Formats all routes, shipments, vehicles, and GPS pings in terminal tables |
| **Initialize & Seed DB** | `npm run db:init` | Executes base schema (`000_master_schema.sql`), DDD evolution (`001_master_schema.sql`), and seed data |
| **Run Test Suite** | `npm test` | Runs all 9 test suites including the 28-point PostgreSQL/PostGIS operations suite |
| **Run Operations Tests** | `node tests/databaseOperations.test.js` | Direct execution of the 28-point PostgreSQL + PostGIS operations test suite |

---

## 2. Using `psql` in Terminal

### Direct Interactive Shell
```bash
docker exec -it transitly-postgis psql -U postgres -d transitly_telemetry
```

### Useful `psql` Meta-Commands
```text
\l            -- List all databases
\dt           -- List all 23 base tables in the current database
\dT+          -- List domain enum types (user_role, shipment_status, leg_type_enum, etc.)
\d <table_name> -- Describe table schema, columns, constraints, and indexes
\dx           -- List installed extensions (verifies 'postgis', 'pgcrypto', 'uuid-ossp')
\timing on    -- Display execution time for all queries
\q            -- Exit psql shell
```

### Running Inspection Queries via `psql`
Execute the bundled SQL script directly:
```bash
docker exec -i transitly-postgis psql -U postgres -d transitly_telemetry < src/db/queries/inspection_queries.sql
```

---

## 3. Working with PostgreSQL in the IDE (Extension)

### Supported Extensions
- **PostgreSQL** (`ckolkman.vscode-postgres`)
- **SQLTools + PostgreSQL Driver** (`mtxr.sqltools`, `mtxr.sqltools-driver-pg`)

### Connection Settings (Pre-configured in `.vscode/settings.json`)
- **Host:** `localhost`
- **Port:** `5433` *(Mapped Docker container port)*
- **Database:** `transitly_telemetry`
- **Username:** `postgres`
- **Password:** `postgrespassword`
- **Connection URI:** `postgresql://postgres:postgrespassword@localhost:5433/transitly_telemetry`

### Executing Queries in the Editor
1. Open any SQL file (e.g. [`src/db/queries/inspection_queries.sql`](file:///Users/anmol/Documents/Projects/transitly/src/db/queries/inspection_queries.sql) or [`src/db/migrations/001_master_schema.sql`](file:///Users/anmol/Documents/Projects/transitly/src/db/migrations/001_master_schema.sql)).
2. Highlight any query or place your cursor inside a statement.
3. Press `Ctrl + E` (or `Cmd + E` on macOS) or `Ctrl + Enter` to run the selected SQL and view the result grid directly in the editor tab.

---

## 4. Querying PostGIS Spatial Data in Terminal

You can query spatial features and geometry objects using standard PostGIS functions like `ST_AsText()`, `ST_Distance()`, `ST_DWithin()`, and `ST_AsGeoJSON()`:

```sql
-- 1. View ISBT Terminals with coordinates and geofence radius
SELECT 
    terminal_code,
    name,
    city,
    geofence_radius_meters,
    ST_AsText(location) AS location_wkt,
    ST_AsGeoJSON(location) AS location_geojson
FROM terminals;

-- 2. View bus stops with WKT coordinates
SELECT 
    stop_name, 
    latitude, 
    longitude, 
    ST_AsText(geom) AS geom_wkt 
FROM route_stops 
ORDER BY sequence_order;

-- 3. Proximity check (terminals within 10km of user point)
SELECT 
    t.name, 
    t.city,
    ST_Distance(
        t.location::geography, 
        ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326)::geography
    ) / 1000.0 AS distance_km
FROM terminals t;
```
