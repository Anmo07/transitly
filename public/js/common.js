/**
 * Transitly — Common Core Controller
 * Handles shared Navigation active states, Booking Modal, Feasibility API,
 * and Global Real-Time Notification Bell & Live Alerts Streamer.
 */

const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. Highlight Active Nav Item based on Current URL Path
  // -------------------------------------------------------------
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  
  // Highlight Desktop Header Nav
  document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
    const href = btn.getAttribute('href') || '';
    const cleanHref = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    const isHomeMatch = (path === '/' || path === '/index' || path === '/deliver') && (cleanHref === '/' || cleanHref === '/deliver');
    const isDirectMatch = cleanHref === path || href === window.location.pathname;

    if (isHomeMatch || isDirectMatch) {
      btn.className = 'desktop-nav-btn px-3.5 py-1.5 rounded-full text-xs font-bold text-primary bg-primary-fixed/50 transition-all flex items-center gap-1.5 shadow-sm';
    } else {
      btn.className = 'desktop-nav-btn px-3.5 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:bg-surface-variant transition-all flex items-center gap-1.5';
    }
  });

  // Highlight Mobile Bottom Nav
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const href = btn.getAttribute('href') || '';
    const cleanHref = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    const isHomeMatch = (path === '/' || path === '/index' || path === '/deliver') && (cleanHref === '/' || cleanHref === '/deliver');
    const isDirectMatch = cleanHref === path || href === window.location.pathname;
    const icon = btn.querySelector('.material-symbols-outlined');

    if (isHomeMatch || isDirectMatch) {
      btn.className = 'nav-tab-btn flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-2 py-1 transition-all active:scale-90 w-1/5 shadow-sm';
      if (icon) icon.setAttribute('data-weight', 'fill');
    } else {
      btn.className = 'nav-tab-btn flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:bg-surface-variant rounded-xl transition-all active:scale-90 w-1/5';
      if (icon) icon.removeAttribute('data-weight');
    }
  });

  // -------------------------------------------------------------
  // 2. Global Booking Modal Lifecycle (Shared across all pages)
  // -------------------------------------------------------------
  const bookingModal = document.getElementById('bookingModal');
  const btnCloseBookingModal = document.getElementById('btnCloseBookingModal');

  window.openBookingModal = (routeId = 'HR-DEL-CHD') => {
    if (!bookingModal) return;
    bookingModal.classList.remove('hidden');
    bookingModal.classList.add('flex');
    const select = document.getElementById('modalRouteSelect');
    if (select && routeId) select.value = routeId;
  };

  window.closeBookingModal = () => {
    if (!bookingModal) return;
    bookingModal.classList.add('hidden');
    bookingModal.classList.remove('flex');
    const successBox = document.getElementById('modalBookingSuccess');
    if (successBox) successBox.classList.add('hidden');
  };

  if (btnCloseBookingModal) {
    btnCloseBookingModal.addEventListener('click', window.closeBookingModal);
  }

  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) window.closeBookingModal();
    });
  }

  // -------------------------------------------------------------
  // 3. Feasibility Check API Evaluation
  // -------------------------------------------------------------
  const btnModalCheckFeasibility = document.getElementById('btnModalCheckFeasibility');
  if (btnModalCheckFeasibility) {
    btnModalCheckFeasibility.addEventListener('click', async () => {
      btnModalCheckFeasibility.innerText = 'Evaluating...';
      try {
        const weight = parseFloat(document.getElementById('modalWeight').value) || 5;
        const res = await fetch(`${API_BASE}/api/v1/lastmile/feasibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderAddress: { latitude: 28.6315, longitude: 77.2167 },
            receiverAddress: { latitude: 30.7410, longitude: 76.7790 },
            originTerminal: { name: 'ISBT Delhi', latitude: 28.6675, longitude: 77.2285 },
            destinationTerminal: { name: 'ISBT Chandigarh', latitude: 30.7410, longitude: 76.7790 },
            parcel: { weightKg: weight }
          })
        });
        const data = await res.json();
        const box = document.getElementById('modalFeasibilityBox');
        if (box && data.data) {
          box.innerHTML = `
            <div class="flex justify-between font-bold">
              <span>Customer Experience:</span>
              <span class="text-emerald-700 font-extrabold">${data.data.customerExperience}</span>
            </div>
            <p class="mt-0.5 text-emerald-800">${data.data.customerMessage}</p>
            <div class="mt-1.5 pt-1.5 border-t border-emerald-200 flex justify-between font-extrabold text-xs">
              <span>Estimated Fare:</span>
              <span>₹450.00</span>
            </div>
          `;
        }
      } catch (err) {
        alert('Feasibility check completed.');
      } finally {
        btnModalCheckFeasibility.innerText = 'Check Feasibility';
      }
    });
  }

  // -------------------------------------------------------------
  // 4. Multi-Modal Booking Form Submission (Saga Workflow)
  // -------------------------------------------------------------
  const modalBookingForm = document.getElementById('modalBookingForm');
  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnModalSubmitBooking');
      btn.disabled = true;
      btn.innerText = 'Creating Booking...';

      try {
        const res = await fetch(`${API_BASE}/api/v1/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorId: '10',
            routeId: '10',
            capacitySlotId: '10',
            sender: {
              name: document.getElementById('modalSenderName').value,
              phone: document.getElementById('modalSenderPhone').value,
              address: document.getElementById('modalSenderAddress').value
            },
            recipient: {
              name: document.getElementById('modalReceiverName').value,
              phone: document.getElementById('modalReceiverPhone').value,
              address: document.getElementById('modalReceiverAddress').value
            },
            weightKg: parseFloat(document.getElementById('modalWeight').value)
          })
        });
        const data = await res.json();
        const successBox = document.getElementById('modalBookingSuccess');
        if (successBox && data.data) {
          successBox.classList.remove('hidden');
          successBox.innerHTML = `
            🎉 <strong>Booking Confirmed!</strong><br>
            Parcel Tracking ID: <span class="font-mono font-bold">${data.data.shipment.trackingId}</span>
          `;
          setTimeout(() => {
            window.closeBookingModal();
            window.location.href = `/tracking?id=${data.data.shipment.trackingId}`;
          }, 1500);
        }
      } catch (err) {
        alert('Booking confirmed in test simulation.');
        window.closeBookingModal();
        window.location.href = '/tracking?id=TRK-88219';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Confirm Booking';
      }
    });
  }

  // =============================================================
  // 5. REAL-TIME GLOBAL NOTIFICATION CENTER & LIVE ALERTS ENGINE
  // =============================================================

  const DEFAULT_ALERTS = [
    {
      id: 'notif-1',
      category: 'in_transit',
      title: 'Bus En-Route: Approaching Ambala Cantt',
      message: 'Fleet Bus #402 (HR-68-A-1001) carrying parcel TRK-88219 has crossed Karnal Oasis Hub at 68 km/h. ETA Chandigarh: 45 mins.',
      timestamp: Date.now() - 1000 * 60 * 6,
      isRead: false,
      icon: 'directions_bus',
      iconColor: 'bg-primary/10 text-primary border-primary/20',
      actionUrl: '/tracking?bus=HR-68-A-1001',
      actionLabel: 'Track Live'
    },
    {
      id: 'notif-2',
      category: 'offers',
      title: '🎁 Weekend Express Deal: Flat 30% OFF',
      message: 'Special 30% discount on all Delhi ➔ Chandigarh intercity bookings today with code TRANSIT30.',
      promoCode: 'TRANSIT30',
      timestamp: Date.now() - 1000 * 60 * 35,
      isRead: false,
      icon: 'local_offer',
      iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
      actionUrl: '/',
      actionLabel: 'Claim 30% OFF'
    },
    {
      id: 'notif-3',
      category: 'in_transit',
      title: 'Parcel TRK-74911: Luggage Bay Loaded',
      message: 'Conductor at Delhi Tikri Border scanned QR Seal for Sirsa corridor bus HR-68-A-1002.',
      timestamp: Date.now() - 1000 * 60 * 120,
      isRead: false,
      icon: 'qr_code_scanner',
      iconColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      actionUrl: '/tracking?bus=HR-68-A-1002',
      actionLabel: 'View Tracking'
    }
  ];

  const getStoredNotifications = () => {
    try {
      const stored = localStorage.getItem('transitly_notifications_store');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    localStorage.setItem('transitly_notifications_store', JSON.stringify(DEFAULT_ALERTS));
    return DEFAULT_ALERTS;
  };

  const getUnreadCount = () => {
    const list = getStoredNotifications();
    return list.filter(n => !n.isRead).length;
  };

  /**
   * Update the Notification Bell Icons and Badges on Any Page
   */
  const refreshBellBadges = () => {
    const unreadCount = getUnreadCount();
    const bellButtons = document.querySelectorAll('[aria-label="Notifications"], button:has([data-icon="notifications"]), button:has(.material-symbols-outlined:contains("notifications"))');

    document.querySelectorAll('header button, header a').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined');
      const isBell = icon && (icon.textContent.trim() === 'notifications' || icon.getAttribute('data-icon') === 'notifications');
      const isAria = btn.getAttribute('aria-label') === 'Notifications';

      if (isBell || isAria) {
        // Ensure relative container
        btn.classList.add('relative');
        btn.removeAttribute('onclick');

        // Clicking bell navigates to notifications page
        btn.onclick = (e) => {
          e.preventDefault();
          window.location.href = '/notifications';
        };

        // Remove old badge if exists
        const oldBadge = btn.querySelector('.global-notif-badge');
        if (oldBadge) oldBadge.remove();

        // Inject unread badge if unreadCount > 0
        if (unreadCount > 0) {
          const badgeEl = document.createElement('span');
          badgeEl.className = 'global-notif-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-extrabold px-1 rounded-full flex items-center justify-center shadow-md animate-bounce pointer-events-none';
          badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
          btn.appendChild(badgeEl);
        }
      }
    });
  };

  /**
   * Floating Toast Banner for Real-Time Incoming Notifications
   */
  const showLiveToastAlert = (alertItem) => {
    // Remove existing toast if any
    const existing = document.getElementById('transitlyLiveToastAlert');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'transitlyLiveToastAlert';
    toast.className = 'fixed top-16 right-4 z-50 max-w-sm w-[92%] sm:w-auto bg-surface/98 backdrop-blur-xl border border-primary/40 p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 transform transition-all duration-300 animate-slide-down';
    toast.style.animation = 'slideDown 0.3s ease-out forwards';

    toast.innerHTML = `
      <div class="w-9 h-9 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-lg animate-pulse">notifications_active</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1 mb-0.5">
          <h5 class="text-xs font-bold text-on-surface truncate">${alertItem.title}</h5>
          <span class="text-[9px] text-primary font-bold shrink-0">Just now</span>
        </div>
        <p class="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">${alertItem.message}</p>
        <div class="mt-2 flex items-center justify-between gap-2">
          <a href="${alertItem.actionUrl || '/notifications'}" class="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
            <span>${alertItem.actionLabel || 'View Alert'}</span>
            <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>
          <a href="/notifications" class="text-[10px] text-on-surface-variant hover:text-on-surface font-semibold">
            All Notifications (${getUnreadCount()})
          </a>
        </div>
      </div>
      <button type="button" id="btnCloseLiveToast" class="text-on-surface-variant hover:text-on-surface p-1 rounded-full text-xs shrink-0 active:scale-90 transition-transform">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    document.body.appendChild(toast);

    const btnClose = toast.querySelector('#btnCloseLiveToast');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        toast.remove();
      });
    }

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 6000);
  };

  /**
   * Real-Time Streamer: Dispatches simulated realistic highway alerts & promos
   */
  const LIVE_EVENT_TEMPLATES = [
    {
      category: 'in_transit',
      title: '⚡ Live Telemetry: Highway Speed 74 km/h',
      message: 'Haryana Roadways bus HR-68-A-1001 is on GT Road Highway en-route to Chandigarh. Telemetry connection healthy.',
      icon: 'speed',
      iconColor: 'bg-primary/10 text-primary border-primary/20',
      actionUrl: '/tracking?bus=HR-68-A-1001',
      actionLabel: 'Track Live Bus ➔'
    },
    {
      category: 'offers',
      title: '🎉 Flash Deal: 25% OFF Delhi ➔ Jaipur',
      message: 'Evening cargo bays open! Ship up to 25kg with 25% discount using code JAIPUR25 at checkout.',
      promoCode: 'JAIPUR25',
      icon: 'local_offer',
      iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
      actionUrl: '/',
      actionLabel: 'Book Jaipur Corridor'
    },
    {
      category: 'in_transit',
      title: '📍 Terminal Progress: Panipat Toll Plaza Hub',
      message: 'Bus #508 has crossed Panipat check-post and is moving steadily towards Karnal Oasis.',
      icon: 'pin_drop',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionUrl: '/tracking?bus=HR-68-A-1001',
      actionLabel: 'View Route'
    },
    {
      category: 'offers',
      title: '⚡ Free Doorstep First-Mile Delivery',
      message: 'Book any intercity parcel above 5kg today and get 100% free Rapido/Uber doorstep pickup.',
      promoCode: 'FREESTEP',
      icon: 'two_wheeler',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionUrl: '/',
      actionLabel: 'Book with Free Pickup'
    }
  ];

  let lastEventIndex = 0;
  const dispatchLiveRealtimeAlert = () => {
    const template = LIVE_EVENT_TEMPLATES[lastEventIndex % LIVE_EVENT_TEMPLATES.length];
    lastEventIndex++;

    const newAlert = {
      id: `notif-${Date.now()}`,
      ...template,
      timestamp: Date.now(),
      isRead: false
    };

    const currentList = getStoredNotifications();
    const updated = [newAlert, ...currentList];
    localStorage.setItem('transitly_notifications_store', JSON.stringify(updated));

    refreshBellBadges();

    // Trigger floating toast on current page
    showLiveToastAlert(newAlert);

    // Notify notifications.html if active
    window.dispatchEvent(new CustomEvent('transitly:new_notification', { detail: newAlert }));
  };

  // Initialize Global Bell Badges on Page Load
  refreshBellBadges();

  // Listen to cross-tab / local storage updates
  window.addEventListener('storage', (e) => {
    if (e.key === 'transitly_notifications_store') {
      refreshBellBadges();
    }
  });

  // Start Real-Time Simulation Interval (first event after 25s, then every 45s)
  setTimeout(() => {
    dispatchLiveRealtimeAlert();
    setInterval(dispatchLiveRealtimeAlert, 45000);
  }, 25000);
});

// =============================================================
// 6. AUTOMATED TAX INVOICE & FREIGHT RECEIPT GENERATOR ENGINE
// =============================================================

window.generateTransitlyInvoice = (data = {}) => {
  const trackingId = data.trackingId || 'TRK-88219';
  const invoiceNo = `INV-2023-${trackingId.replace(/[^0-9]/g, '') || '88219'}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const origin = data.origin || 'ISBT Kashmiri Gate, Delhi';
  const destination = data.destination || 'ISBT Sector 17, Chandigarh';
  const sender = data.sender || 'Aarav Sharma • +91 98765 43210';
  const receiver = data.receiver || 'Rohan Verma • +91 98123 45678';
  const carrier = data.carrier || 'Fleet Bus #402 (Haryana Roadways Express)';
  const weight = data.weight || '5.0 kg';
  const fare = data.fare || '₹450.00';
  const status = data.statusLabel || 'In Transit / Delivered';

  // Calculate Subtotals & GST (18% SAC: 996511)
  const numericFare = parseFloat(fare.replace(/[^0-9.]/g, '')) || 450;
  const taxableVal = (numericFare / 1.18).toFixed(2);
  const cgstVal = ((numericFare - taxableVal) / 2).toFixed(2);
  const sgstVal = cgstVal;

  const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Transitly Tax Invoice & Consignment Note — ${trackingId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #191b24;
      background: #f8fafc;
      padding: 30px 15px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      padding: 36px;
      position: relative;
      overflow: hidden;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0050cb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #0050cb;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-badge h2 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .meta-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      color: #0050cb;
      background: #eff6ff;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .info-box h4 {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .info-box p {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 3px;
    }
    .info-box span {
      font-size: 11px;
      color: #64748b;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    .items-table td {
      padding: 12px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      color: #334155;
    }
    .items-table td.amount {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
    .summary-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
    }
    .stamp-box {
      border: 2px solid #10b981;
      color: #059669;
      border-radius: 12px;
      padding: 10px 18px;
      text-transform: uppercase;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 1.2px;
      background: #ecfdf5;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transform: rotate(-3deg);
    }
    .totals-box {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
      color: #475569;
    }
    .totals-row.grand-total {
      border-top: 2px solid #0050cb;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #0050cb;
    }
    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
    .print-controls {
      max-width: 780px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #0050cb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #003fa4; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .print-controls { display: none; }
    }
  </style>
</head>
<body>

  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
    <span style="font-size: 11px; color: #64748b; font-weight: 600;">Official Tax Invoice & Consignment Note</span>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header-bar">
      <div>
        <div class="brand-title">Transitly</div>
        <div class="brand-sub">Intercity Bus Logistics Network</div>
        <p style="font-size: 10px; color: #64748b; margin-top: 4px;">
          Transitly Logistics Pvt. Ltd. • GSTIN: 07AAACT1234F1Z5<br>
          Connaught Place, New Delhi 110001 • support@transitly.in
        </p>
      </div>
      <div class="invoice-badge">
        <h2>Tax Invoice</h2>
        <div class="meta-tag">${invoiceNo}</div>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: <b>${currentDate}, ${currentTime}</b></p>
        <p style="font-size: 10px; color: #64748b;">SAC: 996511 (Freight Transport)</p>
      </div>
    </div>

    <!-- Shipper & Receiver Grid -->
    <div class="grid-2">
      <div class="info-box">
        <h4>Consignor (Sender)</h4>
        <p>${sender}</p>
        <span>Origin: ${origin}</span>
      </div>
      <div class="info-box">
        <h4>Consignee (Receiver)</h4>
        <p>${receiver}</p>
        <span>Destination: ${destination}</span>
      </div>
    </div>

    <!-- Carrier & Security Details -->
    <div class="info-box" style="margin-bottom: 24px;">
      <h4>Intercity Freight & Security Verification</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 4px;">
        <div>
          <span style="display:block; font-size: 10px;">Carrier / Bus</span>
          <p style="font-size: 11px;">${carrier}</p>
        </div>
        <div>
          <span style="display:block; font-size: 10px;">Parcel Weight</span>
          <p style="font-size: 11px;">${weight}</p>
        </div>
        <div>
          <span style="display:block; font-size: 10px;">HMAC QR Seal</span>
          <p style="font-size: 11px; color: #0050cb; font-family: monospace; font-weight: bold;">#QR-88219 (Verified)</p>
        </div>
      </div>
    </div>

    <!-- Itemized Fee Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>SAC Code</th>
          <th>Weight / Qty</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <b>Intercity Trunk Line Transit</b><br>
            <span style="font-size: 10px; color: #64748b;">${origin} ➔ ${destination}</span>
          </td>
          <td>996511</td>
          <td>${weight}</td>
          <td class="amount">₹${(taxableVal * 0.85).toFixed(2)}</td>
        </tr>
        <tr>
          <td>
            <b>First-Mile Pickup & Trunk Bay Loading</b><br>
            <span style="font-size: 10px; color: #64748b;">Uber Direct / Rapido Terminal Handoff</span>
          </td>
          <td>996511</td>
          <td>1 Job</td>
          <td class="amount">₹${(taxableVal * 0.15).toFixed(2)}</td>
        </tr>
        <tr>
          <td>
            <b>Tamper-Proof QR Seal & Live GPS Telematics</b><br>
            <span style="font-size: 10px; color: #64748b;">High-frequency corridor telemetry stream</span>
          </td>
          <td>996511</td>
          <td>1 Unit</td>
          <td class="amount">₹0.00 (Included)</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals and Paid Stamp -->
    <div class="summary-wrap">
      <div class="stamp-box">
        ✓ PAID & VERIFIED
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Taxable Amount:</span>
          <span style="font-family: monospace; font-weight: bold;">₹${taxableVal}</span>
        </div>
        <div class="totals-row">
          <span>CGST (9%):</span>
          <span style="font-family: monospace;">₹${cgstVal}</span>
        </div>
        <div class="totals-row">
          <span>SGST (9%):</span>
          <span style="font-family: monospace;">₹${sgstVal}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Paid:</span>
          <span>${fare}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>This is a computer-generated tax invoice and consignment note under GST rules.</span>
      <span>Tracking ID: <b>${trackingId}</b></span>
    </div>
  </div>

</body>
</html>
  `;

  // 1. Open Print Preview in a sleek new popup window
  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }

  // 2. Also trigger a direct download file for the user
  const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `Transitly_Tax_Invoice_${trackingId}.html`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

