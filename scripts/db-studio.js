require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.DB_STUDIO_PORT || 5050;

app.use(express.json());

// Support both Local and Cloud Neon connections
const localConnectionString = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres@localhost:5432/transitly_telemetry';
const cloudConnectionString = process.env.DATABASE_URL;

let activeTarget = process.env.DATABASE_URL ? 'cloud' : 'local';

const getPool = (target = activeTarget) => {
  if (target === 'cloud' && cloudConnectionString) {
    return new Pool({
      connectionString: cloudConnectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return new Pool({
    connectionString: localConnectionString,
    ssl: false
  });
};

// 1. API: Get active connection status
app.get('/api/status', async (req, res) => {
  const pool = getPool();
  try {
    const info = await pool.query('SELECT current_database() as db, current_user as user, version() as version, PostGIS_Version() as postgis');
    return res.json({
      target: activeTarget,
      healthy: true,
      database: info.rows[0].db,
      user: info.rows[0].user,
      postgis: info.rows[0].postgis,
      localAvailable: true,
      cloudAvailable: Boolean(cloudConnectionString)
    });
  } catch (err) {
    return res.json({
      target: activeTarget,
      healthy: false,
      error: err.message,
      localAvailable: true,
      cloudAvailable: Boolean(cloudConnectionString)
    });
  } finally {
    await pool.end();
  }
});

// 2. API: Switch Target (local vs cloud)
app.post('/api/switch-target', (req, res) => {
  const { target } = req.body;
  if (target === 'cloud' && !cloudConnectionString) {
    return res.status(400).json({ error: 'DATABASE_URL for Neon cloud is not configured in .env' });
  }
  activeTarget = target === 'cloud' ? 'cloud' : 'local';
  res.json({ success: true, target: activeTarget });
});

// 3. API: List all tables & row counts
app.get('/api/tables', async (req, res) => {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT 
        t.table_name,
        COALESCE(s.n_live_tup, 0) as estimated_rows
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public' AND t.table_name != 'spatial_ref_sys'
      ORDER BY t.table_name ASC;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// 4. API: Get Table Data & Schema
app.get('/api/tables/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const limit = parseInt(req.query.limit || '100', 10);
  const pool = getPool();

  try {
    // Columns
    const colsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position ASC;
    `, [tableName]);

    // Detect geometry column
    const geomCol = colsRes.rows.find(c => c.data_type === 'USER-DEFINED' || c.column_name === 'geom' || c.column_name === 'location');

    let selectQuery = `SELECT * FROM "${tableName}" LIMIT ${limit}`;
    if (geomCol) {
      selectQuery = `SELECT *, ST_AsGeoJSON("${geomCol.column_name}")::json as _geojson FROM "${tableName}" LIMIT ${limit}`;
    }

    const dataRes = await pool.query(selectQuery);

    res.json({
      columns: colsRes.rows,
      hasGeometry: Boolean(geomCol),
      geomColumn: geomCol ? geomCol.column_name : null,
      rows: dataRes.rows,
      totalRows: dataRes.rowCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// 5. API: Execute Arbitrary SQL
app.post('/api/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL query string is required.' });
  }

  const pool = getPool();
  try {
    const result = await pool.query(sql);
    res.json({
      command: result.command,
      rowCount: result.rowCount,
      fields: result.fields ? result.fields.map(f => f.name) : [],
      rows: result.rows || []
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// 6. Embedded UI Single Page Application (Tailwind + Leaflet Map)
app.get(['/', '/{*splat}'], (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transitly Database Visualizer & Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    pre, code { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-[#0b0f19] text-slate-100 flex flex-col h-screen overflow-hidden">

  <!-- Header -->
  <header class="bg-[#111827] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
        🐘
      </div>
      <div>
        <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
          Transitly Database Visualizer
          <span class="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" id="statusPill">Connecting...</span>
        </h1>
        <p class="text-xs text-slate-400 font-mono" id="connInfo">Local: localhost:5432/transitly_telemetry</p>
      </div>
    </div>

    <!-- Target Selector -->
    <div class="flex items-center gap-3">
      <div class="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-800 text-xs">
        <button id="targetLocalBtn" onclick="switchTarget('local')" class="px-3 py-1.5 rounded-md font-semibold transition bg-blue-600 text-white">Local (Postgres.app)</button>
        <button id="targetCloudBtn" onclick="switchTarget('cloud')" class="px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-white transition">Cloud (Neon)</button>
      </div>
      <button onclick="openSqlModal()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
        <span>⚡</span> Run SQL Query
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <div class="flex flex-1 overflow-hidden">
    
    <!-- Sidebar: Tables -->
    <aside class="w-72 bg-[#111827]/60 border-r border-slate-800 flex flex-col shrink-0">
      <div class="p-3 border-b border-slate-800">
        <input type="text" id="tableSearch" placeholder="Filter tables..." oninput="filterTables()" class="w-full bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500">
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-1" id="tableList">
        <div class="p-4 text-xs text-slate-500 text-center">Loading tables...</div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
      <!-- Tab Bar -->
      <div class="bg-[#111827] px-6 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <span class="text-sm font-bold text-white font-mono" id="activeTableTitle">Select a table</span>
          <span class="text-xs text-slate-400 font-mono" id="rowCountBadge"></span>
        </div>
        <div class="flex items-center gap-2" id="viewToggleGroup" style="display: none;">
          <button onclick="setViewMode('grid')" id="gridBtn" class="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white">Table View</button>
          <button onclick="setViewMode('map')" id="mapBtn" class="px-2.5 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white">🗺️ PostGIS Map</button>
        </div>
      </div>

      <!-- Data Table View -->
      <div id="gridContainer" class="flex-1 overflow-auto p-4">
        <div class="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
          Select a table from the sidebar to inspect its columns and records.
        </div>
      </div>

      <!-- Map View (Leaflet) -->
      <div id="mapContainer" class="flex-1 relative hidden">
        <div id="map" class="w-full h-full"></div>
      </div>
    </main>
  </div>

  <!-- SQL Modal -->
  <div id="sqlModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-6 z-50">
    <div class="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 class="text-sm font-bold text-white flex items-center gap-2">
          <span>⚡</span> SQL Scratchpad & Query Runner
        </h2>
        <button onclick="closeSqlModal()" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
      </div>
      <div class="p-4 border-b border-slate-800">
        <textarea id="sqlInput" rows="4" class="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500" placeholder="SELECT * FROM route_stops ORDER BY sequence_order ASC;"></textarea>
        <div class="flex justify-between items-center mt-2">
          <div class="flex gap-2">
            <button onclick="setSampleQuery('routes')" class="text-[11px] text-blue-400 hover:underline">Stops & Coords</button>
            <span class="text-slate-600">•</span>
            <button onclick="setSampleQuery('shipments')" class="text-[11px] text-blue-400 hover:underline">Active Shipments</button>
            <span class="text-slate-600">•</span>
            <button onclick="setSampleQuery('users')" class="text-[11px] text-blue-400 hover:underline">Users</button>
          </div>
          <button onclick="executeSql()" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition">Execute (Cmd+Enter)</button>
        </div>
      </div>
      <div id="sqlResults" class="flex-1 overflow-auto p-4 text-xs font-mono bg-[#0b0f19]">
        <div class="text-slate-500 text-center py-6">Run a query above to see raw output</div>
      </div>
    </div>
  </div>

  <script>
    let currentTables = [];
    let currentTableData = null;
    let leafletMap = null;
    let mapMarkers = [];

    async function init() {
      await refreshStatus();
      await loadTables();
    }

    async function refreshStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const pill = document.getElementById('statusPill');
        const info = document.getElementById('connInfo');

        if (data.healthy) {
          pill.textContent = data.target.toUpperCase() + ' ONLINE';
          pill.className = 'text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          info.textContent = \`Database: \${data.database} | PostGIS: \${data.postgis || 'Not loaded'}\`;
        } else {
          pill.textContent = 'ERROR';
          pill.className = 'text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20';
          info.textContent = data.error;
        }

        document.getElementById('targetLocalBtn').className = data.target === 'local' 
          ? 'px-3 py-1.5 rounded-md font-semibold transition bg-blue-600 text-white' 
          : 'px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-white transition';
        document.getElementById('targetCloudBtn').className = data.target === 'cloud' 
          ? 'px-3 py-1.5 rounded-md font-semibold transition bg-blue-600 text-white' 
          : 'px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-white transition';

      } catch (e) {
        console.error(e);
      }
    }

    async function switchTarget(target) {
      await fetch('/api/switch-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      await refreshStatus();
      await loadTables();
      if (currentTableData) {
        loadTable(currentTableData.tableName);
      }
    }

    async function loadTables() {
      const res = await fetch('/api/tables');
      currentTables = await res.json();
      renderTableList(currentTables);
      if (currentTables.length > 0 && !currentTableData) {
        loadTable(currentTables[0].table_name);
      }
    }

    function renderTableList(tables) {
      const list = document.getElementById('tableList');
      if (tables.length === 0) {
        list.innerHTML = '<div class="p-4 text-xs text-slate-500 text-center">No tables found</div>';
        return;
      }
      list.innerHTML = tables.map(t => \`
        <button onclick="loadTable('\${t.table_name}')" class="w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition hover:bg-slate-800/80 group">
          <span class="text-slate-300 group-hover:text-white truncate font-medium">\${t.table_name}</span>
          <span class="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono shrink-0">\${t.estimated_rows}</span>
        </button>
      \`).join('');
    }

    function filterTables() {
      const q = document.getElementById('tableSearch').value.toLowerCase();
      const filtered = currentTables.filter(t => t.table_name.toLowerCase().includes(q));
      renderTableList(filtered);
    }

    async function loadTable(tableName) {
      document.getElementById('activeTableTitle').textContent = tableName;
      document.getElementById('rowCountBadge').textContent = 'Loading...';
      
      const res = await fetch('/api/tables/' + tableName);
      const data = await res.json();
      currentTableData = { tableName, ...data };

      document.getElementById('rowCountBadge').textContent = \`\${data.rows.length} rows loaded\`;
      document.getElementById('viewToggleGroup').style.display = data.hasGeometry ? 'flex' : 'none';

      renderGridView(data);
      if (data.hasGeometry) {
        renderMapView(data);
      }
      setViewMode('grid');
    }

    function renderGridView(data) {
      const container = document.getElementById('gridContainer');
      if (!data.rows || data.rows.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-xs text-slate-500 font-mono">No records present in table.</div>';
        return;
      }

      const cols = data.columns.map(c => c.column_name);

      let html = '<div class="overflow-x-auto rounded-xl border border-slate-800"><table class="w-full text-left text-xs font-mono divide-y divide-slate-800">';
      html += '<thead class="bg-[#111827] sticky top-0 text-slate-400 font-semibold uppercase text-[10px] tracking-wider"><tr>';
      cols.forEach(c => {
        html += \`<th class="px-4 py-3 whitespace-nowrap">\${c}</th>\`;
      });
      html += '</tr></thead>';

      html += '<tbody class="divide-y divide-slate-800/60 bg-[#0e1424]">';
      data.rows.forEach(r => {
        html += '<tr class="hover:bg-slate-800/40 transition">';
        cols.forEach(c => {
          let val = r[c];
          if (val === null || val === undefined) {
            html += '<td class="px-4 py-2.5 text-slate-600 italic">null</td>';
          } else if (typeof val === 'object') {
            html += \`<td class="px-4 py-2.5 text-blue-400 max-w-xs truncate" title='\${JSON.stringify(val)}'>\${JSON.stringify(val)}</td>\`;
          } else {
            html += \`<td class="px-4 py-2.5 text-slate-200 whitespace-nowrap">\${val}</td>\`;
          }
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';

      container.innerHTML = html;
    }

    function renderMapView(data) {
      if (!leafletMap) {
        leafletMap = L.map('map').setView([28.6675, 77.2285], 8);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(leafletMap);
      }

      mapMarkers.forEach(m => leafletMap.removeLayer(m));
      mapMarkers = [];

      const bounds = [];
      data.rows.forEach(r => {
        let lat = r.latitude;
        let lng = r.longitude;

        if (r._geojson && r._geojson.coordinates) {
          lng = r._geojson.coordinates[0];
          lat = r._geojson.coordinates[1];
        }

        if (lat && lng) {
          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.9,
            weight: 2
          }).addTo(leafletMap);

          let popup = \`<b>\${r.stop_name || r.label || r.registration || data.tableName}</b><br>\`;
          Object.keys(r).slice(0, 5).forEach(k => {
            if (k !== '_geojson') popup += \`\${k}: \${r[k]}<br>\`;
          });
          marker.bindPopup(popup);
          mapMarkers.push(marker);
          bounds.push([lat, lng]);
        }
      });

      if (bounds.length > 0) {
        leafletMap.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    function setViewMode(mode) {
      if (mode === 'grid') {
        document.getElementById('gridContainer').classList.remove('hidden');
        document.getElementById('mapContainer').classList.add('hidden');
        document.getElementById('gridBtn').className = 'px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white';
        document.getElementById('mapBtn').className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white';
      } else {
        document.getElementById('gridContainer').classList.add('hidden');
        document.getElementById('mapContainer').classList.remove('hidden');
        document.getElementById('mapBtn').className = 'px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white';
        document.getElementById('gridBtn').className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white';
        if (leafletMap) {
          setTimeout(() => leafletMap.invalidateSize(), 150);
        }
      }
    }

    function openSqlModal() {
      document.getElementById('sqlModal').classList.remove('hidden');
      document.getElementById('sqlInput').focus();
    }
    function closeSqlModal() {
      document.getElementById('sqlModal').classList.add('hidden');
    }

    function setSampleQuery(type) {
      const map = {
        routes: 'SELECT r.logical_route_id, s.sequence_order, s.stop_name, s.latitude, s.longitude FROM route_transactions r JOIN route_stops s ON r.id = s.route_transaction_id ORDER BY s.sequence_order ASC LIMIT 20;',
        shipments: 'SELECT tracking_id, status, sender_name, recipient_name, created_at FROM shipments ORDER BY id DESC LIMIT 10;',
        users: 'SELECT id, name, email, phone, role, created_at FROM users ORDER BY id ASC LIMIT 10;'
      };
      document.getElementById('sqlInput').value = map[type];
    }

    async function executeSql() {
      const sql = document.getElementById('sqlInput').value.trim();
      const resContainer = document.getElementById('sqlResults');
      resContainer.innerHTML = '<div class="text-blue-400 py-4">Executing query...</div>';

      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await res.json();

        if (data.error) {
          resContainer.innerHTML = \`<div class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">Error: \${data.error}</div>\`;
          return;
        }

        if (!data.rows || data.rows.length === 0) {
          resContainer.innerHTML = \`<div class="text-slate-400">Query executed successfully (\${data.command}). 0 rows affected.</div>\`;
          return;
        }

        let html = \`<div class="text-slate-400 mb-2 font-mono">Found \${data.rows.length} row(s)</div>\`;
        html += '<div class="overflow-x-auto border border-slate-800 rounded-lg"><table class="w-full text-left divide-y divide-slate-800">';
        html += '<thead class="bg-[#111827] text-slate-400 font-bold"><tr>';
        data.fields.forEach(f => {
          html += \`<th class="px-3 py-2">\${f}</th>\`;
        });
        html += '</tr></thead><tbody class="divide-y divide-slate-800/60">';
        data.rows.forEach(r => {
          html += '<tr class="hover:bg-slate-800/40">';
          data.fields.forEach(f => {
            let val = r[f];
            if (val === null) html += '<td class="px-3 py-1.5 text-slate-600 italic">null</td>';
            else if (typeof val === 'object') html += \`<td class="px-3 py-1.5 text-blue-400 max-w-xs truncate">\${JSON.stringify(val)}</td>\`;
            else html += \`<td class="px-3 py-1.5 text-slate-200">\${val}</td>\`;
          });
          html += '</tr>';
        });
        html += '</tbody></table></div>';

        resContainer.innerHTML = html;
      } catch (e) {
        resContainer.innerHTML = \`<div class="p-3 bg-red-500/10 text-red-400 rounded-lg">Network Error: \${e.message}</div>\`;
      }
    }

    init();
  </script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Transitly Database Visualizer & Studio is running!`);
  console.log(`📍 Local Visualizer URL: http://localhost:${PORT}`);
  console.log(`🐘 Connected to Local:   ${localConnectionString}`);
  if (cloudConnectionString) {
    console.log(`☁️  Connected to Cloud:   ${cloudConnectionString.split('@')[1]}`);
  }
  console.log(`======================================================\n`);
});
