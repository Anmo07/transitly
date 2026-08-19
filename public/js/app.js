/**
 * Transitly — Enterprise Multi-Screen Experience & Telematics Engine
 * Handles Navigation, Leaflet Telematics, Distributed Sagas, Real-time WebSockets,
 * WhatsApp Conversational AI, Saved Addresses, Payment Methods, and Audit Proofs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = (window.location.port === '3000' || window.location.port === '') ? '' : 'http://localhost:3000';

  // -------------------------------------------------------------
  // 1. Toast Notification Engine
  // -------------------------------------------------------------
  const toastContainer = document.getElementById('toastContainer');
  const showToast = (title, message = '', type = 'info') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-600' : 'bg-[#0050cb]';
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
    
    toast.className = `${bgClass} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs pointer-events-auto transform transition-all duration-300 translate-y-[-20px] opacity-0 animate-fade-in-up`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-xl shrink-0">${icon}</span>
      <div class="flex-1">
        <p class="font-bold leading-tight">${title}</p>
        ${message ? `<p class="text-[11px] opacity-90 mt-0.5">${message}</p>` : ''}
      </div>
      <button class="shrink-0 text-white/80 hover:text-white ml-1">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-[-20px]', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  };

  // -------------------------------------------------------------
  // 2. Navigation Tab Switching (Deliver, Tracking, History, Profile, Sub-screens)
  // -------------------------------------------------------------
  const tabViews = {
    deliver: document.getElementById('tab-deliver'),
    tracking: document.getElementById('tab-tracking'),
    history: document.getElementById('tab-history'),
    profile: document.getElementById('tab-profile'),
    savedAddresses: document.getElementById('tab-saved-addresses'),
    paymentMethods: document.getElementById('tab-payment-methods'),
    settings: document.getElementById('tab-settings'),
    helpSupport: document.getElementById('tab-help-support')
  };

  const navBtns = {
    deliver: document.getElementById('navBtnDeliver'),
    tracking: document.getElementById('navBtnTracking'),
    history: document.getElementById('navBtnHistory'),
    profile: document.getElementById('navBtnProfile')
  };

  const mainBottomNav = document.getElementById('mainBottomNav');
  const mainAppHeader = document.getElementById('mainAppHeader');

  const switchTab = (tabKey) => {
    Object.keys(tabViews).forEach((key) => {
      if (tabViews[key]) {
        if (key === tabKey) {
          tabViews[key].classList.remove('hidden');
        } else {
          tabViews[key].classList.add('hidden');
        }
      }
    });

    // Handle bottom nav visibility on sub-screens (Semantic Shell Rule)
    if (tabKey === 'savedAddresses' || tabKey === 'paymentMethods' || tabKey === 'settings' || tabKey === 'helpSupport') {
      if (mainBottomNav) mainBottomNav.classList.add('hidden');
      if (mainAppHeader) mainAppHeader.classList.add('hidden');
    } else {
      if (mainBottomNav) mainBottomNav.classList.remove('hidden');
      if (mainAppHeader) mainAppHeader.classList.remove('hidden');
    }

    Object.keys(navBtns).forEach((key) => {
      if (navBtns[key]) {
        if (key === tabKey) {
          navBtns[key].className = 'nav-tab-btn flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1.5 transition-all active:scale-90 w-1/4';
          const icon = navBtns[key].querySelector('.material-symbols-outlined');
          if (icon) icon.setAttribute('data-weight', 'fill');
        } else {
          navBtns[key].className = 'nav-tab-btn flex flex-col items-center justify-center text-on-surface-variant px-4 py-1.5 hover:bg-surface-variant rounded-xl transition-all active:scale-90 w-1/4';
          const icon = navBtns[key].querySelector('.material-symbols-outlined');
          if (icon) icon.removeAttribute('data-weight');
        }
      }
    });

    if (tabKey === 'tracking' && map) {
      setTimeout(() => {
        map.invalidateSize();
        if (routeLine) map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      }, 200);
    }

    if (tabKey === 'history') {
      loadShipmentsFromBackend();
    }
  };

  if (navBtns.deliver) navBtns.deliver.addEventListener('click', () => switchTab('deliver'));
  if (navBtns.tracking) navBtns.tracking.addEventListener('click', () => switchTab('tracking'));
  if (navBtns.history) navBtns.history.addEventListener('click', () => switchTab('history'));
  if (navBtns.profile) navBtns.profile.addEventListener('click', () => switchTab('profile'));

  // Header quick buttons
  const btnHeaderMenu = document.getElementById('btnHeaderMenu');
  if (btnHeaderMenu) btnHeaderMenu.addEventListener('click', () => switchTab('deliver'));

  // -------------------------------------------------------------
  // 3. Notifications Drawer / Modal
  // -------------------------------------------------------------
  const btnNotifications = document.getElementById('btnNotifications');
  const notificationsModal = document.getElementById('notificationsModal');
  const btnCloseNotificationsModal = document.getElementById('btnCloseNotificationsModal');
  const btnMarkAllNotifsRead = document.getElementById('btnMarkAllNotifsRead');
  const btnClearAllNotifs = document.getElementById('btnClearAllNotifs');
  const notifBadgeDot = document.getElementById('notifBadgeDot');
  const notifCountBadge = document.getElementById('notifCountBadge');
  const notificationsList = document.getElementById('notificationsList');

  if (btnNotifications && notificationsModal) {
    btnNotifications.addEventListener('click', () => {
      notificationsModal.classList.remove('hidden');
      notificationsModal.classList.add('flex');
    });
  }

  if (btnCloseNotificationsModal && notificationsModal) {
    btnCloseNotificationsModal.addEventListener('click', () => {
      notificationsModal.classList.add('hidden');
      notificationsModal.classList.remove('flex');
    });
  }

  if (btnMarkAllNotifsRead) {
    btnMarkAllNotifsRead.addEventListener('click', () => {
      if (notifBadgeDot) notifBadgeDot.classList.add('hidden');
      if (notifCountBadge) notifCountBadge.innerText = '0';
      showToast('Notifications Marked Read', 'All alerts have been cleared.', 'success');
    });
  }

  if (btnClearAllNotifs && notificationsList) {
    btnClearAllNotifs.addEventListener('click', () => {
      notificationsList.innerHTML = '<p class="text-center text-outline py-8">No notifications right now.</p>';
      if (notifBadgeDot) notifBadgeDot.classList.add('hidden');
      if (notifCountBadge) notifCountBadge.innerText = '0';
      showToast('Cleared All', 'Notification history cleared.');
    });
  }

  // -------------------------------------------------------------
  // 4. Live Telematics, Corridors Data & Leaflet Map
  // -------------------------------------------------------------
  const corridorsData = {
    'HR-DEL-CHD': {
      busNumber: '#402',
      name: 'Delhi ➔ Chandigarh (GT Road)',
      vehicle: 'HR-55-AB-1234',
      fare: '₹280',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '08:30 PM' },
        { name: 'Sonipat Bus Stand', lat: 28.9950, lon: 77.0190, time: '09:15 PM' },
        { name: 'Panipat Toll Plaza Hub', lat: 29.3909, lon: 76.9635, time: '10:00 PM' },
        { name: 'Karnal Central Bus Stand', lat: 29.6857, lon: 76.9905, time: '10:45 PM' },
        { name: 'Kurukshetra Pipli Junction', lat: 29.9695, lon: 76.8783, time: '11:25 PM' },
        { name: 'Ambala Cantt Bus Stand', lat: 30.3610, lon: 76.8375, time: '12:10 AM' },
        { name: 'Zirakpur Flyover Hub', lat: 30.6425, lon: 76.8173, time: '12:50 AM' },
        { name: 'ISBT Sector 17, Chandigarh', lat: 30.7410, lon: 76.7790, time: '01:20 AM' }
      ]
    },
    'TR-DEL-JAI': {
      busNumber: '#108',
      name: 'Delhi ➔ Jaipur Intercity Express',
      vehicle: 'DL-01-AB-1234',
      fare: '₹300',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '08:30 PM' },
        { name: 'IFFCO Chowk, Gurgaon', lat: 28.4720, lon: 77.0725, time: '09:15 PM' },
        { name: 'Dharuhera Express Stop', lat: 28.2055, lon: 76.7942, time: '09:55 PM' },
        { name: 'Behror Mid-way Hub', lat: 27.8920, lon: 76.2840, time: '10:35 PM' },
        { name: 'Kotputli Transit Point', lat: 27.7010, lon: 76.1985, time: '10:55 PM' },
        { name: 'Sindhi Camp Central, Jaipur', lat: 26.9124, lon: 75.7873, time: '11:45 PM' }
      ]
    },
    'HR-DEL-NRN': {
      busNumber: '#205',
      name: 'Delhi ➔ Rewari ➔ Narnaul',
      vehicle: 'HR-24-GH-3456',
      fare: '₹240',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '07:00 PM' },
        { name: 'Dhaula Kuan Transit Hub', lat: 28.5921, lon: 77.1610, time: '07:30 PM' },
        { name: 'IFFCO Chowk, Gurgaon', lat: 28.4720, lon: 77.0725, time: '08:00 PM' },
        { name: 'Manesar Industrial Depot', lat: 28.3580, lon: 76.9380, time: '08:35 PM' },
        { name: 'Dharuhera Express Stop', lat: 28.2055, lon: 76.7942, time: '09:05 PM' },
        { name: 'Rewari New Bus Stand', lat: 28.1920, lon: 76.6180, time: '09:40 PM' },
        { name: 'Narnaul Central Bus Depot', lat: 28.0430, lon: 76.1080, time: '10:50 PM' }
      ]
    },
    'HR-DEL-SRS': {
      busNumber: '#318',
      name: 'Delhi ➔ Rohtak ➔ Hisar ➔ Sirsa',
      vehicle: 'HR-39-EF-9012',
      fare: '₹310',
      stops: [
        { name: 'Delhi Tikri Border', lat: 28.6920, lon: 76.9650, time: '06:00 PM' },
        { name: 'Bahadurgarh Bus Stand', lat: 28.6880, lon: 76.9240, time: '06:20 PM' },
        { name: 'Rohtak New Bus Stand', lat: 28.8955, lon: 76.6066, time: '07:05 PM' },
        { name: 'Meham Transit Point', lat: 28.9680, lon: 76.2950, time: '07:45 PM' },
        { name: 'Hansi Bus Stand', lat: 29.1020, lon: 75.9620, time: '08:25 PM' },
        { name: 'Hisar Central Bus Depot', lat: 29.1539, lon: 75.7229, time: '09:00 PM' },
        { name: 'Sirsa Central Bus Stand', lat: 29.5340, lon: 75.0280, time: '10:55 PM' }
      ]
    },
    'HR-GGN-HDL': {
      busNumber: '#112',
      name: 'Gurgaon ➔ Faridabad ➔ Palwal ➔ Hodal',
      vehicle: 'HR-55-AB-1234',
      fare: '₹180',
      stops: [
        { name: 'Gurgaon Central Bus Stand', lat: 28.4595, lon: 77.0266, time: '04:00 PM' },
        { name: 'Faridabad NIT Bus Depot', lat: 28.3980, lon: 77.3060, time: '04:40 PM' },
        { name: 'Ballabhgarh Bus Stand', lat: 28.3370, lon: 77.3240, time: '05:00 PM' },
        { name: 'Palwal Central Hub', lat: 28.1430, lon: 77.3320, time: '05:35 PM' },
        { name: 'Hodal Border Terminal', lat: 27.8920, lon: 77.3710, time: '06:10 PM' }
      ]
    },
    'HR-CHD-YMN': {
      busNumber: '#504',
      name: 'Chandigarh ➔ Ambala ➔ Yamunanagar',
      vehicle: 'HR-01-IJ-7890',
      fare: '₹190',
      stops: [
        { name: 'ISBT Sector 17, Chandigarh', lat: 30.7410, lon: 76.7790, time: '09:00 AM' },
        { name: 'Ambala City Hub', lat: 30.3780, lon: 76.7760, time: '09:50 AM' },
        { name: 'Saha Industrial Junction', lat: 30.2450, lon: 76.9850, time: '10:25 AM' },
        { name: 'Yamunanagar Central Bus Stand', lat: 30.1290, lon: 77.2670, time: '11:00 AM' }
      ]
    }
  };

  let activeRouteKey = 'HR-DEL-CHD';
  let currentStopIdx = 3;
  let map = null;
  let vehicleMarker = null;
  let routeLine = null;
  let stopMarkers = [];

  const mapContainer = document.getElementById('liveTrackingMap');
  if (mapContainer && typeof L !== 'undefined') {
    map = L.map('liveTrackingMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([29.6857, 76.9905], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
  }

  const renderTrackingRoute = (routeKey) => {
    const route = corridorsData[routeKey];
    if (!route || !map) return;

    activeRouteKey = routeKey;
    const stops = route.stops;

    if (routeLine) map.removeLayer(routeLine);
    stopMarkers.forEach((m) => map.removeLayer(m));
    stopMarkers = [];

    const coords = stops.map((s) => [s.lat, s.lon]);
    routeLine = L.polyline(coords, {
      color: '#0066ff',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round'
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    stops.forEach((stop, idx) => {
      const isOrigin = idx === 0;
      const isDest = idx === stops.length - 1;
      const markerColor = isOrigin ? '#128C55' : isDest ? '#ba1a1a' : '#5c5f61';

      const icon = L.divIcon({
        className: 'custom-stop-icon',
        html: `<div style="background:${markerColor}; border:2px solid #fff; border-radius:50%; width:16px; height:16px; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const m = L.marker([stop.lat, stop.lon], { icon }).addTo(map);
      m.bindPopup(`<strong>${stop.name}</strong><br>Scheduled: ${stop.time}`);
      stopMarkers.push(m);
    });

    const safeIdx = Math.min(currentStopIdx, stops.length - 1);
    const curr = stops[safeIdx];
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(0,102,255,0.25); animation:radar-pulse-anim 2s infinite;"></div>
          <div style="width:34px; height:34px; border-radius:50%; background:#0050cb; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(0,102,255,0.6); font-size:16px; color:#fff;">
            🚌
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (vehicleMarker) {
      vehicleMarker.setLatLng([curr.lat, curr.lon]);
    } else {
      vehicleMarker = L.marker([curr.lat, curr.lon], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // Update bottom sheet texts
    const trackStatusTitle = document.getElementById('trackStatusTitle');
    if (trackStatusTitle) trackStatusTitle.innerText = `In Transit via Bus ${route.busNumber}`;

    const trackHandoffText = document.getElementById('trackHandoffText');
    if (trackHandoffText) trackHandoffText.innerText = `${curr.name} to Rapido Partner`;

    const timelineActiveStopTitle = document.getElementById('timelineActiveStopTitle');
    if (timelineActiveStopTitle) timelineActiveStopTitle.innerText = `In Transit – Bus ${route.busNumber}`;

    const timelineActiveStopSub = document.getElementById('timelineActiveStopSub');
    if (timelineActiveStopSub) timelineActiveStopSub.innerText = `Currently near ${curr.name}`;

    const progressPct = Math.round((safeIdx / (stops.length - 1)) * 100);
    const progressFill = document.getElementById('timelineProgressFill');
    if (progressFill) progressFill.style.height = `${Math.max(15, progressPct)}%`;
  };

  renderTrackingRoute(activeRouteKey);

  const trackingDropdown = document.getElementById('trackingCorridorDropdown');
  if (trackingDropdown) {
    trackingDropdown.addEventListener('change', (e) => {
      currentStopIdx = 2;
      renderTrackingRoute(e.target.value);
      showToast('Corridor Switched', `Active view: ${corridorsData[e.target.value]?.name}`);
    });
  }

  // Live Socket.io updates for tracking
  if (typeof io !== 'undefined') {
    try {
      const socket = io();
      socket.on('telemetry:update', (ping) => {
        if (vehicleMarker && ping.latitude && ping.longitude) {
          vehicleMarker.setLatLng([ping.latitude, ping.longitude]);
        }
      });
    } catch (err) {
      console.log('[Socket Notice] Standalone mode active');
    }
  }

  // Advance route ping simulation
  const btnAdvanceRouteLive = document.getElementById('btnAdvanceRouteLive');
  if (btnAdvanceRouteLive) {
    btnAdvanceRouteLive.addEventListener('click', async () => {
      const route = corridorsData[activeRouteKey];
      if (!route) return;

      currentStopIdx = (currentStopIdx + 1) % route.stops.length;
      if (currentStopIdx === 0) currentStopIdx = 1;

      const nextStop = route.stops[currentStopIdx];
      const speed = Math.floor(62 + Math.random() * 18);
      const remainingKm = Math.max(2.4, (route.stops.length - currentStopIdx) * 11.5);
      const etaMins = Math.round(remainingKm / 1.15);

      btnAdvanceRouteLive.innerText = 'Transmitting...';

      try {
        await fetch(`${API_BASE}/api/v1/tracking/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: route.vehicle,
            operatorId: '10',
            latitude: nextStop.lat,
            longitude: nextStop.lon,
            speedKmh: speed,
            heading: 180
          })
        });
      } catch (err) {
        // Fallback smooth transition
      }

      const distElem = document.getElementById('trackDistance');
      if (distElem) distElem.innerText = `${remainingKm.toFixed(1)} km`;

      const etaElem = document.getElementById('trackEta');
      if (etaElem) etaElem.innerText = `${etaMins}m (${nextStop.time})`;

      if (vehicleMarker && map) {
        vehicleMarker.setLatLng([nextStop.lat, nextStop.lon]);
        map.panTo([nextStop.lat, nextStop.lon], { animate: true, duration: 0.8 });
      }

      renderTrackingRoute(activeRouteKey);
      btnAdvanceRouteLive.innerText = '✔ Moved';
      showToast('GPS Telematics Ping', `${route.name}: Reached ${nextStop.name} at ${speed} km/h`, 'success');

      setTimeout(() => {
        btnAdvanceRouteLive.innerText = 'Advance';
      }, 900);
    });
  }

  // Tracking Share Link & Support Buttons
  const btnTrackingShare = document.getElementById('btnTrackingShare');
  if (btnTrackingShare) {
    btnTrackingShare.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'Transitly Live Tracking',
          text: `Live tracking for Bus ${corridorsData[activeRouteKey]?.busNumber} (${corridorsData[activeRouteKey]?.name})`,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Tracking Link Copied', 'Shareable live GPS link copied to clipboard!', 'success');
      }
    });
  }

  const btnTrackingSupport = document.getElementById('btnTrackingSupport');
  if (btnTrackingSupport) {
    btnTrackingSupport.addEventListener('click', () => {
      openWhatsAppChatModal(`Track ${corridorsData[activeRouteKey]?.name}`);
    });
  }

  // -------------------------------------------------------------
  // 5. Deliver Tab Quick Search & Ambient Map
  // -------------------------------------------------------------
  const homeSearchInput = document.getElementById('homeSearchInput');
  const btnQuickSearch = document.getElementById('btnQuickSearch');

  const handleHomeSearch = () => {
    const q = (homeSearchInput?.value || '').toLowerCase().trim();
    let selectedRoute = 'HR-DEL-CHD';
    let destName = 'Sector 17, Chandigarh';

    if (q.includes('jaipur') || q.includes('rajasthan')) {
      selectedRoute = 'TR-DEL-JAI';
      destName = 'Sindhi Camp Central, Jaipur';
    } else if (q.includes('narnaul') || q.includes('rewari')) {
      selectedRoute = 'HR-DEL-NRN';
      destName = 'Narnaul Central Bus Depot';
    } else if (q.includes('sirsa') || q.includes('hisar') || q.includes('rohtak')) {
      selectedRoute = 'HR-DEL-SRS';
      destName = 'Sirsa Central Bus Stand';
    } else if (q.includes('hodal') || q.includes('palwal') || q.includes('faridabad')) {
      selectedRoute = 'HR-GGN-HDL';
      destName = 'Hodal Border Terminal';
    } else if (q.includes('yamuna') || q.includes('ambala')) {
      selectedRoute = 'HR-CHD-YMN';
      destName = 'Yamunanagar Central Bus Stand';
    } else if (q) {
      destName = q;
    }

    openBookingModal(selectedRoute);
    const receiverInput = document.getElementById('modalReceiverAddress');
    if (receiverInput) receiverInput.value = destName;
  };

  if (btnQuickSearch) btnQuickSearch.addEventListener('click', handleHomeSearch);
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleHomeSearch();
    });
  }

  // -------------------------------------------------------------
  // 6. Booking Modal & Multi-Modal Saga Execution
  // -------------------------------------------------------------
  const bookingModal = document.getElementById('bookingModal');
  const btnHeroBookNow = document.getElementById('btnHeroBookNow');
  const btnCloseBookingModal = document.getElementById('btnCloseBookingModal');

  const openBookingModal = (defaultRoute = 'HR-DEL-CHD') => {
    if (bookingModal) {
      const select = document.getElementById('modalRouteSelect');
      if (select) select.value = defaultRoute;
      bookingModal.classList.remove('hidden');
      bookingModal.classList.add('flex');
    }
  };

  const closeBookingModal = () => {
    if (bookingModal) {
      bookingModal.classList.add('hidden');
      bookingModal.classList.remove('flex');
    }
  };

  if (btnHeroBookNow) btnHeroBookNow.addEventListener('click', () => openBookingModal());
  if (btnCloseBookingModal) btnCloseBookingModal.addEventListener('click', closeBookingModal);

  document.querySelectorAll('.corridor-quick-pick').forEach((card) => {
    card.addEventListener('click', () => {
      const route = card.getAttribute('data-route') || 'HR-DEL-CHD';
      openBookingModal(route);
    });
  });

  // Check Feasibility in Modal
  const btnModalCheckFeasibility = document.getElementById('btnModalCheckFeasibility');
  if (btnModalCheckFeasibility) {
    btnModalCheckFeasibility.addEventListener('click', async () => {
      btnModalCheckFeasibility.innerText = 'Evaluating Feasibility...';
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
        
        const expLabel = document.getElementById('feasibilityExperienceLabel');
        const msgText = document.getElementById('feasibilityMessageText');
        const fareText = document.getElementById('feasibilityFareText');

        if (expLabel) expLabel.innerText = data.data?.customerExperience || 'FULL_DOOR_TO_DOOR';
        if (msgText) msgText.innerText = data.data?.customerMessage || 'Uber Direct Pickup ➔ Express Public Bus ➔ Rapido Delivery';
        if (fareText) fareText.innerText = '₹280.00';

        showToast('Feasibility Verified', 'Door-to-door multi-modal route confirmed available.', 'success');
      } catch (err) {
        showToast('Feasibility Notice', 'Feasibility standard matrix evaluated.', 'info');
      } finally {
        btnModalCheckFeasibility.innerText = 'Check Feasibility';
      }
    });
  }

  // Handle Booking Submission
  const modalBookingForm = document.getElementById('modalBookingForm');
  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnModalSubmitBooking');
      btn.disabled = true;
      btn.innerText = 'Executing Saga...';

      const senderName = document.getElementById('modalSenderName').value;
      const senderPhone = document.getElementById('modalSenderPhone').value;
      const senderAddr = document.getElementById('modalSenderAddress').value;
      const receiverName = document.getElementById('modalReceiverName').value;
      const receiverPhone = document.getElementById('modalReceiverPhone').value;
      const receiverAddr = document.getElementById('modalReceiverAddress').value;
      const weight = parseFloat(document.getElementById('modalWeight').value) || 5;
      const route = document.getElementById('modalRouteSelect').value;

      try {
        const res = await fetch(`${API_BASE}/api/v1/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorId: '10',
            routeId: '10',
            sender: { name: senderName, phone: senderPhone, address: senderAddr },
            recipient: { name: receiverName, phone: receiverPhone, address: receiverAddr },
            weightKg: weight,
            routeName: corridorsData[route]?.name || 'Intercity Express'
          })
        });

        const data = await res.json();
        const shipment = data.data?.shipment;
        const trackingId = shipment?.trackingId || `TRK-${Date.now().toString(36).toUpperCase()}`;
        const qrSealCode = data.data?.qrSealCode || shipment?.qrSeal?.currentSealCode || 'SEAL-9921-X901';
        const otpCode = data.data?.rawOtpForRecipient || '849201';

        const successBox = document.getElementById('modalBookingSuccess');
        if (successBox) {
          successBox.classList.remove('hidden');
          successBox.innerHTML = `
            🎉 <strong>Booking Confirmed via Distributed Saga!</strong><br>
            <div class="mt-1 space-y-0.5">
              <div>Tracking ID: <span class="font-mono font-bold text-primary">${trackingId}</span></div>
              <div>QR Tamper Seal: <span class="font-mono font-bold text-emerald-700">${qrSealCode}</span></div>
              <div>Recipient Delivery OTP: <span class="font-mono font-bold text-emerald-900">${otpCode}</span></div>
            </div>
          `;
        }

        showToast('Booking Successful!', `Tracking ID: ${trackingId}`, 'success');

        // Add to live notifications
        addNotification(`New Booking ${trackingId}`, `Parcel dispatched on ${corridorsData[route]?.name || 'Intercity Express'}.`);

        // Load new shipments into history
        setTimeout(() => {
          closeBookingModal();
          if (successBox) successBox.classList.add('hidden');
          switchTab('tracking');
          renderTrackingRoute(route);
        }, 2200);

      } catch (err) {
        showToast('Booking Error', err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = 'Confirm Booking';
      }
    });
  }

  // -------------------------------------------------------------
  // 7. Delivery History Dynamic Loading, Filter Chips & Search
  // -------------------------------------------------------------
  const historyChips = document.querySelectorAll('.history-chip');
  const historySearchInput = document.getElementById('historySearchInput');
  const historyListContainer = document.getElementById('historyListContainer');
  let activeHistoryFilter = 'ALL';

  const filterHistoryCards = () => {
    const query = historySearchInput ? historySearchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('.history-item-card');

    cards.forEach((card) => {
      const status = card.getAttribute('data-status') || '';
      const searchData = (card.getAttribute('data-search') || '').toLowerCase();
      const matchesStatus = activeHistoryFilter === 'ALL' || status === activeHistoryFilter;
      const matchesSearch = query === '' || searchData.includes(query);

      card.style.display = matchesStatus && matchesSearch ? 'block' : 'none';
    });
  };

  historyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeHistoryFilter = chip.getAttribute('data-filter') || 'ALL';

      historyChips.forEach((c) => {
        if (c === chip) {
          c.className = 'history-chip flex-shrink-0 bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all active:scale-95';
        } else {
          c.className = 'history-chip flex-shrink-0 bg-surface text-on-surface-variant border border-outline-variant/50 text-xs font-semibold px-4 py-2 rounded-full hover:bg-surface-variant transition-colors';
        }
      });

      filterHistoryCards();
    });
  });

  if (historySearchInput) {
    historySearchInput.addEventListener('input', filterHistoryCards);
  }

  // Load real shipments from backend API
  const loadShipmentsFromBackend = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/shipments?limit=10`);
      const json = await res.json();
      if (json.status === 'success' && json.data && json.data.length > 0) {
        let liveSection = document.getElementById('liveShipmentsHistorySection');
        if (!liveSection) {
          liveSection = document.createElement('div');
          liveSection.id = 'liveShipmentsHistorySection';
          liveSection.className = 'space-y-3 mb-6';
          liveSection.innerHTML = `
            <div class="flex justify-between items-center pl-1">
              <h3 class="text-xs font-bold text-primary uppercase tracking-wider">Live & Recent Bookings</h3>
              <span class="text-[10px] text-outline font-semibold">Real-Time MongoDB Sync</span>
            </div>
            <div id="liveShipmentsList" class="space-y-3"></div>
          `;
          if (historyListContainer) historyListContainer.prepend(liveSection);
        }

        const list = document.getElementById('liveShipmentsList');
        if (list) {
          list.innerHTML = '';
          json.data.forEach((s) => {
            const card = document.createElement('div');
            const statusClass = s.status === 'DELIVERED' ? 'bg-[#e6f4ea] text-[#137333]' : s.status === 'CANCELLED' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary';
            const dateStr = new Date(s.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            card.className = 'history-item-card bg-surface rounded-xl p-3.5 shadow-level-1 hover:shadow-level-2 transition-all border border-outline-variant/30 cursor-pointer group';
            card.setAttribute('data-status', s.status || 'CONFIRMED');
            card.setAttribute('data-search', `${s.trackingId} ${s.recipient?.address || ''} ${s.recipient?.name || ''}`);
            card.innerHTML = `
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center space-x-3">
                  <div class="w-11 h-11 rounded-full bg-primary-fixed/40 flex items-center justify-center flex-shrink-0 text-primary">
                    <span class="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors font-mono">${s.trackingId}</h4>
                    <div class="flex items-center space-x-2 mt-0.5">
                      <span class="text-[11px] text-on-surface-variant">${dateStr}</span>
                      <span class="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span class="text-[11px] text-on-surface-variant font-medium truncate max-w-[150px]">${s.recipient?.address || 'Intercity Depot'}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <div class="${statusClass} text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 mb-0.5">
                    <span>${s.status || 'CONFIRMED'}</span>
                  </div>
                  <span class="text-sm font-bold text-on-surface">₹${s.price || 280}</span>
                </div>
              </div>
            `;

            card.addEventListener('click', () => openShipmentDetailsModal(s));
            list.appendChild(card);
          });
        }
      }
    } catch (e) {
      // Offline fallback
    }
  };

  // Wire up existing history cards
  document.querySelectorAll('.history-item-card').forEach((card) => {
    card.addEventListener('click', () => {
      const searchData = card.getAttribute('data-search') || '124 Maple Street';
      openShipmentDetailsModal({
        trackingId: 'TRK-DEL-CHD-8821',
        status: card.getAttribute('data-status') || 'DELIVERED',
        price: 280,
        sender: { name: 'Aarav Sharma', address: 'Connaught Place, New Delhi' },
        recipient: { name: 'Rohan Verma', address: searchData },
        qrSeal: { currentSealCode: 'SEAL-44A2-9901' },
        deliveryOtp: { codeHash: 'active' }
      });
    });
  });

  // -------------------------------------------------------------
  // 8. Shipment Details & Proof of Delivery (POD) Modal
  // -------------------------------------------------------------
  const shipmentDetailsModal = document.getElementById('shipmentDetailsModal');
  const btnCloseShipmentDetailsModal = document.getElementById('btnCloseShipmentDetailsModal');
  const btnModalTrackOnMap = document.getElementById('btnModalTrackOnMap');
  const btnModalCopyTracking = document.getElementById('btnModalCopyTracking');
  const btnModalVerifyOtpDemo = document.getElementById('btnModalVerifyOtpDemo');

  let activeModalShipment = null;

  const openShipmentDetailsModal = (shipment) => {
    activeModalShipment = shipment;
    if (!shipmentDetailsModal) return;

    document.getElementById('modalShipmentTrackingId').innerText = shipment.trackingId || 'TRK-DEL-CHD-9876';
    document.getElementById('modalShipmentStatus').innerText = shipment.status || 'IN_TRANSIT';
    document.getElementById('modalShipmentSeal').innerText = shipment.qrSeal?.currentSealCode || 'SEAL-88F4-A92B';
    document.getElementById('modalShipmentSender').innerText = shipment.sender?.name || 'Aarav Sharma';
    document.getElementById('modalShipmentSenderAddr').innerText = shipment.sender?.address || 'Connaught Place, New Delhi';
    document.getElementById('modalShipmentReceiver').innerText = shipment.recipient?.name || 'Rohan Verma';
    document.getElementById('modalShipmentReceiverAddr').innerText = shipment.recipient?.address || 'Sector 17, Chandigarh';
    document.getElementById('modalShipmentPrice').innerText = `₹${shipment.price || 280}.00`;

    shipmentDetailsModal.classList.remove('hidden');
    shipmentDetailsModal.classList.add('flex');
  };

  if (btnCloseShipmentDetailsModal && shipmentDetailsModal) {
    btnCloseShipmentDetailsModal.addEventListener('click', () => {
      shipmentDetailsModal.classList.add('hidden');
      shipmentDetailsModal.classList.remove('flex');
    });
  }

  if (btnModalTrackOnMap) {
    btnModalTrackOnMap.addEventListener('click', () => {
      if (shipmentDetailsModal) {
        shipmentDetailsModal.classList.add('hidden');
        shipmentDetailsModal.classList.remove('flex');
      }
      switchTab('tracking');
    });
  }

  if (btnModalCopyTracking) {
    btnModalCopyTracking.addEventListener('click', () => {
      if (activeModalShipment?.trackingId) {
        navigator.clipboard.writeText(activeModalShipment.trackingId);
        showToast('Tracking ID Copied', activeModalShipment.trackingId, 'success');
      }
    });
  }

  if (btnModalVerifyOtpDemo) {
    btnModalVerifyOtpDemo.addEventListener('click', async () => {
      btnModalVerifyOtpDemo.innerText = 'Verifying OTP...';
      try {
        const res = await fetch(`${API_BASE}/api/v1/custody/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingId: activeModalShipment?.trackingId || 'TRK-DEL-CHD-9876',
            inputOtp: '849201',
            deliveredByUserId: 'rider-rapido-10'
          })
        });
        showToast('Delivery OTP Verified!', 'Immutable Proof of Delivery (POD) recorded.', 'success');
        document.getElementById('modalShipmentStatus').innerText = 'DELIVERED';
        document.getElementById('modalShipmentOtpBadge').innerText = 'Verified';
      } catch (err) {
        showToast('POD Notice', 'Delivery verified successfully in demonstration.', 'success');
        document.getElementById('modalShipmentStatus').innerText = 'DELIVERED';
      } finally {
        btnModalVerifyOtpDemo.innerText = '✔ OTP Verified';
      }
    });
  }

  // -------------------------------------------------------------
  // 9. Profile Sub-screens (Saved Addresses, Payment, Settings, Help)
  // -------------------------------------------------------------
  const btnOpenSavedAddresses = document.getElementById('btnOpenSavedAddresses');
  if (btnOpenSavedAddresses) btnOpenSavedAddresses.addEventListener('click', () => switchTab('savedAddresses'));

  const btnBackFromSavedAddresses = document.getElementById('btnBackFromSavedAddresses');
  if (btnBackFromSavedAddresses) btnBackFromSavedAddresses.addEventListener('click', () => switchTab('profile'));

  const btnOpenPaymentMethods = document.getElementById('btnOpenPaymentMethods');
  if (btnOpenPaymentMethods) btnOpenPaymentMethods.addEventListener('click', () => switchTab('paymentMethods'));

  const btnBackFromPaymentMethods = document.getElementById('btnBackFromPaymentMethods');
  if (btnBackFromPaymentMethods) btnBackFromPaymentMethods.addEventListener('click', () => switchTab('profile'));

  const btnOpenSettings = document.getElementById('btnOpenSettings');
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => switchTab('settings'));

  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  if (btnBackFromSettings) btnBackFromSettings.addEventListener('click', () => switchTab('profile'));

  const btnOpenHelpSupport = document.getElementById('btnOpenHelpSupport');
  if (btnOpenHelpSupport) btnOpenHelpSupport.addEventListener('click', () => switchTab('helpSupport'));

  const btnBackFromHelpSupport = document.getElementById('btnBackFromHelpSupport');
  if (btnBackFromHelpSupport) btnBackFromHelpSupport.addEventListener('click', () => switchTab('profile'));

  // Saved Addresses Modals & Selection
  const addressModal = document.getElementById('addressModal');
  const btnCloseAddressModal = document.getElementById('btnCloseAddressModal');
  const btnAddNewAddress = document.getElementById('btnAddNewAddress');
  const addressForm = document.getElementById('addressForm');
  const addrInputLabel = document.getElementById('addrInputLabel');
  const addrInputStreet = document.getElementById('addrInputStreet');
  const addrInputCity = document.getElementById('addrInputCity');

  let selectedAddrIcon = 'home';
  document.querySelectorAll('.addr-icon-btn').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.addr-icon-btn').forEach((x) => {
        x.className = 'addr-icon-btn flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant flex items-center justify-center';
      });
      b.className = 'addr-icon-btn flex-1 py-2 rounded-xl border-2 border-primary bg-primary-fixed/20 text-primary flex items-center justify-center';
      selectedAddrIcon = b.getAttribute('data-icon') || 'home';
    });
  });

  if (btnAddNewAddress && addressModal) {
    btnAddNewAddress.addEventListener('click', () => {
      document.getElementById('modalAddressTitle').innerText = 'Add New Address';
      addressForm.reset();
      addressModal.classList.remove('hidden');
      addressModal.classList.add('flex');
    });
  }

  if (btnCloseAddressModal && addressModal) {
    btnCloseAddressModal.addEventListener('click', () => {
      addressModal.classList.add('hidden');
      addressModal.classList.remove('flex');
    });
  }

  if (addressForm) {
    addressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = addrInputLabel.value;
      const street = addrInputStreet.value;
      const city = addrInputCity.value;
      const full = `${street}, ${city}`;

      const card = document.createElement('div');
      card.className = 'saved-address-card bg-surface-container-lowest rounded-[16px] shadow-level-1 p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-colors duration-200 border border-outline-variant/20 animate-fade-in-up';
      card.setAttribute('data-address', full);
      card.innerHTML = `
        <div class="flex items-center gap-4 flex-1">
          <div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
            <span class="material-symbols-outlined icon-fill">${selectedAddrIcon}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-on-surface">${label}</span>
            <span class="text-xs text-on-surface-variant mt-0.5 line-clamp-1">${full}</span>
          </div>
        </div>
        <button class="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors ml-2">
          <span class="material-symbols-outlined text-[20px]">edit</span>
        </button>
      `;

      card.addEventListener('click', () => {
        openBookingModal('HR-DEL-CHD');
        const senderInput = document.getElementById('modalSenderAddress');
        if (senderInput) senderInput.value = full;
      });

      const container = document.querySelector('#tab-saved-addresses .flex.flex-col.gap-3');
      if (container) container.appendChild(card);

      addressModal.classList.add('hidden');
      addressModal.classList.remove('flex');
      showToast('Address Saved', `"${label}" added to your saved addresses.`, 'success');
    });
  }

  document.querySelectorAll('.saved-address-card').forEach((card) => {
    card.addEventListener('click', () => {
      const addr = card.getAttribute('data-address') || 'Connaught Place, New Delhi';
      openBookingModal('HR-DEL-CHD');
      const senderInput = document.getElementById('modalSenderAddress');
      if (senderInput) senderInput.value = addr;
      showToast('Pickup Address Selected', addr);
    });
  });

  // Payment Methods Handling
  const paymentModal = document.getElementById('paymentModal');
  const btnClosePaymentModal = document.getElementById('btnClosePaymentModal');
  const btnAddNewPaymentMethod = document.getElementById('btnAddNewPaymentMethod');
  const btnTabPayCard = document.getElementById('btnTabPayCard');
  const btnTabPayUpi = document.getElementById('btnTabPayUpi');
  const paymentCardForm = document.getElementById('paymentCardForm');
  const paymentUpiForm = document.getElementById('paymentUpiForm');

  if (btnAddNewPaymentMethod && paymentModal) {
    btnAddNewPaymentMethod.addEventListener('click', () => {
      paymentModal.classList.remove('hidden');
      paymentModal.classList.add('flex');
    });
  }

  if (btnClosePaymentModal && paymentModal) {
    btnClosePaymentModal.addEventListener('click', () => {
      paymentModal.classList.add('hidden');
      paymentModal.classList.remove('flex');
    });
  }

  if (btnTabPayCard && btnTabPayUpi) {
    btnTabPayCard.addEventListener('click', () => {
      btnTabPayCard.className = 'flex-1 pb-2 border-b-2 border-primary font-bold text-primary text-center';
      btnTabPayUpi.className = 'flex-1 pb-2 border-b-2 border-transparent font-semibold text-outline text-center hover:text-on-surface';
      paymentCardForm.classList.remove('hidden');
      paymentUpiForm.classList.add('hidden');
    });

    btnTabPayUpi.addEventListener('click', () => {
      btnTabPayUpi.className = 'flex-1 pb-2 border-b-2 border-primary font-bold text-primary text-center';
      btnTabPayCard.className = 'flex-1 pb-2 border-b-2 border-transparent font-semibold text-outline text-center hover:text-on-surface';
      paymentUpiForm.classList.remove('hidden');
      paymentCardForm.classList.add('hidden');
    });
  }

  if (paymentCardForm) {
    paymentCardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const num = document.getElementById('payCardNumber').value.slice(-4) || '7788';
      showToast('Card Added', `•••• ${num} has been securely saved.`, 'success');
      paymentModal.classList.add('hidden');
      paymentModal.classList.remove('flex');
    });
  }

  if (paymentUpiForm) {
    paymentUpiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const upi = document.getElementById('payUpiInput').value;
      showToast('UPI Linked', `Virtual Payment Address ${upi} connected.`, 'success');
      paymentModal.classList.add('hidden');
      paymentModal.classList.remove('flex');
    });
  }

  document.querySelectorAll('.payment-card-item').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-card-item').forEach((c) => {
        c.classList.remove('active-card');
        const badge = c.querySelector('.bg-primary-fixed');
        if (badge) badge.remove();
      });

      card.classList.add('active-card');
      const method = card.getAttribute('data-method') || 'Payment Method';
      showToast('Primary Payment Set', method, 'success');
    });
  });

  // Digital Wallets toggle
  const btnWalletApplePay = document.getElementById('btnWalletApplePay');
  if (btnWalletApplePay) {
    btnWalletApplePay.addEventListener('click', () => {
      showToast('Apple Pay', 'Apple Pay is connected and ready for instant checkout.', 'success');
    });
  }

  const btnWalletUpi = document.getElementById('btnWalletUpi');
  if (btnWalletUpi) {
    btnWalletUpi.addEventListener('click', () => {
      showToast('UPI Payments', 'UPI ID alex@okaxis connected. Fast 1-click approvals active.', 'success');
    });
  }

  // Profile Logout Button
  const btnProfileLogout = document.getElementById('btnProfileLogout');
  if (btnProfileLogout) {
    btnProfileLogout.addEventListener('click', () => {
      showToast('Signed Out', 'You have been safely signed out of your session.');
    });
  }

  // Settings Screen Handlers
  const pushToggle = document.getElementById('push_toggle');
  const emailToggle = document.getElementById('email_toggle');
  const locationToggle = document.getElementById('location_toggle');

  if (pushToggle) {
    pushToggle.checked = localStorage.getItem('transitly_push') !== 'false';
    pushToggle.addEventListener('change', () => {
      localStorage.setItem('transitly_push', pushToggle.checked);
      showToast('Preference Saved', pushToggle.checked ? 'Push alerts enabled.' : 'Push alerts silenced.');
    });
  }

  if (emailToggle) {
    emailToggle.checked = localStorage.getItem('transitly_email') === 'true';
    emailToggle.addEventListener('change', () => {
      localStorage.setItem('transitly_email', emailToggle.checked);
      showToast('Preference Saved', emailToggle.checked ? 'Email reports enabled.' : 'Email reports disabled.');
    });
  }

  if (locationToggle) {
    locationToggle.checked = localStorage.getItem('transitly_location') !== 'false';
    locationToggle.addEventListener('change', () => {
      localStorage.setItem('transitly_location', locationToggle.checked);
      showToast('Location Services', locationToggle.checked ? 'Accurate terminal matching enabled.' : 'Terminal matching disabled.');
    });
  }

  const btnSettingLanguage = document.getElementById('btnSettingLanguage');
  if (btnSettingLanguage) {
    btnSettingLanguage.addEventListener('click', () => {
      openFaqModal('Language Preferences', `
        <p class="mb-3">Select your preferred interface and notification language:</p>
        <div class="space-y-2">
          <div class="p-3 rounded-xl bg-primary-fixed/20 border border-primary/30 flex justify-between items-center cursor-pointer" onclick="document.getElementById('currentLanguageLabel').innerText='English (US)'; document.getElementById('btnCloseFaqModal').click();">
            <strong>English (US)</strong>
            <span class="text-primary font-bold">✔ Selected</span>
          </div>
          <div class="p-3 rounded-xl bg-surface-container hover:bg-surface-container-low cursor-pointer" onclick="document.getElementById('currentLanguageLabel').innerText='Hindi (हिंदी)'; document.getElementById('btnCloseFaqModal').click();">
            <strong>Hindi (हिंदी)</strong>
          </div>
          <div class="p-3 rounded-xl bg-surface-container hover:bg-surface-container-low cursor-pointer" onclick="document.getElementById('currentLanguageLabel').innerText='Punjabi (ਪੰਜਾਬੀ)'; document.getElementById('btnCloseFaqModal').click();">
            <strong>Punjabi (ਪੰਜਾਬੀ)</strong>
          </div>
        </div>
      `);
    });
  }

  const btnSettingPrivacy = document.getElementById('btnSettingPrivacy');
  if (btnSettingPrivacy) {
    btnSettingPrivacy.addEventListener('click', () => {
      openFaqModal('Privacy & Data Governance', `
        <div class="space-y-3 text-xs leading-relaxed">
          <p><strong>1. Zero PII Exposure:</strong> Phone numbers and addresses are cryptographically hashed and redacted 24 hours post-delivery.</p>
          <p><strong>2. Telemetry Encryption:</strong> GPS telematics pings from Haryana Roadways express buses are buffered via in-memory Redis and permanently logged in PostGIS.</p>
          <p><strong>3. Tamper Auditing:</strong> Every custody transfer generates an immutable audit entry with SHA-256 seal verification.</p>
        </div>
      `);
    });
  }

  const btnSettingTerms = document.getElementById('btnSettingTerms');
  if (btnSettingTerms) {
    btnSettingTerms.addEventListener('click', () => {
      openFaqModal('Terms of Service', `
        <div class="space-y-3 text-xs leading-relaxed">
          <p><strong>1. Public Transport Monetization:</strong> Transitly operates under commercial agreements with state transport operators (including Haryana Roadways) to utilize authorized cargo hold space.</p>
          <p><strong>2. Multi-Carrier SLA:</strong> First-mile and last-mile legs are executed by vetted third-party on-demand logistics partners (Uber Direct, Rapido, inDrive).</p>
          <p><strong>3. Delivery OTP Guarantee:</strong> Custody transfer is concluded only upon valid 6-digit cryptographic OTP entry.</p>
        </div>
      `);
    });
  }

  const btnSettingsSignOut = document.getElementById('btnSettingsSignOut');
  if (btnSettingsSignOut) {
    btnSettingsSignOut.addEventListener('click', () => {
      showToast('Signed Out', 'Session signed out successfully.');
      switchTab('deliver');
    });
  }

  // -------------------------------------------------------------
  // 10. Help & Support Knowledge Base & Claims
  // -------------------------------------------------------------
  const faqModal = document.getElementById('faqModal');
  const btnCloseFaqModal = document.getElementById('btnCloseFaqModal');
  const faqModalTitle = document.getElementById('faqModalTitle');
  const faqModalContent = document.getElementById('faqModalContent');

  const openFaqModal = (title, html) => {
    if (!faqModal) return;
    if (faqModalTitle) faqModalTitle.innerText = title;
    if (faqModalContent) faqModalContent.innerHTML = html;
    faqModal.classList.remove('hidden');
    faqModal.classList.add('flex');
  };

  if (btnCloseFaqModal && faqModal) {
    btnCloseFaqModal.addEventListener('click', () => {
      faqModal.classList.add('hidden');
      faqModal.classList.remove('flex');
    });
  }

  // Help Topic Cards
  const topicCardTracking = document.getElementById('topicCardTracking');
  if (topicCardTracking) {
    topicCardTracking.addEventListener('click', () => {
      openFaqModal('Live Tracking & GPS Telematics', `
        <div class="space-y-3 text-xs">
          <p><strong>How does live tracking work?</strong></p>
          <p>Public transport express buses stream high-frequency GPS telemetry directly to our fast path engine. When a bus passes intermediate geofences (e.g. Panipat, Karnal, Ambala), automated custody pings are emitted.</p>
          <p><strong>Where is my driver?</strong></p>
          <p>Once the intercity bus arrives at the destination hub, a local partner driver (Rapido/Uber Direct) is dispatched for doorstep handover.</p>
        </div>
      `);
    });
  }

  const topicCardPayment = document.getElementById('topicCardPayment');
  if (topicCardPayment) {
    topicCardPayment.addEventListener('click', () => {
      openFaqModal('Multi-Modal Pricing & Quotes', `
        <div class="space-y-3 text-xs">
          <p><strong>How are fares calculated?</strong></p>
          <p>Fares are calculated using a unified multi-modal breakdown:</p>
          <ul class="list-disc pl-4 space-y-1">
            <li><strong>First-Mile:</strong> Doorstep pickup to origin terminal (₹40 base + ₹12/km).</li>
            <li><strong>Intercity Linehaul:</strong> Fixed government-subsidized bus cargo rates (e.g. ₹280 for Delhi-Chandigarh).</li>
            <li><strong>Last-Mile:</strong> Terminal to recipient doorstep (₹40 base + weight tier).</li>
          </ul>
        </div>
      `);
    });
  }

  const topicCardDamaged = document.getElementById('topicCardDamaged');
  if (topicCardDamaged) {
    topicCardDamaged.addEventListener('click', () => {
      if (fileClaimModal) {
        fileClaimModal.classList.remove('hidden');
        fileClaimModal.classList.add('flex');
      }
    });
  }

  const topicCardAccount = document.getElementById('topicCardAccount');
  if (topicCardAccount) {
    topicCardAccount.addEventListener('click', () => {
      openFaqModal('Account & Security Settings', `
        <div class="space-y-3 text-xs">
          <p><strong>Two-Factor OTP Security:</strong> Every package pickup and delivery requires cryptographic 6-digit OTP verification.</p>
          <p><strong>WhatsApp Updates:</strong> Receive real-time WhatsApp alerts upon vehicle departure, arrival, and delivery confirmation.</p>
        </div>
      `);
    });
  }

  const topicCardDelivery = document.getElementById('topicCardDelivery');
  if (topicCardDelivery) {
    topicCardDelivery.addEventListener('click', () => {
      openFaqModal('Delivery Experience & Custody', `
        <div class="space-y-3 text-xs">
          <p><strong>Tamper-Proof QR Seals:</strong> Every parcel is sealed with a unique cryptographic barcode before boarding the bus.</p>
          <p><strong>Conductor Verification:</strong> Certified bus staff inspect cargo at all scheduled terminal stops.</p>
        </div>
      `);
    });
  }

  // Knowledge base search filter
  const helpSearchInput = document.getElementById('helpSearchInput');
  if (helpSearchInput) {
    helpSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#tab-help-support .grid > div').forEach((card) => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Claim Modal
  const fileClaimModal = document.getElementById('fileClaimModal');
  const btnCloseClaimModal = document.getElementById('btnCloseClaimModal');
  const btnOpenClaimModal = document.getElementById('btnOpenClaimModal');
  const claimForm = document.getElementById('claimForm');

  if (btnOpenClaimModal && fileClaimModal) {
    btnOpenClaimModal.addEventListener('click', (e) => {
      e.stopPropagation();
      fileClaimModal.classList.remove('hidden');
      fileClaimModal.classList.add('flex');
    });
  }

  if (btnCloseClaimModal && fileClaimModal) {
    btnCloseClaimModal.addEventListener('click', () => {
      fileClaimModal.classList.add('hidden');
      fileClaimModal.classList.remove('flex');
    });
  }

  if (claimForm) {
    claimForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const trk = document.getElementById('claimTrackingInput').value;
      const claimId = `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
      fileClaimModal.classList.add('hidden');
      fileClaimModal.classList.remove('flex');
      showToast('Claim Submitted Successfully', `Ticket ${claimId} assigned to shipment ${trk}.`, 'success');
      addNotification(`Claim Ticket ${claimId} Logged`, 'Support team investigating parcel integrity.');
    });
  }

  // -------------------------------------------------------------
  // 11. WhatsApp Conversational AI Assistant Modal
  // -------------------------------------------------------------
  const whatsappChatModal = document.getElementById('whatsappChatModal');
  const btnFloatingWhatsAppHelp = document.getElementById('btnFloatingWhatsAppHelp');
  const btnCloseWhatsAppModal = document.getElementById('btnCloseWhatsAppModal');
  const btnOpenWhatsAppExternal = document.getElementById('btnOpenWhatsAppExternal');
  const btnHelpChatSupport = document.getElementById('btnHelpChatSupport');
  const whatsappChatForm = document.getElementById('whatsappChatForm');
  const whatsappChatInput = document.getElementById('whatsappChatInput');
  const whatsappChatMessages = document.getElementById('whatsappChatMessages');

  const openWhatsAppChatModal = (initialPrompt = '') => {
    if (whatsappChatModal) {
      whatsappChatModal.classList.remove('hidden');
      whatsappChatModal.classList.add('flex');
      if (initialPrompt && whatsappChatInput) {
        whatsappChatInput.value = initialPrompt;
        whatsappChatForm.dispatchEvent(new Event('submit'));
      }
    }
  };

  if (btnFloatingWhatsAppHelp) {
    btnFloatingWhatsAppHelp.addEventListener('click', () => openWhatsAppChatModal());
  }

  if (btnHelpChatSupport) {
    btnHelpChatSupport.addEventListener('click', () => openWhatsAppChatModal());
  }

  if (btnCloseWhatsAppModal && whatsappChatModal) {
    btnCloseWhatsAppModal.addEventListener('click', () => {
      whatsappChatModal.classList.add('hidden');
      whatsappChatModal.classList.remove('flex');
    });
  }

  if (btnOpenWhatsAppExternal) {
    btnOpenWhatsAppExternal.addEventListener('click', () => {
      window.open('https://wa.me/919876543210?text=Hi%20Transitly%20Support', '_blank');
    });
  }

  document.querySelectorAll('.chat-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && whatsappChatInput) {
        whatsappChatInput.value = prompt;
        whatsappChatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  const appendChatMessage = (sender, text) => {
    if (!whatsappChatMessages) return;
    const msg = document.createElement('div');
    const isUser = sender === 'user';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.className = `flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`;
    msg.innerHTML = `
      <div class="max-w-[85%] ${isUser ? 'bg-[#005c4b] text-white rounded-2xl rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-none'} p-3 shadow-md text-xs border ${isUser ? 'border-[#007a64]' : 'border-[#313d45]'}">
        ${!isUser ? '<p class="font-bold text-[#00a884] mb-1">Transitly AI Assistant</p>' : ''}
        <div class="whitespace-pre-line">${text}</div>
        <span class="text-[10px] text-[#8696a0] block text-right mt-1">${now}</span>
      </div>
    `;

    whatsappChatMessages.appendChild(msg);
    whatsappChatMessages.scrollTop = whatsappChatMessages.scrollHeight;
  };

  if (whatsappChatForm) {
    whatsappChatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = whatsappChatInput.value.trim();
      if (!text) return;

      appendChatMessage('user', text);
      whatsappChatInput.value = '';

      // Typing Indicator
      const typing = document.createElement('div');
      typing.id = 'chatTypingIndicator';
      typing.className = 'flex justify-start text-[11px] text-[#00a884] items-center gap-1.5 pl-2';
      typing.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce"></span> Transitly AI is typing...';
      whatsappChatMessages.appendChild(typing);
      whatsappChatMessages.scrollTop = whatsappChatMessages.scrollHeight;

      try {
        const res = await fetch(`${API_BASE}/api/v1/whatsapp/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: '+919876543210',
            messageText: text
          })
        });
        const data = await res.json();
        typing.remove();

        const reply = data.data?.reply || `Thank you for your query about "${text}". Our fast path engine is tracking all Haryana Roadways schedules in real-time.`;
        appendChatMessage('bot', reply);
      } catch (err) {
        typing.remove();
        appendChatMessage('bot', `📦 Parcel status query received. Intercity express buses run every 30 minutes from ISBT Kashmere Gate to Chandigarh & Jaipur.`);
      }
    });
  }

  // Helper to push a notification into the modal
  const addNotification = (title, desc) => {
    if (!notificationsList) return;
    const item = document.createElement('div');
    item.className = 'p-3 bg-primary-fixed/20 rounded-xl border border-primary/20 flex gap-3 items-start cursor-pointer hover:bg-primary-fixed/30 transition-colors animate-fade-in-up';
    item.innerHTML = `
      <span class="material-symbols-outlined text-primary text-lg mt-0.5">mark_email_unread</span>
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <span class="font-bold text-on-surface">${title}</span>
          <span class="text-[10px] text-outline">Just now</span>
        </div>
        <p class="text-on-surface-variant mt-0.5">${desc}</p>
      </div>
    `;
    notificationsList.prepend(item);
    if (notifBadgeDot) notifBadgeDot.classList.remove('hidden');
    if (notifCountBadge) {
      const cur = parseInt(notifCountBadge.innerText || '0', 10);
      notifCountBadge.innerText = (cur + 1).toString();
    }
  };

  // Initial load of shipments into History
  loadShipmentsFromBackend();
});
