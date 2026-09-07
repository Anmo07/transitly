/**
 * Transitly — Notifications Feed Controller
 * Real-Time Telematics, Parcel Milestones, Geofence Alerts & Discount Promo Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  const feedContainer = document.getElementById('notificationsFeedContainer');
  const emptyState = document.getElementById('notificationsEmptyState');
  const unreadBadge = document.getElementById('unreadHeaderCountBadge');
  const btnMarkAllRead = document.getElementById('btnMarkAllRead');
  const btnClearAll = document.getElementById('btnClearAllNotifications');
  const inputSearch = document.getElementById('inputSearchNotifications');
  const filterTabs = document.querySelectorAll('.tab-filter-btn');
  const btnSimulateAlert = document.getElementById('btnSimulateAlert');

  let currentCategory = 'all';

  /**
   * Initial Default Rich Notifications Catalog
   */
  /**
   * Initial Default Notifications Catalog (Exclusive of In-Transit alerts unless parcel sent)
   */
  const DEFAULT_NOTIFICATIONS = [
    {
      id: 'notif-2',
      category: 'offers',
      type: 'discount_code',
      title: '🎁 Weekend Express Deal: Flat 30% OFF',
      message: 'Enjoy 30% discount on all Delhi ➔ Chandigarh and Delhi ➔ Jaipur intercity parcel bookings today! Use code at checkout.',
      promoCode: 'TRANSIT30',
      timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
      isRead: false,
      icon: 'local_offer',
      iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
      actionType: 'promo',
      actionUrl: '/',
      actionLabel: 'Book with 30% OFF ➔'
    },
    {
      id: 'notif-4',
      category: 'offers',
      type: 'free_pickup',
      title: '⚡ Door-to-Door First Mile Free Pickup',
      message: 'Rapido & Uber Direct first-mile pickup fee (₹80) is 100% waived on parcels above 10kg across NCR terminals.',
      promoCode: 'FREEDOOR',
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      isRead: true,
      icon: 'two_wheeler',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionType: 'promo',
      actionUrl: '/',
      actionLabel: 'Claim Free Pickup'
    },
    {
      id: 'notif-5',
      category: 'system',
      type: 'security_proof',
      title: 'Cryptographic QR Seal Custody Active',
      message: 'All intercity luggage cargo compartments are protected by HMAC SHA-256 digital seals and multi-factor receiver OTPs.',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      isRead: true,
      icon: 'verified_user',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionType: 'history',
      actionUrl: '/faq',
      actionLabel: 'Learn About POD Security'
    }
  ];

  /**
   * Helper: Check if User has Sent any Parcels
   */
  const getUserSentParcels = () => {
    try {
      const active = localStorage.getItem('transitly_active_booking');
      const list = JSON.parse(localStorage.getItem('transitly_sent_parcels') || '[]');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed && !list.some(p => p.trackingId === parsed.trackingId)) {
          list.unshift(parsed);
        }
      }
      return list;
    } catch (_) {
      return [];
    }
  };

  const DELIVERY_PHASE_STATUSES = [
    'OUT_FOR_DELIVERY',
    'DELIVERY_LAST_MILE',
    'DELIVERING',
    'ARRIVED_DESTINATION',
    'DELIVERED',
    'COMPLETED',
    'CLOSED'
  ];

  const isDeliveryPhaseStatus = (status) => {
    if (!status) return false;
    return DELIVERY_PHASE_STATUSES.includes(String(status).trim().toUpperCase());
  };

  /**
   * Load Notifications from Storage or Default (Strictly Enforce in_transit Only When User Sent Parcel & NOT in Delivery Phase)
   */
  const getNotifications = () => {
    let list = [];
    try {
      const stored = localStorage.getItem('transitly_notifications_store');
      if (stored) list = JSON.parse(stored);
    } catch (_) {}

    if (!list || list.length === 0) {
      list = [...DEFAULT_NOTIFICATIONS];
    }

    const userParcels = getUserSentParcels();
    const activeInTransitParcels = userParcels.filter(p => {
      const s = (p.status || '').toUpperCase();
      return (s === 'IN_TRANSIT' || s === 'CONFIRMED') && !isDeliveryPhaseStatus(s);
    });
    const activeTrackingIds = new Set(activeInTransitParcels.map(p => p.trackingId).filter(Boolean));

    // Remove in-transit notifications if user hasn't sent any parcel OR if the parcel is in delivery phase
    list = list.filter(n => {
      if (n.category === 'in_transit') {
        if (n.trackingId) {
          return activeTrackingIds.has(n.trackingId);
        }
        return activeInTransitParcels.length > 0;
      }
      return true;
    });

    // If user has actively sent parcels in transit, inject live notifications for them
    activeInTransitParcels.forEach(p => {
      const notifId = `notif-user-${p.trackingId}`;
      if (!list.some(n => n.id === notifId || (n.trackingId && n.trackingId === p.trackingId))) {
        list.unshift({
          id: notifId,
          trackingId: p.trackingId,
          category: 'in_transit',
          type: 'telemetry_ping',
          title: `Parcel ${p.trackingId} in Transit: ${p.busName || 'Fleet Bus'}`,
          message: `Your parcel ${p.trackingId} is in transit on corridor ${p.corridor || 'Delhi ➔ Chandigarh'} aboard ${p.busNumber || 'HR-68-A-1001'}. Live telematics active.`,
          timestamp: p.createdAt || Date.now(),
          isRead: false,
          icon: 'directions_bus',
          iconColor: 'bg-primary/10 text-primary border-primary/20',
          actionType: 'track',
          actionUrl: `/tracking?id=${p.trackingId}&bus=${p.busNumber || 'HR-68-A-1001'}`,
          actionLabel: 'Track Bus Live ➔'
        });
      }
    });

    localStorage.setItem('transitly_notifications_store', JSON.stringify(list));
    return list;
  };

  const saveNotifications = (list) => {
    localStorage.setItem('transitly_notifications_store', JSON.stringify(list));
    updateCounters(list);
    if (typeof window.refreshTransitlyBellBadges === 'function') {
      window.refreshTransitlyBellBadges();
    }
    window.dispatchEvent(new CustomEvent('transitly:notifications_updated', { detail: list }));
  };

  /**
   * Format Relative Time
   */
  const formatTimeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  /**
   * Update Badge & Tab Counters
   */
  const updateCounters = (list = getNotifications()) => {
    const unread = list.filter(n => !n.isRead).length;
    if (unreadBadge) {
      unreadBadge.textContent = unread > 0 ? `${unread} New` : 'All Caught Up';
      unreadBadge.className = unread > 0
        ? 'bg-primary text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm'
        : 'bg-surface-container-high text-on-surface-variant text-[11px] font-bold px-2 py-0.5 rounded-full';
    }

    const tabAll = document.getElementById('tabCountAll');
    const tabTransit = document.getElementById('tabCountTransit');
    const tabOffers = document.getElementById('tabCountOffers');
    const tabSystem = document.getElementById('tabCountSystem');

    if (tabAll) tabAll.textContent = list.length;
    if (tabTransit) tabTransit.textContent = list.filter(n => n.category === 'in_transit').length;
    if (tabOffers) tabOffers.textContent = list.filter(n => n.category === 'offers').length;
    if (tabSystem) tabSystem.textContent = list.filter(n => n.category === 'system').length;
  };

  /**
   * Render Notification Cards in Feed
   */
  const renderFeed = () => {
    const list = getNotifications();
    const query = inputSearch ? inputSearch.value.toLowerCase().trim() : '';

    let filtered = list;

    if (currentCategory !== 'all') {
      filtered = filtered.filter(n => n.category === currentCategory);
    }

    if (query) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        (n.promoCode && n.promoCode.toLowerCase().includes(query))
      );
    }

    if (!feedContainer) return;

    if (filtered.length === 0) {
      feedContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('flex');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('flex');

    let html = '';

    filtered.forEach(item => {
      const unreadDot = !item.isRead
        ? `<span class="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread Alert"></span>`
        : '';

      const cardBg = !item.isRead
        ? 'bg-surface border-primary/30 shadow-md ring-1 ring-primary/10'
        : 'bg-surface-container-low/70 border-outline-variant/30 opacity-90';

      let promoHtml = '';
      if (item.promoCode) {
        promoHtml = `
          <div class="mt-2.5 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-700/60 px-3 py-1.5 rounded-xl w-fit">
            <span class="text-[11px] font-bold text-amber-900 dark:text-amber-200 font-mono tracking-widest">${item.promoCode}</span>
            <button type="button" class="btn-copy-code text-[11px] font-bold text-amber-700 hover:text-amber-950 flex items-center gap-1 active:scale-95 transition-transform" data-code="${item.promoCode}">
              <span class="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Copy</span>
            </button>
          </div>
        `;
      }

      html += `
        <div class="notification-card ${cardBg} p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg relative group" data-id="${item.id}">
          <div class="flex items-start gap-3.5">
            <!-- Icon Badge -->
            <div class="w-10 h-10 rounded-2xl ${item.iconColor} border flex items-center justify-center shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-0.5">
                <div class="flex items-center gap-2 min-w-0">
                  <h4 class="font-bold text-xs sm:text-sm text-on-surface truncate">${item.title}</h4>
                  ${unreadDot}
                </div>
                <span class="text-[10px] text-on-surface-variant font-medium shrink-0">${formatTimeAgo(item.timestamp)}</span>
              </div>

              <p class="text-xs text-on-surface-variant leading-relaxed mt-1">${item.message}</p>

              ${promoHtml}

              <!-- Action Bar -->
              <div class="mt-3 pt-2.5 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                <a href="${item.actionUrl}" class="btn-card-action text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 active:scale-95 transition-all">
                  <span>${item.actionLabel}</span>
                </a>

                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button type="button" class="btn-toggle-read text-on-surface-variant hover:text-primary p-1 rounded-lg text-xs" title="${item.isRead ? 'Mark as unread' : 'Mark as read'}" data-id="${item.id}">
                    <span class="material-symbols-outlined text-[16px]">${item.isRead ? 'mark_chat_unread' : 'done'}</span>
                  </button>
                  <button type="button" class="btn-delete-notif text-on-surface-variant hover:text-error p-1 rounded-lg text-xs" title="Delete notification" data-id="${item.id}">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    });

    feedContainer.innerHTML = html;

    // Attach Event Listeners to Card Elements
    feedContainer.querySelectorAll('.btn-toggle-read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const list = getNotifications();
        const item = list.find(n => n.id === id);
        if (item) {
          item.isRead = !item.isRead;
          saveNotifications(list);
          renderFeed();
        }
      });
    });

    feedContainer.querySelectorAll('.btn-delete-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const list = getNotifications().filter(n => n.id !== id);
        saveNotifications(list);
        renderFeed();
      });
    });

    feedContainer.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        navigator.clipboard.writeText(code);
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px] text-emerald-600">check</span> <span class="text-emerald-600">Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">content_copy</span> <span>Copy</span>`;
        }, 2000);
      });
    });

    // Clicking anywhere on an unread card marks it as read
    feedContainer.querySelectorAll('.notification-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const id = card.getAttribute('data-id');
        const list = getNotifications();
        const item = list.find(n => n.id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          saveNotifications(list);
          renderFeed();
        }
      });
    });
  };

  /**
   * Filter Tabs Handlers
   */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.className = 'tab-filter-btn px-3.5 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container shrink-0 transition-all flex items-center gap-1.5';
      });
      tab.className = 'tab-filter-btn active-tab px-3.5 py-1.5 rounded-full bg-primary text-white shadow-sm shrink-0 transition-all flex items-center gap-1.5';

      currentCategory = tab.getAttribute('data-category');
      renderFeed();
    });
  });

  // Search filter
  if (inputSearch) {
    inputSearch.addEventListener('input', () => {
      renderFeed();
    });
  }

  // Mark all as read
  if (btnMarkAllRead) {
    btnMarkAllRead.addEventListener('click', () => {
      const list = getNotifications();
      list.forEach(n => n.isRead = true);
      saveNotifications(list);
      renderFeed();
    });
  }

  // Clear all
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all notifications?')) {
        saveNotifications([]);
        renderFeed();
      }
    });
  }

  /**
   * Real-Time Simulated Live Alert Trigger
   */
  const triggerSimulatedLiveAlert = () => {
    const alertsPool = [
      {
        category: 'in_transit',
        type: 'telemetry_ping',
        title: '⚡ Live Telemetry: Speed 72 km/h',
        message: 'Bus DL-01-AB-1234 on Delhi-Jaipur highway just cleared Dharuhera Checkpoint on schedule.',
        icon: 'speed',
        iconColor: 'bg-blue-100 text-blue-700 border-blue-200',
        actionType: 'track',
        actionUrl: '/tracking?bus=DL-01-AB-1234',
        actionLabel: 'Track Bus Live ➔'
      },
      {
        category: 'offers',
        type: 'discount_code',
        title: '🎉 Flash Deal: 20% OFF Delhi ➔ Sirsa',
        message: 'Special morning bus capacity available! Ship up to 20kg with instant 20% cargo voucher.',
        promoCode: 'SIRSA20',
        icon: 'sell',
        iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
        actionType: 'promo',
        actionUrl: '/',
        actionLabel: 'Book Sirsa Corridor'
      },
      {
        category: 'in_transit',
        type: 'geofence',
        title: '📍 Terminal Arrival: Sonipat Hub',
        message: 'Haryana Roadways bus HR-68-A-1001 arrived inside Sonipat ISBT geofence boundary.',
        icon: 'pin_drop',
        iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        actionType: 'track',
        actionUrl: '/tracking?bus=HR-68-A-1001',
        actionLabel: 'View Route'
      }
    ];

    const randomPick = alertsPool[Math.floor(Math.random() * alertsPool.length)];
    const newAlert = {
      id: `notif-${Date.now()}`,
      ...randomPick,
      timestamp: Date.now(),
      isRead: false
    };

    const list = [newAlert, ...getNotifications()];
    saveNotifications(list);
    renderFeed();
  };

  // Listen for real-time live events from common.js streamer
  window.addEventListener('transitly:new_notification', () => {
    updateCounters();
    renderFeed();
  });

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'transitly_notifications_store') {
      updateCounters();
      renderFeed();
    }
  });

  // Auto-refresh relative timestamps ("2 mins ago") every 30 seconds
  setInterval(() => {
    renderFeed();
  }, 30000);

  // Initialize
  updateCounters();
  renderFeed();
});
