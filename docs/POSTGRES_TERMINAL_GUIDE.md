# Transitly — PostgreSQL & PostGIS Terminal & Extension Guide

This guide establishes the direct, fast, terminal-first and IDE extension workflow for developing and inspecting the Transitly Master Database (PostgreSQL 16 + PostGIS).

---

## 1. Quick Terminal Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Interactive `psql` shell** | `npm run db:psql` | Opens an interactive `psql` console inside the PostGIS Docker container |
| **Table & Telemetry Summary** | `npm run db:inspect` | Formats all routes, shipments, vehicles, and GPS pings in terminal tables |
| **Initialize & Seed DB** | `npm run db:init` | Executes schema migrations and Haryana Roadways seed data |
| **Run Test Suite** | `npm test` | Verifies schemas, spatial constraints, and business logic |

---

## 2. Using `psql` in Terminal

### Direct Interactive Shell
```bash
docker exec -it transitly-postgis psql -U postgres -d transitly_telemetry
```

### Useful `psql` Meta-Commands
```text
\l            -- List all databases
\dt           -- List all tables in the current database
\d <table_name> -- Describe table schema, columns, and indexes
\dx           -- List installed extensions (verifies 'postgis' and 'pgcrypto')
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
1. Open any SQL file (e.g. [`src/db/queries/inspection_queries.sql`](file:///Users/anmol/Documents/Projects/transitly/src/db/queries/inspection_queries.sql) or [`src/db/migrations/000_master_schema.sql`](file:///Users/anmol/Documents/Projects/transitly/src/db/migrations/000_master_schema.sql)).
2. Highlight any query or place your cursor inside a statement.
3. Press `Ctrl + E` (or `Cmd + E` on macOS) or `Ctrl + Enter` to run the selected SQL and view the result grid directly in the editor tab.

---

## 4. Querying PostGIS Spatial Data in Terminal

You can query spatial features and geometry objects using standard PostGIS functions like `ST_AsText()`, `ST_Distance()`, and `ST_DWithin()`:

```sql
-- View bus stops with WKT coordinates
SELECT 
    stop_name, 
    latitude, 
    longitude, 
    ST_AsText(geom) AS geom_wkt 
FROM route_stops 
ORDER BY sequence_order;

-- Proximity check (vehicles within 5km of ISBT Kashmiri Gate)
SELECT 
    v.registration, 
    v.status,
    ST_Distance(
        v.geom::geography, 
        ST_SetSRID(ST_MakePoint(77.2285, 28.6675), 4326)::geography
    ) / 1000.0 AS distance_km
FROM vehicles v
WHERE v.geom IS NOT NULL;
```
