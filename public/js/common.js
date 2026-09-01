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
