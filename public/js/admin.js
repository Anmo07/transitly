/**
 * Transitly - Admin Command Center Controller
 * Real-time fleet monitor, operational KPIs, WebSocket broadcaster & diagnostics.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statActiveParcels = document.getElementById('stat-active-parcels');
  const statFleetUtil = document.getElementById('stat-fleet-util');
  const statSuccessRate = document.getElementById('stat-success-rate');
  const statUnresolvedIncidents = document.getElementById('stat-unresolved-incidents');

  const broadcastTargetSelect = document.getElementById('broadcast-target-select');
  const filterLabel1 = document.getElementById('filter-label-1');
  const filterLabel2 = document.getElementById('filter-label-2');
  const filterInputContainer1 = document.getElementById('filter-input-container-1');
  const filterInputContainer2 = document.getElementById('filter-input-container-2');
  const broadcastMessageInput = document.getElementById('broadcast-message-input');
  const btnSendBroadcast = document.getElementById('btn-send-broadcast');
  const broadcastStatusMsg = document.getElementById('broadcast-status-msg');

  const btnAppBreakdowns = document.getElementById('btn-app-breakdowns');
  const btnSystemHealth = document.getElementById('btn-system-health');
  const btnIncidentReports = document.getElementById('btn-incident-reports');
  const btnUserFeedback = document.getElementById('btn-user-feedback');
  const navBtnAlerts = document.getElementById('nav-btn-alerts');

  // Modal Elements
  const modalContainer = document.getElementById('modal-container');
  const modalHeadingText = document.getElementById('modal-heading-text');
  const modalIcon = document.getElementById('modal-icon');
  const modalBodyContent = document.getElementById('modal-body-content');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalActionClose = document.getElementById('btn-modal-action-close');

  // 1. Dynamic Broadcast Target Filter UI
  const defaultSelect1 = '<select id="filter-select-1" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full"><option>All Statuses</option><option>Delayed</option><option>In-Transit</option><option>Delivered</option></select>';
  const defaultSelect2 = '<select id="filter-select-2" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full"><option>None</option><option>Priority Level</option><option>Region</option><option>Account Type</option></select>';

  broadcastTargetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val.includes('User Details')) {
      filterLabel1.textContent = 'User Name';
      filterInputContainer1.innerHTML = '<input id="filter-input-1" type="text" placeholder="Search user name..." class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
      filterLabel2.textContent = 'Phone Number';
      filterInputContainer2.innerHTML = '<input id="filter-input-2" type="tel" placeholder="+91..." class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
    } else if (val.includes('Parcel Status')) {
      filterLabel1.textContent = 'Parcel Tracking ID';
      filterInputContainer1.innerHTML = '<input id="filter-input-1" type="text" placeholder="TRK-XXXX" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
      filterLabel2.textContent = 'User Attribute';
      filterInputContainer2.innerHTML = defaultSelect2;
    } else {
      filterLabel1.textContent = 'Filter by Status';
      filterInputContainer1.innerHTML = defaultSelect1;
      filterLabel2.textContent = 'User Attribute';
      filterInputContainer2.innerHTML = defaultSelect2;
    }
  });

  // 2. Fetch Live Dashboard Stats
  async function loadDashboardStats() {
    try {
      const res = await fetch('/api/v1/admin/stats');
      if (!res.ok) throw new Error('Network error fetching stats');
      const json = await res.json();
      if (json.data) {
        statActiveParcels.textContent = Number(json.data.activeParcels).toLocaleString();
        statFleetUtil.textContent = json.data.fleetUtil;
        statSuccessRate.textContent = json.data.successRate;
      }
    } catch (err) {
      console.warn('[Admin] Failed to load live stats, using fallback defaults:', err.message);
    }
  }

  // 3. Send Broadcast Handler
  btnSendBroadcast.addEventListener('click', async () => {
    const message = broadcastMessageInput.value.trim();
    if (!message) {
      broadcastStatusMsg.textContent = 'Please enter a message to broadcast.';
      broadcastStatusMsg.className = 'text-xs text-error font-medium';
      return;
    }

    const target = broadcastTargetSelect.value;
    const filterInput1 = document.getElementById('filter-select-1') || document.getElementById('filter-input-1');
    const filterInput2 = document.getElementById('filter-select-2') || document.getElementById('filter-input-2');

    const filterStatus = filterInput1 ? filterInput1.value : 'All';
    const filterAttribute = filterInput2 ? filterInput2.value : 'None';

    btnSendBroadcast.disabled = true;
    btnSendBroadcast.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Broadcasting...';
    broadcastStatusMsg.textContent = '';

    try {
      const res = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, filterStatus, filterAttribute, message })
      });

      const json = await res.json();
      if (res.ok) {
        broadcastStatusMsg.textContent = '✔ Broadcast dispatched to active clients!';
        broadcastStatusMsg.className = 'text-xs text-emerald-600 font-bold';
        broadcastMessageInput.value = '';
        setTimeout(() => { broadcastStatusMsg.textContent = ''; }, 4000);
      } else {
        throw new Error(json.message || 'Failed to dispatch');
      }
    } catch (err) {
      broadcastStatusMsg.textContent = `⚠ ${err.message}`;
      broadcastStatusMsg.className = 'text-xs text-error font-medium';
    } finally {
      btnSendBroadcast.disabled = false;
      btnSendBroadcast.innerHTML = '<span class="material-symbols-outlined text-sm">send</span> Send Broadcast';
    }
  });

  // 4. Modal Handlers & Operations
  function showModal(title, iconName, htmlContent) {
    modalHeadingText.textContent = title;
    modalIcon.textContent = iconName;
    modalBodyContent.innerHTML = htmlContent;
    modalContainer.classList.remove('hidden');
  }

  function hideModal() {
    modalContainer.classList.add('hidden');
  }

  btnCloseModal.addEventListener('click', hideModal);
  btnModalActionClose.addEventListener('click', hideModal);
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) hideModal();
  });

  // App Breakdowns Modal
  btnAppBreakdowns.addEventListener('click', () => {
    showModal('App Breakdowns & Diagnostics', 'bug_report', `
      <div class="space-y-3">
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-error bg-error-container/40 px-2 py-0.5 rounded">CRITICAL</span>
              <span class="font-bold text-on-surface">Client Telemetry Dropped</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Bus #118 intermittent 4G GPS ping latency in Karnal tunnel sector.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">12m ago</span>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">WARNING</span>
              <span class="font-bold text-on-surface">Last-Mile Quote Fallback</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Rapido API rate-limit triggered for Sector 17 dispatch; routed to inDrive fallback.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">42m ago</span>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">RESOLVED</span>
              <span class="font-bold text-on-surface">Redis Stream Buffer Flushed</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Consumer group cg:telemetry:durable committed 200 telemetry pings to PostGIS.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">1h ago</span>
        </div>
      </div>
    `);
  });

  // System Health Modal
  btnSystemHealth.addEventListener('click', async () => {
    showModal('System Health & Infrastructure', 'monitor_heart', `
      <div class="flex justify-center p-6"><span class="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
    `);

    try {
      const res = await fetch('/api/v1/admin/health');
      const json = await res.json();
      const h = json.data || {};

      showModal('System Health & Infrastructure', 'monitor_heart', `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-container-low rounded-xl">
              <span class="text-xs text-on-surface-variant">PostgreSQL + PostGIS</span>
              <p class="font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy (Port 5433)
              </p>
              <span class="text-[11px] text-on-surface-variant">${h.postgres?.postgisVersion || 'PostGIS 3.4 Enabled'}</span>
            </div>
            <div class="p-3 bg-surface-container-low rounded-xl">
              <span class="text-xs text-on-surface-variant">Redis Stream & Pub/Sub</span>
              <p class="font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active (Port 6379)
              </p>
              <span class="text-[11px] text-on-surface-variant">In-Memory Telemetry</span>
            </div>
          </div>
          <div class="p-3 bg-surface-container-low rounded-xl space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">Node.js Memory (Heap)</span>
              <span class="font-bold">${h.memory?.heapUsed || '42.8 MB'} / ${h.memory?.heapTotal || '64.0 MB'}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">Server Uptime</span>
              <span class="font-bold">${Math.floor((h.server?.uptimeSeconds || 120) / 60)} minutes</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">WebSockets Live Engine</span>
              <span class="font-bold text-primary">Connected</span>
            </div>
          </div>
        </div>
      `);
    } catch (err) {
      showModal('System Health & Infrastructure', 'monitor_heart', `
        <p class="text-xs text-error">Failed to query live health metrics: ${err.message}</p>
      `);
    }
  });

  // Incident Reports Modal
  btnIncidentReports.addEventListener('click', async () => {
    showModal('Incident Reports & Tickets', 'report', `
      <div class="flex justify-center p-6"><span class="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
    `);

    try {
      const res = await fetch('/api/v1/admin/incidents');
      const json = await res.json();
      const tickets = json.data || [];

      let listHtml = '';
      if (tickets.length === 0) {
        listHtml = '<p class="text-xs text-on-surface-variant text-center py-4">No open incident reports at this time.</p>';
      } else {
        listHtml = tickets.map(t => `
          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1">
            <div class="flex justify-between items-center">
              <span class="font-bold text-primary text-xs">${t.tracking_id || 'TICKET-#' + t.id}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${t.status === 'OPEN' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'}">${t.status}</span>
            </div>
            <p class="text-xs text-on-surface">${t.description}</p>
            <span class="text-[10px] text-on-surface-variant">${t.category} • ${new Date(t.created_at).toLocaleTimeString()}</span>
          </div>
        `).join('');
      }

      showModal('Incident Reports & Tickets', 'report', `
        <div class="space-y-3">${listHtml}</div>
      `);
    } catch (err) {
      showModal('Incident Reports & Tickets', 'report', `
        <p class="text-xs text-error">Failed to load incidents: ${err.message}</p>
      `);
    }
  });

  // User Feedback Modal
  btnUserFeedback.addEventListener('click', () => {
    showModal('User Feedback & Quality Surveys', 'thumbs_up_down', `
      <div class="space-y-3">
        <div class="p-3 bg-surface-container-low rounded-xl">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-xs">Aarav Sharma</span>
            <div class="flex text-amber-500 text-xs">★★★★★</div>
          </div>
          <p class="text-xs text-on-surface">"Haryana Roadways parcel delivery was super fast! Received package at Chandigarh ISBT within 4 hours."</p>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-xs">Pooja Patel</span>
            <div class="flex text-amber-500 text-xs">★★★★☆</div>
          </div>
          <p class="text-xs text-on-surface">"Door-to-door last-mile courier picked it up right on time from my shop. Very smooth experience."</p>
        </div>
      </div>
    `);
  });

  // Alerts Navigation Tab
  navBtnAlerts.addEventListener('click', () => {
    btnIncidentReports.click();
  });

  // 5. Socket.io Real-time Event Listener for Broadcasts & GPS Telemetry
  try {
    if (typeof io !== 'undefined') {
      const socket = io();
      socket.on('broadcast_alert', (payload) => {
        console.log('[Admin Live Broadcast Received]', payload);
      });
    }
  } catch (err) {
    console.warn('[Admin Socket]', err.message);
  }

  // Initial Load
  loadDashboardStats();
});
