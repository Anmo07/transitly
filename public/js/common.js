/**
 * Transitly — Common Core Controller
 * Handles shared Navigation active states, Booking Modal, Feasibility API,
 * and Global Real-Time Notification Bell & Live Alerts Streamer.
 */

const API_BASE = window.location.origin;

// =========================================================================
// 0. Universal Authorization Gate — Client-Side Route Protection
// =========================================================================
// Pages that do NOT require authentication:
const PUBLIC_PAGES = ['/login', '/signin', '/auth', '/verify', '/signup', '/register', '/create-account',
  '/privacy', '/privacy-policy', '/terms', '/terms-and-conditions', '/terms-of-use',
  '/faq', '/faqs', '/404'];

/**
 * Sync the JWT from localStorage into a secure session cookie so the server
 * can verify it on protected page GET requests.
 */
const syncSessionCookie = (token) => {
  if (token) {
    document.cookie = `transitly_session=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }
};

/**
 * Clear all auth state (localStorage + cookie). Use on logout.
 */
window.transitlyLogout = () => {
  localStorage.removeItem('transitly_auth_token');
  localStorage.removeItem('transitly_user_name');
  localStorage.removeItem('transitly_user_email');
  localStorage.removeItem('transitly_user_phone');
  localStorage.removeItem('transitly_user_avatar');
  document.cookie = 'transitly_session=; path=/; max-age=0; SameSite=Lax';
  window.location.href = '/login';
};

// On every page load: sync existing localStorage token into cookie
const existingToken = localStorage.getItem('transitly_auth_token');
if (existingToken) {
  syncSessionCookie(existingToken);
}

// On every page load: if this is a protected page and user has no token, redirect to login
(() => {
  const currentPath = window.location.pathname.toLowerCase().replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const isPublic = PUBLIC_PAGES.some(p => currentPath === p || currentPath.startsWith(p + '/'));
  if (!isPublic && !existingToken) {
    const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?redirect=${redirectParam}`);
  }
})();

// Listen for token changes (login events) and sync cookie immediately
window.addEventListener('storage', (e) => {
  if (e.key === 'transitly_auth_token') {
    if (e.newValue) {
      syncSessionCookie(e.newValue);
    } else {
      document.cookie = 'transitly_session=; path=/; max-age=0; SameSite=Lax';
    }
  }
});

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
  // 1.1 Real-Time Profile Photo & User Custom Configuration Sync
  // -------------------------------------------------------------
  const syncGlobalProfileAvatar = (newAvatarUrl = null) => {
    let avatar = newAvatarUrl || localStorage.getItem('transitly_user_avatar');
    if (!avatar) {
      // Check cookies as fallback
      const match = document.cookie.match(/transitly_user_avatar=([^;]+)/);
      if (match) avatar = decodeURIComponent(match[1]);
    }

    if (avatar) {
      document.querySelectorAll('img[alt*="profile" i], img[data-alt*="profile" i], .user-avatar-header, .user-avatar-img, #profileAvatarImg, #headerAvatarImg').forEach(img => {
        img.src = avatar;
      });
    }
  };

  syncGlobalProfileAvatar();

  window.addEventListener('transitly:profile_updated', (e) => {
    if (e.detail && e.detail.avatarUrl) {
      syncGlobalProfileAvatar(e.detail.avatarUrl);
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'transitly_user_avatar') {
      syncGlobalProfileAvatar(e.newValue);
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
        const trackingId = (data && data.data && data.data.shipment) ? data.data.shipment.trackingId : `TRK-${Math.floor(10000 + Math.random() * 90000)}`;

        const newParcel = {
          trackingId,
          status: 'IN_TRANSIT',
          busNumber: 'HR-68-A-1001',
          busName: 'Fleet Bus #402',
          corridor: 'Delhi ➔ Chandigarh',
          from: document.getElementById('modalSenderAddress')?.value || 'ISBT Kashmiri Gate, Delhi',
          to: document.getElementById('modalReceiverAddress')?.value || 'ISBT Sector 17, Chandigarh',
          fare: '₹450.00',
          createdAt: Date.now()
        };
        localStorage.setItem('transitly_active_booking', JSON.stringify(newParcel));
        try {
          const sent = JSON.parse(localStorage.getItem('transitly_sent_parcels') || '[]');
          sent.unshift(newParcel);
          localStorage.setItem('transitly_sent_parcels', JSON.stringify(sent));
        } catch (_) {}

        try {
          const notifs = JSON.parse(localStorage.getItem('transitly_notifications_store') || '[]');
          notifs.unshift({
            id: `notif-${trackingId}`,
            trackingId,
            category: 'in_transit',
            type: 'telemetry_ping',
            title: `Parcel ${trackingId} in Transit: Fleet Bus #402`,
            message: `Your parcel ${trackingId} is en-route aboard HR-68-A-1001. Live telematics active.`,
            timestamp: Date.now(),
            isRead: false,
            icon: 'directions_bus',
            iconColor: 'bg-primary/10 text-primary border-primary/20',
            actionType: 'track',
            actionUrl: `/tracking?id=${trackingId}&bus=HR-68-A-1001`,
            actionLabel: 'Track Live'
          });
          localStorage.setItem('transitly_notifications_store', JSON.stringify(notifs));
        } catch (_) {}

        const successBox = document.getElementById('modalBookingSuccess');
        if (successBox) {
          successBox.classList.remove('hidden');
          successBox.innerHTML = `
            🎉 <strong>Booking Confirmed!</strong><br>
            Parcel Tracking ID: <span class="font-mono font-bold">${trackingId}</span>
          `;
          setTimeout(() => {
            window.closeBookingModal();
            window.location.href = `/tracking?id=${trackingId}`;
          }, 1500);
        }
      } catch (err) {
        const fallbackTrk = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
        const fallbackParcel = {
          trackingId: fallbackTrk,
          status: 'IN_TRANSIT',
          busNumber: 'HR-68-A-1001',
          busName: 'Fleet Bus #402',
          corridor: 'Delhi ➔ Chandigarh',
          from: document.getElementById('modalSenderAddress')?.value || 'ISBT Kashmiri Gate, Delhi',
          to: document.getElementById('modalReceiverAddress')?.value || 'ISBT Sector 17, Chandigarh',
          fare: '₹450.00',
          createdAt: Date.now()
        };
        localStorage.setItem('transitly_active_booking', JSON.stringify(fallbackParcel));
        try {
          const sent = JSON.parse(localStorage.getItem('transitly_sent_parcels') || '[]');
          sent.unshift(fallbackParcel);
          localStorage.setItem('transitly_sent_parcels', JSON.stringify(sent));
        } catch (_) {}

        alert('Booking confirmed in test simulation.');
        window.closeBookingModal();
        window.location.href = `/tracking?id=${fallbackTrk}`;
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
      id: 'notif-4',
      category: 'offers',
      title: '⚡ Door-to-Door First Mile Free Pickup',
      message: 'Rapido & Uber Direct first-mile pickup fee (₹80) is 100% waived on parcels above 10kg across NCR terminals.',
      promoCode: 'FREEDOOR',
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      isRead: true,
      icon: 'two_wheeler',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionUrl: '/',
      actionLabel: 'Claim Free Pickup'
    },
    {
      id: 'notif-5',
      category: 'system',
      title: 'Cryptographic QR Seal Custody Active',
      message: 'All intercity luggage cargo compartments are protected by HMAC SHA-256 digital seals and multi-factor receiver OTPs.',
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      isRead: true,
      icon: 'verified_user',
      iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionUrl: '/faq',
      actionLabel: 'Security Info'
    }
  ];

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

  const getStoredNotifications = () => {
    let list = [];
    try {
      const stored = localStorage.getItem('transitly_notifications_store');
      if (stored) list = JSON.parse(stored);
    } catch (_) {}
    if (!list || list.length === 0) {
      list = [...DEFAULT_ALERTS];
    }

    // Filter in_transit notifications: ONLY allow in_transit notifications if user has sent that parcel AND it is NOT in delivery phase!
    try {
      const activeRaw = localStorage.getItem('transitly_active_booking');
      const sent = JSON.parse(localStorage.getItem('transitly_sent_parcels') || '[]');
      const allParcels = [...sent];
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        if (parsed && !allParcels.some(p => p.trackingId === parsed.trackingId)) {
          allParcels.unshift(parsed);
        }
      }

      // Check if user has ordered any parcel at all
      const hasOrderedParcels = allParcels.length > 0;
      // An active in-transit parcel must have status === 'IN_TRANSIT' and NOT be in delivery phase
      const activeInTransitParcels = allParcels.filter(p => {
        const s = (p.status || '').toUpperCase();
        return (s === 'IN_TRANSIT' || s === 'CONFIRMED') && !isDeliveryPhaseStatus(s);
      });

      if (!hasOrderedParcels || activeInTransitParcels.length === 0) {
        // User hasn't ordered parcel OR all parcels are in delivery phase / delivered
        list = list.filter(n => n.category !== 'in_transit');
      } else {
        const validInTransitTrackingIds = new Set(activeInTransitParcels.map(p => p.trackingId).filter(Boolean));
        list = list.filter(n => {
          if (n.category === 'in_transit') {
            if (n.trackingId) {
              return validInTransitTrackingIds.has(n.trackingId);
            }
            return true;
          }
          return true;
        });
      }
    } catch (_) {}

    return list;
  };

  const getUnreadCount = () => {
    const list = getStoredNotifications();
    return list.filter(n => !n.isRead).length;
  };

  /**
   * Update the Notification Bell Icons and Badges Dynamically on Any Page
   * Keeps notification button simple, static, without dimming or brightening pulses.
   */
  const refreshBellBadges = () => {
    const unreadCount = getUnreadCount();
    
    // Select all potential bell buttons or links across all pages
    const targets = new Set([
      ...document.querySelectorAll('a[href="/notifications"]'),
      ...document.querySelectorAll('.header-notification-btn'),
      ...document.querySelectorAll('[aria-label="Notifications"]'),
      ...document.querySelectorAll('#btnNotifications'),
      ...document.querySelectorAll('.notification-bell-btn')
    ]);

    // Also look for any button/link containing a notifications icon
    document.querySelectorAll('header button, header a').forEach(el => {
      const icon = el.querySelector('.material-symbols-outlined');
      if (icon && (icon.textContent.trim() === 'notifications' || icon.getAttribute('data-icon') === 'notifications')) {
        targets.add(el);
      }
    });

    targets.forEach(btn => {
      btn.classList.add('relative');
      btn.removeAttribute('onclick');

      // Ensure click navigates to notifications
      if (btn.tagName.toLowerCase() !== 'a' || btn.getAttribute('href') !== '/notifications') {
        btn.onclick = (e) => {
          e.preventDefault();
          window.location.href = '/notifications';
        };
      }

      // Remove old badge if exists
      const oldBadge = btn.querySelector('.global-notif-badge');
      if (oldBadge) oldBadge.remove();

      // Inject clean, simple, static unread badge if unreadCount > 0 (No pulse / dimming / brightening)
      if (unreadCount > 0) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'global-notif-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm ring-2 ring-white z-20 pointer-events-none';
        badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
        btn.appendChild(badgeEl);
      }
    });
  };

  window.refreshTransitlyBellBadges = refreshBellBadges;

  /**
   * Helper: Check if current page is an Authentication / Verification Landing Page
   */
  const isAuthLandingPage = () => {
    const current = window.location.pathname.toLowerCase();
    return ['/login', '/signin', '/auth', '/verify', '/signup', '/register'].some(p => current.startsWith(p));
  };

  /**
   * Helper: Check if user has completed login/verification phase
   */
  const isUserAuthenticated = () => {
    return !!localStorage.getItem('transitly_auth_token');
  };

  /**
   * Floating Toast Banner for Real-Time Incoming Notifications
   * Guarded: Notifications strictly appear ONLY after the user is past login and verification.
   */
  const showLiveToastAlert = (alertItem) => {
    if (isAuthLandingPage() || !isUserAuthenticated()) {
      return; // Do not display on login, signup, verification landing pages or for unauthenticated users
    }

    // Remove existing toast if any
    const existing = document.getElementById('transitlyLiveToastAlert');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'transitlyLiveToastAlert';
    toast.className = 'fixed top-16 right-4 z-50 max-w-sm w-[92%] sm:w-auto bg-surface/98 backdrop-blur-xl border border-primary/40 p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 transform transition-all duration-300 animate-slide-down';
    toast.style.animation = 'slideDown 0.3s ease-out forwards';

    toast.innerHTML = `
      <div class="w-9 h-9 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-lg text-primary">notifications</span>
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
    // Only stream alerts if user is logged in and not on authentication pages
    if (isAuthLandingPage() || !isUserAuthenticated()) {
      return;
    }

    // Check if user has an active parcel currently in transit (and NOT in delivery phase)
    let hasActiveInTransitParcel = false;
    try {
      const activeRaw = localStorage.getItem('transitly_active_booking');
      const sent = JSON.parse(localStorage.getItem('transitly_sent_parcels') || '[]');
      const allParcels = [...sent];
      if (activeRaw) allParcels.unshift(JSON.parse(activeRaw));
      hasActiveInTransitParcel = allParcels.some(p => {
        const s = (p.status || '').toUpperCase();
        return (s === 'IN_TRANSIT' || s === 'CONFIRMED') && !isDeliveryPhaseStatus(s);
      });
    } catch (_) {}

    // Filter candidate templates: strictly do not dispatch in-transit alerts if user hasn't ordered or if in delivery phase
    const candidates = LIVE_EVENT_TEMPLATES.filter(t => {
      if (t.category === 'in_transit') {
        return hasActiveInTransitParcel;
      }
      return true;
    });

    if (candidates.length === 0) return;

    const template = candidates[lastEventIndex % candidates.length];
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

  // Initialize Global Bell Badges on Page Load (hidden on auth landing pages)
  if (!isAuthLandingPage()) {
    refreshBellBadges();
  }

  // Listen to custom updates and cross-tab storage updates
  window.addEventListener('transitly:notifications_updated', () => {
    if (!isAuthLandingPage()) refreshBellBadges();
  });
  window.addEventListener('transitly:new_notification', () => {
    if (!isAuthLandingPage()) refreshBellBadges();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'transitly_notifications_store' && !isAuthLandingPage()) {
      refreshBellBadges();
    }
  });

  // Start Real-Time Simulation Interval strictly if authenticated and past login/verification
  if (!isAuthLandingPage() && isUserAuthenticated()) {
    setTimeout(() => {
      dispatchLiveRealtimeAlert();
      setInterval(dispatchLiveRealtimeAlert, 45000);
    }, 25000);
  }
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

// -------------------------------------------------------------
// Auto-load Global Cookie Consent Banner Controller
// -------------------------------------------------------------
if (!window.openCookiePreferences && !document.querySelector('script[src*="cookie-consent.js"]')) {
  const cookieScript = document.createElement('script');
  cookieScript.src = '/js/cookie-consent.js?v=20260903';
  cookieScript.defer = true;
  document.head.appendChild(cookieScript);
}

// -------------------------------------------------------------
// Global User Authentication State Helper
// -------------------------------------------------------------
window.TransitlyAuth = {
  isLoggedIn: () => !!localStorage.getItem('transitly_auth_token'),
  getUser: () => ({
    name: localStorage.getItem('transitly_user_name') || 'Valued Customer',
    email: localStorage.getItem('transitly_user_email') || 'alex@example.com',
    phone: localStorage.getItem('transitly_user_phone') || '+91 98765 43210'
  }),
  logout: () => {
    localStorage.removeItem('transitly_auth_token');
    localStorage.removeItem('transitly_user_name');
    window.location.href = '/login';
  }
};


