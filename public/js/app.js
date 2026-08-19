/**
 * Transitly — Instant Multi-Screen Experience & Telematics Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = (window.location.port === '3000' || window.location.port === '') ? '' : 'http://localhost:3000';

  // -------------------------------------------------------------
  // 1. Tab Router (Deliver, Tracking, Services, History, Profile, Sub-screens)
  // -------------------------------------------------------------
  const tabViews = {
    deliver: document.getElementById('tab-deliver'),
    tracking: document.getElementById('tab-tracking'),
    services: document.getElementById('tab-services'),
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
    services: document.getElementById('navBtnServices'),
    history: document.getElementById('navBtnHistory'),
    profile: document.getElementById('navBtnProfile')
  };

  const desktopNavBtns = document.querySelectorAll('.desktop-nav-btn');
  const mainBottomNav = document.getElementById('mainBottomNav');
  const mainAppHeader = document.getElementById('mainAppHeader');

  window.switchTab = (tabKey) => {
    // Instant tab toggle with zero DOM latency
    Object.keys(tabViews).forEach((key) => {
      const el = tabViews[key];
      if (el) {
        if (key === tabKey) {
          el.classList.add('active');
          if (key === 'tracking') {
            el.classList.add('flex-tab');
          }
        } else {
          el.classList.remove('active');
          el.classList.remove('flex-tab');
        }
      }
    });

    // Sub-screen Navigation Shell Visibility
    const isSubScreen = ['savedAddresses', 'paymentMethods', 'settings', 'helpSupport'].includes(tabKey);
    if (isSubScreen) {
      if (mainBottomNav) mainBottomNav.style.display = 'none';
      if (mainAppHeader) mainAppHeader.style.display = 'none';
    } else {
      if (mainBottomNav) mainBottomNav.style.display = '';
      if (mainAppHeader) mainAppHeader.style.display = '';
    }

    // Mobile Bottom Navigation Buttons Active State
    Object.keys(navBtns).forEach((key) => {
      const btn = navBtns[key];
      if (btn) {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (key === tabKey) {
          btn.className = 'nav-tab-btn flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-2 py-1 transition-all active:scale-90 w-1/5 shadow-sm';
          if (icon) icon.setAttribute('data-weight', 'fill');
        } else {
          btn.className = 'nav-tab-btn flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:bg-surface-variant rounded-xl transition-all active:scale-90 w-1/5';
          if (icon) icon.removeAttribute('data-weight');
        }
      }
    });

    // Desktop Header Navigation Buttons Active State
    desktopNavBtns.forEach((btn) => {
      const target = btn.getAttribute('data-tab');
      if (target === tabKey) {
        btn.className = 'desktop-nav-btn px-3.5 py-1.5 rounded-full text-xs font-bold text-primary bg-primary-fixed/50 transition-all flex items-center gap-1.5 shadow-sm';
      } else {
        btn.className = 'desktop-nav-btn px-3.5 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:bg-surface-variant transition-all flex items-center gap-1.5';
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (tabKey === 'tracking' && map) {
      setTimeout(() => {
        map.invalidateSize();
        if (routeLine) map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
      }, 100);
    }
  };

  // Bind Mobile Navs
  if (navBtns.deliver) navBtns.deliver.addEventListener('click', () => switchTab('deliver'));
  if (navBtns.tracking) navBtns.tracking.addEventListener('click', () => switchTab('tracking'));
  if (navBtns.services) navBtns.services.addEventListener('click', () => switchTab('services'));
  if (navBtns.history) navBtns.history.addEventListener('click', () => switchTab('history'));
  if (navBtns.profile) navBtns.profile.addEventListener('click', () => switchTab('profile'));

  // Bind Desktop Navs
  desktopNavBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  const btnHeaderMenu = document.getElementById('btnHeaderMenu');
  if (btnHeaderMenu) btnHeaderMenu.addEventListener('click', () => switchTab('deliver'));

  // Sub-screen Navigation triggers
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

  // Address Selection
  document.querySelectorAll('.saved-address-card').forEach((card) => {
    card.addEventListener('click', () => {
      const addr = card.getAttribute('data-address');
      openBookingModal('HR-DEL-CHD');
      const senderInput = document.getElementById('modalSenderAddress');
      if (senderInput) senderInput.value = addr;
    });
  });

  const btnAddNewAddress = document.getElementById('btnAddNewAddress');
  if (btnAddNewAddress) {
    btnAddNewAddress.addEventListener('click', () => {
      const title = prompt('Enter address label (e.g. Office, Parent House):');
      if (title) {
        const fullAddr = prompt('Enter full address:');
        if (fullAddr) alert(`Address "${title}" saved successfully!`);
      }
    });
  }

  // Payment Selection
  document.querySelectorAll('.payment-card-item').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-card-item').forEach((c) => c.classList.remove('active-card'));
      card.classList.add('active-card');
      const method = card.getAttribute('data-method');
      alert(`Primary payment method set to: ${method}`);
    });
  });

  const btnAddNewPaymentMethod = document.getElementById('btnAddNewPaymentMethod');
  if (btnAddNewPaymentMethod) {
    btnAddNewPaymentMethod.addEventListener('click', () => {
      const type = prompt('Enter payment type (1 for Card, 2 for UPI):', '1');
      if (type === '1') {
        const num = prompt('Enter last 4 digits of card:');
        if (num) alert(`Card •••• ${num} added successfully!`);
      } else if (type === '2') {
        const upi = prompt('Enter UPI ID:');
        if (upi) alert(`UPI ID ${upi} linked successfully!`);
      }
    });
  }

  // WhatsApp Support Helpers
  const triggerWhatsApp = (msg) => {
    const query = encodeURIComponent(msg || 'Hi Transitly Support, I need assistance.');
    window.open(`https://wa.me/919876543210?text=${query}`, '_blank');
  };

  const btnHelpChatSupport = document.getElementById('btnHelpChatSupport');
  if (btnHelpChatSupport) btnHelpChatSupport.addEventListener('click', () => triggerWhatsApp('Hi Transitly, I have a question about my parcels.'));

  const btnFloatingWhatsAppHelp = document.getElementById('btnFloatingWhatsAppHelp');
  if (btnFloatingWhatsAppHelp) btnFloatingWhatsAppHelp.addEventListener('click', () => triggerWhatsApp('Hi Transitly Assistant, I want to track parcel TRK-DEL-JAI-9876'));

  // -------------------------------------------------------------
  // 2. Booking Modal Controls
  // -------------------------------------------------------------
  const bookingModal = document.getElementById('bookingModal');
  const btnHeroBookNow = document.getElementById('btnHeroBookNow');
  const btnCloseBookingModal = document.getElementById('btnCloseBookingModal');

  window.openBookingModal = (defaultRoute = 'HR-DEL-CHD') => {
    if (bookingModal) {
      const select = document.getElementById('modalRouteSelect');
      if (select) select.value = defaultRoute;
      bookingModal.classList.remove('hidden');
      bookingModal.classList.add('flex');
    }
  };

  window.closeBookingModal = () => {
    if (bookingModal) {
      bookingModal.classList.remove('flex');
      bookingModal.classList.add('hidden');
    }
  };

  if (btnHeroBookNow) btnHeroBookNow.addEventListener('click', () => openBookingModal());
  if (btnCloseBookingModal) btnCloseBookingModal.addEventListener('click', closeBookingModal);

  document.querySelectorAll('.corridor-quick-pick').forEach((card) => {
    card.addEventListener('click', () => {
      const route = card.getAttribute('data-route');
      openBookingModal(route);
    });
  });

  const btnQuickSearch = document.getElementById('btnQuickSearch');
  if (btnQuickSearch) {
    btnQuickSearch.addEventListener('click', () => {
      const homeInput = document.getElementById('homeSearchInput');
      const val = homeInput ? homeInput.value.trim() : '';
      if (val.toUpperCase().startsWith('TRK-')) {
        searchByTrackingId(val);
      } else {
        openBookingModal();
      }
    });
  }

  // Allow enter key in home search input
  const homeSearchInput = document.getElementById('homeSearchInput');
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = homeSearchInput.value.trim();
        if (val.toUpperCase().startsWith('TRK-')) {
          searchByTrackingId(val);
        } else {
          openBookingModal();
        }
      }
    });
  }

  // Feasibility Check
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

  // Booking Submit
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
        if (successBox) {
          successBox.classList.remove('hidden');
          successBox.innerHTML = `
            🎉 <strong>Booking Confirmed!</strong><br>
            Tracking ID: <span class="font-mono">${data.data.shipment.trackingId}</span>
          `;
          setTimeout(() => {
            closeBookingModal();
            switchTab('tracking');
          }, 1500);
        }
      } catch (err) {
        alert('Booking confirmed in test simulation.');
        closeBookingModal();
        switchTab('tracking');
      } finally {
        btn.disabled = false;
        btn.innerText = 'Confirm Booking';
      }
    });
  }

  // -------------------------------------------------------------
  // 3. Delivery History Filters
  // -------------------------------------------------------------
  const historyChips = document.querySelectorAll('.history-chip');
  const historyCards = document.querySelectorAll('.history-item-card');
  const historySearchInput = document.getElementById('historySearchInput');
  let activeHistoryFilter = 'ALL';

  const filterHistory = () => {
    const query = historySearchInput ? historySearchInput.value.toLowerCase().trim() : '';
    historyCards.forEach((card) => {
      const status = card.getAttribute('data-status');
      const searchData = (card.getAttribute('data-search') || '').toLowerCase();
      const matchesStatus = activeHistoryFilter === 'ALL' || status === activeHistoryFilter;
      const matchesSearch = query === '' || searchData.includes(query);
      card.style.display = (matchesStatus && matchesSearch) ? 'block' : 'none';
    });
  };

  historyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeHistoryFilter = chip.getAttribute('data-filter');
      historyChips.forEach((c) => {
        if (c === chip) {
          c.className = 'history-chip shrink-0 bg-primary text-on-primary text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm';
        } else {
          c.className = 'history-chip shrink-0 bg-surface text-on-surface-variant border border-outline-variant/50 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-surface-variant';
        }
      });
      filterHistory();
    });
  });

  if (historySearchInput) historySearchInput.addEventListener('input', filterHistory);
  historyCards.forEach((card) => card.addEventListener('click', () => switchTab('tracking')));

  // -------------------------------------------------------------
  // 4. Live Telematics & Leaflet Map
  // -------------------------------------------------------------
  const corridorsData = {
    'HR-DEL-CHD': {
      busNumber: '#402',
      vehicle: 'HR-55-AB-1234',
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
    'HR-DEL-NRN': {
      busNumber: '#205',
      vehicle: 'HR-24-GH-3456',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '07:00 PM' },
        { name: 'Dhaula Kuan Transit Hub', lat: 28.5921, lon: 77.1610, time: '07:30 PM' },
        { name: 'IFFCO Chowk, Gurgaon', lat: 28.4720, lon: 77.0725, time: '08:00 PM' },
        { name: 'Manesar Depot', lat: 28.3580, lon: 76.9380, time: '08:35 PM' },
        { name: 'Rewari Bus Stand', lat: 28.1920, lon: 76.6180, time: '09:40 PM' },
        { name: 'Narnaul Central Depot', lat: 28.0430, lon: 76.1080, time: '10:50 PM' }
      ]
    },
    'HR-DEL-SRS': {
      busNumber: '#318',
      vehicle: 'HR-39-EF-9012',
      stops: [
        { name: 'Tikri Border', lat: 28.6920, lon: 76.9650, time: '06:00 PM' },
        { name: 'Rohtak Bus Stand', lat: 28.8955, lon: 76.6066, time: '07:05 PM' },
        { name: 'Hansi Bus Stand', lat: 29.1020, lon: 75.9620, time: '08:25 PM' },
        { name: 'Hisar Central Depot', lat: 29.1539, lon: 75.7229, time: '09:00 PM' },
        { name: 'Sirsa Central Stand', lat: 29.5340, lon: 75.0280, time: '10:55 PM' }
      ]
    },
    'HR-GGN-HDL': {
      busNumber: '#112',
      vehicle: 'HR-55-AB-1234',
      stops: [
        { name: 'Gurgaon Central Stand', lat: 28.4595, lon: 77.0266, time: '04:00 PM' },
        { name: 'Faridabad NIT Depot', lat: 28.3980, lon: 77.3060, time: '04:40 PM' },
        { name: 'Palwal Central Hub', lat: 28.1430, lon: 77.3320, time: '05:35 PM' },
        { name: 'Hodal Border Terminal', lat: 27.8920, lon: 77.3710, time: '06:10 PM' }
      ]
    },
    'HR-CHD-YMN': {
      busNumber: '#504',
      vehicle: 'HR-01-IJ-7890',
      stops: [
        { name: 'ISBT Sector 17, Chandigarh', lat: 30.7410, lon: 76.7790, time: '09:00 AM' },
        { name: 'Ambala City Hub', lat: 30.3780, lon: 76.7760, time: '09:50 AM' },
        { name: 'Yamunanagar Central Stand', lat: 30.1290, lon: 77.2670, time: '11:00 AM' }
      ]
    },
    'TR-DEL-JAI': {
      busNumber: '#108',
      vehicle: 'DL-01-AB-1234',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '08:30 PM' },
        { name: 'IFFCO Chowk, Gurgaon', lat: 28.4720, lon: 77.0725, time: '09:15 PM' },
        { name: 'Behror Mid-way Hub', lat: 27.8920, lon: 76.2840, time: '10:35 PM' },
        { name: 'Sindhi Camp, Jaipur', lat: 26.9124, lon: 75.7873, time: '11:45 PM' }
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
      weight: 4,
      opacity: 0.9,
      lineCap: 'round'
    }).addTo(map);

    stops.forEach((stop, idx) => {
      const isOrigin = idx === 0;
      const isDest = idx === stops.length - 1;
      const markerColor = isOrigin ? '#128C55' : isDest ? '#ba1a1a' : '#5c5f61';

      const icon = L.divIcon({
        className: 'custom-stop-icon',
        html: `<div style="background:${markerColor}; border:2px solid #fff; border-radius:50%; width:16px; height:16px; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const m = L.marker([stop.lat, stop.lon], { icon }).addTo(map);
      m.bindPopup(`<strong>${stop.name}</strong><br>Scheduled: ${stop.time}`);
      stopMarkers.push(m);
    });

    const curr = stops[currentStopIdx];
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(0,102,255,0.25); animation:radar-pulse-anim 2s infinite;"></div>
          <div style="width:32px; height:32px; border-radius:50%; background:#0050cb; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(0,102,255,0.6); font-size:15px; color:#fff;">
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

    const trackStatusTitle = document.getElementById('trackStatusTitle');
    if (trackStatusTitle) trackStatusTitle.innerText = `In Transit via Bus ${route.busNumber}`;

    const trackHandoffText = document.getElementById('trackHandoffText');
    if (trackHandoffText) trackHandoffText.innerText = `${curr.name} to Rapido Rider`;

    const timelineActiveStopTitle = document.getElementById('timelineActiveStopTitle');
    if (timelineActiveStopTitle) timelineActiveStopTitle.innerText = `In Transit – Bus ${route.busNumber}`;

    const timelineActiveStopSub = document.getElementById('timelineActiveStopSub');
    if (timelineActiveStopSub) timelineActiveStopSub.innerText = `Currently near ${curr.name}`;
  };

  renderTrackingRoute(activeRouteKey);

  // Tracking ID to Corridor Catalog Mapping
  const trackingIdCatalog = {
    'TRK-DEL-CHD-402': { corridor: 'HR-DEL-CHD', status: 'In Transit', carrier: 'Rapido Express', stopIdx: 3 },
    'TRK-DEL-JAI-108': { corridor: 'TR-DEL-JAI', status: 'In Transit', carrier: 'Uber Direct', stopIdx: 2 },
    'TRK-DEL-SRS-318': { corridor: 'HR-DEL-SRS', status: 'Departed Hub', carrier: 'inDrive', stopIdx: 2 },
    'TRK-DEL-NRN-205': { corridor: 'HR-DEL-NRN', status: 'In Transit', carrier: 'CitySprint', stopIdx: 3 },
    'TRK-GGN-HDL-112': { corridor: 'HR-GGN-HDL', status: 'Scheduled', carrier: 'Rapido Express', stopIdx: 1 },
    'TRK-CHD-YMN-504': { corridor: 'HR-CHD-YMN', status: 'In Transit', carrier: 'Uber Direct', stopIdx: 1 }
  };

  window.searchByTrackingId = (rawId) => {
    if (!rawId) return;
    const tid = rawId.trim().toUpperCase();

    // Find direct or fuzzy matching corridor
    let match = trackingIdCatalog[tid];
    let matchedCorridor = 'HR-DEL-CHD';

    if (match) {
      matchedCorridor = match.corridor;
      if (match.stopIdx !== undefined) currentStopIdx = match.stopIdx;
    } else {
      // Fuzzy corridor inference from ID substring
      if (tid.includes('JAI')) matchedCorridor = 'TR-DEL-JAI';
      else if (tid.includes('SRS') || tid.includes('SIRSA')) matchedCorridor = 'HR-DEL-SRS';
      else if (tid.includes('NRN') || tid.includes('NARNAUL')) matchedCorridor = 'HR-DEL-NRN';
      else if (tid.includes('HDL') || tid.includes('HODAL') || tid.includes('GGN')) matchedCorridor = 'HR-GGN-HDL';
      else if (tid.includes('YMN') || tid.includes('YAMUNA')) matchedCorridor = 'HR-CHD-YMN';
      else matchedCorridor = 'HR-DEL-CHD';
    }

    // Update UI Elements
    const trackedIdDisplay = document.getElementById('trackedIdDisplay');
    if (trackedIdDisplay) trackedIdDisplay.innerText = tid;

    const inputTrackingId = document.getElementById('inputTrackingId');
    if (inputTrackingId) inputTrackingId.value = tid;

    const trackingDropdown = document.getElementById('trackingCorridorDropdown');
    if (trackingDropdown) trackingDropdown.value = matchedCorridor;

    // Render corresponding route and center map
    renderTrackingRoute(matchedCorridor);

    // Switch to Tracking tab
    switchTab('tracking');
  };

  // Form submit handler
  const trackingIdSearchForm = document.getElementById('trackingIdSearchForm');
  if (trackingIdSearchForm) {
    trackingIdSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('inputTrackingId');
      if (input && input.value) {
        searchByTrackingId(input.value);
      }
    });
  }

  // Sample chip clicks
  document.querySelectorAll('.sample-track-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const tid = chip.getAttribute('data-tid');
      if (tid) searchByTrackingId(tid);
    });
  });

  const trackingDropdown = document.getElementById('trackingCorridorDropdown');
  if (trackingDropdown) {
    trackingDropdown.addEventListener('change', (e) => {
      const routeKey = e.target.value;
      renderTrackingRoute(routeKey);
      // Auto-update sample tracking ID badge for that corridor
      const sampleTidMap = {
        'HR-DEL-CHD': 'TRK-DEL-CHD-402',
        'TR-DEL-JAI': 'TRK-DEL-JAI-108',
        'HR-DEL-SRS': 'TRK-DEL-SRS-318',
        'HR-DEL-NRN': 'TRK-DEL-NRN-205',
        'HR-GGN-HDL': 'TRK-GGN-HDL-112',
        'HR-CHD-YMN': 'TRK-CHD-YMN-504'
      };
      const trackedIdDisplay = document.getElementById('trackedIdDisplay');
      if (trackedIdDisplay && sampleTidMap[routeKey]) {
        trackedIdDisplay.innerText = sampleTidMap[routeKey];
      }
    });
  }

  // Advance simulation
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

      btnAdvanceRouteLive.innerText = 'Moving...';

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

        const distEl = document.getElementById('trackDistance');
        if (distEl) distEl.innerText = `${remainingKm.toFixed(1)} km`;
        const etaEl = document.getElementById('trackEta');
        if (etaEl) etaEl.innerText = `${etaMins}m`;

        if (vehicleMarker && map) {
          vehicleMarker.setLatLng([nextStop.lat, nextStop.lon]);
          map.panTo([nextStop.lat, nextStop.lon], { animate: true, duration: 0.8 });
        }

        renderTrackingRoute(activeRouteKey);
        btnAdvanceRouteLive.innerText = '✔ Moved';
        setTimeout(() => { btnAdvanceRouteLive.innerText = 'Advance'; }, 1000);
      } catch (err) {
        btnAdvanceRouteLive.innerText = 'Advance';
      }
    });
  }

  const btnTrackingSupport = document.getElementById('btnTrackingSupport');
  if (btnTrackingSupport) btnTrackingSupport.addEventListener('click', () => triggerWhatsApp('Hi Transitly Support, I need assistance with parcel TRK-DEL-JAI-9876'));

  const btnTrackingShare = document.getElementById('btnTrackingShare');
  if (btnTrackingShare) {
    btnTrackingShare.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: 'Transitly Tracking', text: 'Track parcel on Transitly', url: window.location.href }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Tracking link copied to clipboard!');
      }
    });
  }
});
