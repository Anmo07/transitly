# Graph-It-Live — Transitly Codebase Visualizer Guide

**Graph-It-Live** allows you to visualize and explore live dependency graphs, call hierarchies, cross-file imports, and symbol relationships in real-time within Antigravity / VS Code.

---

## ⚙️ Configuration Setup

Workspace settings have been configured in [`.vscode/settings.json`](file:///Users/anmol/Documents/Projects/transitly/.vscode/settings.json):
- **MCP Server:** `true` (enables AI agents to query the codebase dependency graph)
- **Unused Dependency Mode:** `dim` (dims unused exports/imports for cleaner graphs)
- **Performance Profile:** `default` (optimized indexing & caching)

---

## 🗺️ Key Entry Points to Graph

To explore Transitly's full-stack architecture, open the Graph-It-Live panel on any of the following key entry points:

### 1. Backend Core & Orchestration
- [`src/server.js`](file:///Users/anmol/Documents/Projects/transitly/src/server.js) — Express 5 server, middleware pipeline, and route mounts.
- [`run.js`](file:///Users/anmol/Documents/Projects/transitly/run.js) — Master startup daemon coordinating Redis, PostgreSQL, and Express.

### 2. Domain Services & Business Logic
- [`src/services/pricingService.js`](file:///Users/anmol/Documents/Projects/transitly/src/services/pricingService.js) — Dynamic intercity route pricing calculation engine.
- [`src/services/lastMileOrchestrator.js`](file:///Users/anmol/Documents/Projects/transitly/src/services/lastMileOrchestrator.js) — Last-mile delivery dispatch & provider adapters (Uber Direct, Rapido, Porter).
- [`src/services/telemetryConsumer.js`](file:///Users/anmol/Documents/Projects/transitly/src/services/telemetryConsumer.js) — Fast-path Redis stream to PostGIS durable batch persistence.

### 3. Frontend Client Controllers
- [`public/js/payment-methods.js`](file:///Users/anmol/Documents/Projects/transitly/public/js/payment-methods.js) — Cards & UPI management UI controller.
- [`public/js/booking-flow.js`](file:///Users/anmol/Documents/Projects/transitly/public/js/booking-flow.js) — Multimodal shipment booking wizard.
- [`public/js/map.js`](file:///Users/anmol/Documents/Projects/transitly/public/js/map.js) — Leaflet GPS telemetry & bus tracking live visualizer.

### 4. Database & Models
- [`src/db/initDb.js`](file:///Users/anmol/Documents/Projects/transitly/src/db/initDb.js) — PostgreSQL + PostGIS schema migration & initial seed script.
- [`src/config/postgres.js`](file:///Users/anmol/Documents/Projects/transitly/src/config/postgres.js) — Connection pool & geometry query helpers.

---

## 🔍 How to Use in Antigravity

1. Open any file (e.g. [`src/server.js`](file:///Users/anmol/Documents/Projects/transitly/src/server.js)).
2. Click the **Graph-It-Live** icon in the editor toolbar or status bar (or run `Cmd+Shift+P` ➔ `Graph-It-Live: Show Graph`).
3. **Graph Controls:**
   - **Click node:** Jump directly to file/symbol definition.
   - **Right-click node:** Focus subtree or view upstream/downstream callers.
   - **Double-click:** Expand/collapse child modules.
