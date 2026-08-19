/**
 * Transitly — Google Stitch Multi-Screen Experience & Telematics Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = (window.location.port === '3000' || window.location.port === '') ? '' : 'http://localhost:3000';

  // -------------------------------------------------------------
  // 1. Navigation Tab Switching (Deliver, Tracking, History, Profile, Sub-screens)
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
        if (routeLine) map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
      }, 200);
    }
  };

  if (navBtns.deliver) navBtns.deliver.addEventListener('click', () => switchTab('deliver'));
  if (navBtns.tracking) navBtns.tracking.addEventListener('click', () => switchTab('tracking'));
  if (navBtns.history) navBtns.history.addEventListener('click', () => switchTab('history'));
  if (navBtns.profile) navBtns.profile.addEventListener('click', () => switchTab('profile'));

  // Header quick buttons
  const btnHeaderMenu = document.getElementById('btnHeaderMenu');
  if (btnHeaderMenu) btnHeaderMenu.addEventListener('click', () => switchTab('deliver'));

  // Saved Addresses Sub-screen Navigation
  const btnOpenSavedAddresses = document.getElementById('btnOpenSavedAddresses');
  if (btnOpenSavedAddresses) {
    btnOpenSavedAddresses.addEventListener('click', () => switchTab('savedAddresses'));
  }

  const btnBackFromSavedAddresses = document.getElementById('btnBackFromSavedAddresses');
  if (btnBackFromSavedAddresses) {
    btnBackFromSavedAddresses.addEventListener('click', () => switchTab('profile'));
  }

  const btnAddNewAddress = document.getElementById('btnAddNewAddress');
  if (btnAddNewAddress) {
    btnAddNewAddress.addEventListener('click', () => {
      const title = prompt('Enter address label (e.g. Office, Parent House):');
      if (title) {
        const fullAddr = prompt('Enter full address:');
        if (fullAddr) {
          alert(`Address "${title}" saved successfully!`);
        }
      }
    });
  }

  document.querySelectorAll('.saved-address-card').forEach((card) => {
    card.addEventListener('click', () => {
      const addr = card.getAttribute('data-address');
      openBookingModal('HR-DEL-CHD');
      const senderInput = document.getElementById('modalSenderAddress');
      if (senderInput) senderInput.value = addr;
    });
  });

  // Payment Methods Sub-screen Navigation
  const btnOpenPaymentMethods = document.getElementById('btnOpenPaymentMethods');
  if (btnOpenPaymentMethods) {
    btnOpenPaymentMethods.addEventListener('click', () => switchTab('paymentMethods'));
  }

  const btnBackFromPaymentMethods = document.getElementById('btnBackFromPaymentMethods');
  if (btnBackFromPaymentMethods) {
    btnBackFromPaymentMethods.addEventListener('click', () => switchTab('profile'));
  }

  document.querySelectorAll('.payment-card-item').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-card-item').forEach((c) => {
        c.classList.remove('active-card');
        const badge = c.querySelector('.bg-primary-fixed');
        if (badge) badge.remove();
        const check = c.querySelector('.check-icon-elem');
        if (check) check.remove();
      });

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
        const upi = prompt('Enter UPI ID (e.g. user@okhdfcbank):');
        if (upi) alert(`UPI ID ${upi} linked successfully!`);
      }
    });
  }

  // Settings Sub-screen Navigation
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => switchTab('settings'));
  }

  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  if (btnBackFromSettings) {
    btnBackFromSettings.addEventListener('click', () => switchTab('profile'));
  }

  // Help & Support Sub-screen Navigation
  const btnOpenHelpSupport = document.getElementById('btnOpenHelpSupport');
  if (btnOpenHelpSupport) {
    btnOpenHelpSupport.addEventListener('click', () => switchTab('helpSupport'));
  }

  const btnBackFromHelpSupport = document.getElementById('btnBackFromHelpSupport');
  if (btnBackFromHelpSupport) {
    btnBackFromHelpSupport.addEventListener('click', () => switchTab('profile'));
  }

  const btnHelpChatSupport = document.getElementById('btnHelpChatSupport');
  if (btnHelpChatSupport) {
    btnHelpChatSupport.addEventListener('click', () => {
      const query = encodeURIComponent('Hi Transitly Support, I need assistance with a delivery.');
      window.open(`https://wa.me/919876543210?text=${query}`, '_blank');
    });
  }

  const btnFloatingWhatsAppHelp = document.getElementById('btnFloatingWhatsAppHelp');
  if (btnFloatingWhatsAppHelp) {
    btnFloatingWhatsAppHelp.addEventListener('click', () => {
      const query = encodeURIComponent('Hi Transitly AI Assistant, I would like to track a parcel.');
      window.open(`https://wa.me/919876543210?text=${query}`, '_blank');
    });
  }

  // -------------------------------------------------------------
  // 2. Booking Modal Controls
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
      const route = card.getAttribute('data-route');
      openBookingModal(route);
    });
  });

  const btnQuickSearch = document.getElementById('btnQuickSearch');
  if (btnQuickSearch) {
    btnQuickSearch.addEventListener('click', () => {
      openBookingModal();
    });
  }

  // Handle Feasibility Check in Modal
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
        const box = document.getElementById('modalFeasibilityBox');
        if (box) {
          box.innerHTML = `
            <div class="flex justify-between font-bold">
              <span>Customer Experience:</span>
              <span class="text-emerald-700 font-extrabold">${data.data.customerExperience}</span>
            </div>
            <p class="text-[11px] mt-1 text-emerald-800">${data.data.customerMessage}</p>
            <div class="mt-2 pt-2 border-t border-emerald-200 flex justify-between font-extrabold text-sm">
              <span>Estimated Fare:</span>
              <span>₹450.00</span>
            </div>
          `;
        }
      } catch (err) {
        alert('Feasibility error: ' + err.message);
      } finally {
        btnModalCheckFeasibility.innerText = 'Check Feasibility';
      }
    });
  }

  // Handle Booking Submission (Saga)
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
            Tracking ID: <span class="font-mono">${data.data.shipment.trackingId}</span><br>
            Tamper-Proof QR Seal: <span class="font-mono">${data.data.shipment.qrSealCode}</span>
          `;
          setTimeout(() => {
            closeBookingModal();
            switchTab('tracking');
          }, 1800);
        }
      } catch (err) {
        alert('Booking error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Confirm Booking';
      }
    });
  }

  // -------------------------------------------------------------
  // 3. Delivery History Search & Filter Chips (Stitch Feature)
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

      if (matchesStatus && matchesSearch) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  };

  historyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeHistoryFilter = chip.getAttribute('data-filter');

      historyChips.forEach((c) => {
        if (c === chip) {
          c.className = 'history-chip flex-shrink-0 bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all active:scale-95';
        } else {
          c.className = 'history-chip flex-shrink-0 bg-surface text-on-surface-variant border border-outline-variant/50 text-xs font-semibold px-4 py-2 rounded-full hover:bg-surface-variant transition-colors';
        }
      });

      filterHistory();
    });
  });

  if (historySearchInput) {
    historySearchInput.addEventListener('input', filterHistory);
  }

  historyCards.forEach((card) => {
    card.addEventListener('click', () => {
      switchTab('tracking');
    });
  });

  // -------------------------------------------------------------
  // 4. Live Telematics & Leaflet Map Integration
  // -------------------------------------------------------------
  const corridorsData = {
    'HR-DEL-CHD': {
      busNumber: '#402',
      name: 'Delhi ➔ Chandigarh (GT Road)',
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
      name: 'Delhi ➔ Rewari ➔ Narnaul',
      vehicle: 'HR-24-GH-3456',
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
      stops: [
        { name: 'ISBT Sector 17, Chandigarh', lat: 30.7410, lon: 76.7790, time: '09:00 AM' },
        { name: 'Ambala City Hub', lat: 30.3780, lon: 76.7760, time: '09:50 AM' },
        { name: 'Saha Industrial Junction', lat: 30.2450, lon: 76.9850, time: '10:25 AM' },
        { name: 'Yamunanagar Central Bus Stand', lat: 30.1290, lon: 77.2670, time: '11:00 AM' }
      ]
    },
    'TR-DEL-JAI': {
      busNumber: '#108',
      name: 'Delhi ➔ Jaipur Intercity Express',
      vehicle: 'DL-01-AB-1234',
      stops: [
        { name: 'ISBT Kashmere Gate, Delhi', lat: 28.6675, lon: 77.2285, time: '08:30 PM' },
        { name: 'IFFCO Chowk, Gurgaon', lat: 28.4720, lon: 77.0725, time: '09:15 PM' },
        { name: 'Dharuhera Express Stop', lat: 28.2055, lon: 76.7942, time: '09:55 PM' },
        { name: 'Behror Mid-way Hub', lat: 27.8920, lon: 76.2840, time: '10:35 PM' },
        { name: 'Kotputli Transit Point', lat: 27.7010, lon: 76.1985, time: '10:55 PM' },
        { name: 'Sindhi Camp Central, Jaipur', lat: 26.9124, lon: 75.7873, time: '11:45 PM' }
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
        html: `<div style="background:${markerColor}; border:2px solid #fff; border-radius:50%; width:18px; height:18px; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const m = L.marker([stop.lat, stop.lon], { icon }).addTo(map);
      m.bindPopup(`<strong>${stop.name}</strong><br>Scheduled: ${stop.time}`);
      stopMarkers.push(m);
    });

    const curr = stops[currentStopIdx];
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="position:relative; width:48px; height:48px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(0,102,255,0.25); animation:radar-pulse-anim 2s infinite;"></div>
          <div style="width:36px; height:36px; border-radius:50%; background:#0050cb; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(0,102,255,0.6); font-size:16px; color:#fff;">
            🚌
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
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
    if (trackHandoffText) trackHandoffText.innerText = `${curr.name} to Rapido Rider`;

    const timelineActiveStopTitle = document.getElementById('timelineActiveStopTitle');
    if (timelineActiveStopTitle) timelineActiveStopTitle.innerText = `In Transit – Bus ${route.busNumber}`;

    const timelineActiveStopSub = document.getElementById('timelineActiveStopSub');
    if (timelineActiveStopSub) timelineActiveStopSub.innerText = `Currently near ${curr.name}`;
  };

  renderTrackingRoute(activeRouteKey);

  const trackingDropdown = document.getElementById('trackingCorridorDropdown');
  if (trackingDropdown) {
    trackingDropdown.addEventListener('change', (e) => {
      renderTrackingRoute(e.target.value);
    });
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

        document.getElementById('trackDistance').innerText = `${remainingKm.toFixed(1)} km`;
        document.getElementById('trackEta').innerText = `${etaMins}m (${nextStop.time})`;

        if (vehicleMarker && map) {
          vehicleMarker.setLatLng([nextStop.lat, nextStop.lon]);
          map.panTo([nextStop.lat, nextStop.lon], { animate: true, duration: 1 });
        }

        renderTrackingRoute(activeRouteKey);
        btnAdvanceRouteLive.innerText = '✔ Moved';
        setTimeout(() => {
          btnAdvanceRouteLive.innerText = 'Advance';
        }, 1000);
      } catch (err) {
        alert('Ping error: ' + err.message);
        btnAdvanceRouteLive.innerText = 'Advance';
      }
    });
  }

  // Action buttons in Tracking sheet
  const btnTrackingSupport = document.getElementById('btnTrackingSupport');
  if (btnTrackingSupport) {
    btnTrackingSupport.addEventListener('click', () => {
      const query = encodeURIComponent('Hi Transitly Support, I need assistance with parcel TRK-DEL-JAI-9876');
      window.open(`https://wa.me/919876543210?text=${query}`, '_blank');
    });
  }

  const btnTrackingShare = document.getElementById('btnTrackingShare');
  if (btnTrackingShare) {
    btnTrackingShare.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'Transitly Live Tracking',
          text: 'Track my parcel in real-time on Transitly',
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Tracking link copied to clipboard!');
      }
    });
  }

  // WhatsApp Assistant button handler
  const btnOpenWhatsAppAssistant = document.getElementById('btnOpenWhatsAppAssistant');
  if (btnOpenWhatsAppAssistant) {
    btnOpenWhatsAppAssistant.addEventListener('click', () => {
      const query = encodeURIComponent('Hi Transitly, I want to track parcel TRK-DEL-JAI-9876');
      window.open(`https://wa.me/919876543210?text=${query}`, '_blank');
    });
  }
});
