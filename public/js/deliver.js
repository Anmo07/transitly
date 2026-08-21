/**
 * Transitly — Deliver / Home Controller
 * Full Interactive Map, Device Location Services & Backend Multi-Modal Booking System
 */

document.addEventListener('DOMContentLoaded', () => {
  let homeMap = null;
  let userMarker = null;
  let watchId = null;

  let currentLat = 28.4595;
  let currentLng = 77.0266;
  let currentLocationName = 'Gurgaon, Haryana';

  // DOM Elements
  const liveLocationText = document.getElementById('liveLocationText');
  const livePickupBadge = document.getElementById('livePickupBadge');
  const liveGpsDot = document.getElementById('liveGpsDot');
  const liveLocationPinContainer = document.getElementById('liveLocationPinContainer');
  const homeSearchInput = document.getElementById('homeSearchInput');

  // Floating map buttons
  const btnMapZoomIn = document.getElementById('btnMapZoomIn');
  const btnMapZoomOut = document.getElementById('btnMapZoomOut');
  const btnMapLocateMe = document.getElementById('btnMapLocateMe');
  const locationPermissionBanner = document.getElementById('locationPermissionBanner');
  const btnAllowLocation = document.getElementById('btnAllowLocation');

  // Location Modal
  const locationPickerModal = document.getElementById('locationPickerModal');
  const btnCloseLocationModal = document.getElementById('btnCloseLocationModal');
  const btnTriggerGpsDetect = document.getElementById('btnTriggerGpsDetect');
  const inputCustomLocation = document.getElementById('inputCustomLocation');

  // Booking Modal Elements
  const btnOpenBookingModal = document.getElementById('btnOpenBookingModal');
  const bookingModal = document.getElementById('bookingModal');
  const btnCloseBookingModal = document.getElementById('btnCloseBookingModal');
  const formCreateBooking = document.getElementById('formCreateBooking');
  const bookingRouteSelect = document.getElementById('bookingRouteSelect');
  const bookingWeight = document.getElementById('bookingWeight');
  const bookingSpeed = document.getElementById('bookingSpeed');
  const btnCheckFeasibility = document.getElementById('btnCheckFeasibility');
  const bookingExpMode = document.getElementById('bookingExpMode');
  const bookingLegsSummary = document.getElementById('bookingLegsSummary');
  const bookingTotalFare = document.getElementById('bookingTotalFare');

  // Booking Success Modal
  const bookingSuccessModal = document.getElementById('bookingSuccessModal');
  const btnCloseSuccessModal = document.getElementById('btnCloseSuccessModal');
  const btnGoToLiveTracking = document.getElementById('btnGoToLiveTracking');
  const receiptTrackingId = document.getElementById('receiptTrackingId');
  const receiptBus = document.getElementById('receiptBus');
  const receiptRoute = document.getElementById('receiptRoute');
  const receiptPaid = document.getElementById('receiptPaid');

  // Notifications Drawer
  const notificationsDrawer = document.getElementById('notificationsDrawer');
  const btnCloseNotifications = document.getElementById('btnCloseNotifications');

  let activeCreatedTrackingId = 'TRK-88219';

  /**
   * Initialize Leaflet Interactive Map on Homepage
   */
  const initHomeMap = (lat = currentLat, lng = currentLng) => {
    const mapElement = document.getElementById('homeInteractiveMap');
    const staticFallback = document.getElementById('homeStaticFallback');
    if (!mapElement || !window.L || homeMap) return;

    if (staticFallback) staticFallback.style.display = 'none';

    homeMap = L.map('homeInteractiveMap', {
      zoomControl: false,
      attributionControl: false,
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true
    });

    // Clean Carto Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(homeMap);

    // Custom Live User Pickup Pin
    const pinIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: `
        <div class="flex flex-col items-center drop-shadow-md">
          <div class="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            <span class="material-symbols-outlined text-white text-sm" style="font-variation-settings: 'FILL' 1;">person_pin_circle</span>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    userMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(homeMap);

    userMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      currentLat = pos.lat;
      currentLng = pos.lng;
      const reverseName = await reverseGeocode(pos.lat, pos.lng);
      applyLocationToUI(reverseName, pos.lat, pos.lng, false);
    });

    if (btnMapZoomIn) {
      btnMapZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        homeMap.zoomIn();
      });
    }

    if (btnMapZoomOut) {
      btnMapZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        homeMap.zoomOut();
      });
    }

    setTimeout(() => {
      if (homeMap) homeMap.invalidateSize();
    }, 250);
  };

  /**
   * Reverse Geocode (Coordinates -> Readable City/Street Name)
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.suburb || data.city;
        const city = data.city || data.principalSubdivision;
        if (locality && city && locality !== city) return `${locality}, ${city}`;
        if (city) return `${city}, ${data.principalSubdivision || ''}`.replace(/,\s*$/, '');
        if (data.locality) return data.locality;
      }
    } catch (_) {}

    return `Lat ${lat.toFixed(3)}°, Lng ${lng.toFixed(3)}°`;
  };

  /**
   * Update UI with location
   */
  const applyLocationToUI = (name, lat, lng, panMap = true) => {
    currentLocationName = name;
    if (lat) currentLat = lat;
    if (lng) currentLng = lng;

    if (liveLocationText) {
      liveLocationText.innerText = `📍 Pickup: ${currentLocationName}`;
    }
    if (liveGpsDot) {
      liveGpsDot.className = 'w-2 h-2 rounded-full bg-white';
    }
    if (livePickupBadge) {
      livePickupBadge.className = 'bg-[#128C55] text-white px-4 py-1.5 rounded-full text-label-md font-label-md mb-2 shadow-level-1 flex items-center gap-1.5 transition-all';
      livePickupBadge.title = `Live Location: ${currentLocationName} (Click to change)`;
    }
    if (homeSearchInput) {
      homeSearchInput.placeholder = `From: ${currentLocationName} ➔ Where to send?`;
    }

    if (homeMap) {
      if (userMarker) userMarker.setLatLng([currentLat, currentLng]);
      if (panMap) homeMap.flyTo([currentLat, currentLng], 15, { animate: true, duration: 1.2 });
    }

    localStorage.setItem('transitly_pickup_location', JSON.stringify({
      name: currentLocationName,
      lat: currentLat,
      lng: currentLng,
      time: Date.now()
    }));
  };

  /**
   * Request User Location Services
   */
  const requestLiveDeviceLocation = (fromUserPrompt = false) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }

    if (liveLocationText) liveLocationText.innerText = 'Requesting GPS Location Services...';
    if (liveGpsDot) liveGpsDot.className = 'w-2 h-2 rounded-full bg-yellow-300 animate-ping';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const revName = await reverseGeocode(lat, lng);
        applyLocationToUI(revName, lat, lng, true);

        if (locationPermissionBanner) locationPermissionBanner.classList.add('hidden');
        closeLocationModal();

        if (!watchId) {
          watchId = navigator.geolocation.watchPosition((pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            if (userMarker) userMarker.setLatLng([currentLat, currentLng]);
          }, null, { enableHighAccuracy: true, maximumAge: 10000 });
        }
      },
      (error) => {
        console.warn('Geolocation notice:', error.message);
        if (fromUserPrompt) {
          alert('Location permission was not granted. Please pick a hub from the list.');
          openLocationModal();
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Map floating button listeners
  if (btnMapLocateMe) {
    btnMapLocateMe.addEventListener('click', (e) => {
      e.stopPropagation();
      requestLiveDeviceLocation(true);
    });
  }

  if (btnAllowLocation) {
    btnAllowLocation.addEventListener('click', (e) => {
      e.stopPropagation();
      requestLiveDeviceLocation(true);
    });
  }

  // Location Modal Handlers
  const openLocationModal = () => {
    if (locationPickerModal) locationPickerModal.classList.remove('hidden');
  };
  const closeLocationModal = () => {
    if (locationPickerModal) locationPickerModal.classList.add('hidden');
  };

  if (liveLocationPinContainer) liveLocationPinContainer.addEventListener('click', openLocationModal);
  if (livePickupBadge) livePickupBadge.addEventListener('click', openLocationModal);
  if (btnCloseLocationModal) btnCloseLocationModal.addEventListener('click', closeLocationModal);
  if (locationPickerModal) {
    locationPickerModal.addEventListener('click', (e) => {
      if (e.target === locationPickerModal) closeLocationModal();
    });
  }

  if (btnTriggerGpsDetect) {
    btnTriggerGpsDetect.addEventListener('click', () => {
      requestLiveDeviceLocation(true);
    });
  }

  document.querySelectorAll('.hub-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const lat = parseFloat(btn.getAttribute('data-lat'));
      const lng = parseFloat(btn.getAttribute('data-lng'));
      applyLocationToUI(name, lat, lng, true);
      closeLocationModal();
    });
  });

  if (inputCustomLocation) {
    inputCustomLocation.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && inputCustomLocation.value.trim()) {
        const val = inputCustomLocation.value.trim();
        applyLocationToUI(val, null, null, false);
        closeLocationModal();
      }
    });
  }

  // ==========================================
  // BACKEND MULTI-MODAL BOOKING INTEGRATION
  // ==========================================

  const computeFeasibilityAndFare = async () => {
    const route = bookingRouteSelect ? bookingRouteSelect.value : 'HR-DEL-CHD';
    const weight = parseFloat(bookingWeight ? bookingWeight.value : '5.0') || 5.0;
    const speed = bookingSpeed ? bookingSpeed.value : 'STANDARD';

    let baseBusFare = 280;
    let busName = 'Fleet Bus #402';
    let corridorText = 'Delhi ➔ Chandigarh';

    if (route === 'HR-DEL-JPR') {
      baseBusFare = 290;
      busName = 'Fleet Bus #315';
      corridorText = 'Delhi ➔ Jaipur';
    } else if (route === 'HR-DEL-SRS') {
      baseBusFare = 310;
      busName = 'Fleet Bus #508';
      corridorText = 'Delhi ➔ Sirsa';
    } else if (route === 'HR-DEL-NRN') {
      baseBusFare = 240;
      busName = 'Fleet Bus #112';
      corridorText = 'Delhi ➔ Rewari ➔ Narnaul';
    }

    const firstMileCost = 80;
    const lastMileCost = 90;
    const weightMultiplier = Math.max(1, weight / 5);
    const speedMultiplier = speed === 'EXPRESS' ? 1.4 : 1.0;

    const total = Math.round((baseBusFare * weightMultiplier + firstMileCost + lastMileCost) * speedMultiplier);

    if (bookingTotalFare) bookingTotalFare.innerText = `₹${total}.00`;
    if (bookingLegsSummary) {
      bookingLegsSummary.innerText = `Uber First-Mile (₹${firstMileCost}) ➔ ${busName} Express (₹${Math.round(baseBusFare * weightMultiplier)}) ➔ Rapido Last-Mile (₹${lastMileCost})`;
    }
    if (bookingExpMode) {
      bookingExpMode.innerText = speed === 'EXPRESS' ? 'EXPRESS 4-HOUR CARGO' : 'FULL DOOR-TO-DOOR';
    }

    return { total, busName, corridorText };
  };

  // Open & Close Booking Modal
  if (btnOpenBookingModal) {
    btnOpenBookingModal.addEventListener('click', () => {
      if (bookingModal) bookingModal.classList.remove('hidden');
      computeFeasibilityAndFare();
    });
  }

  if (btnCloseBookingModal) {
    btnCloseBookingModal.addEventListener('click', () => {
      if (bookingModal) bookingModal.classList.add('hidden');
    });
  }

  if (bookingRouteSelect) bookingRouteSelect.addEventListener('change', computeFeasibilityAndFare);
  if (bookingWeight) bookingWeight.addEventListener('input', computeFeasibilityAndFare);
  if (bookingSpeed) bookingSpeed.addEventListener('change', computeFeasibilityAndFare);
  if (btnCheckFeasibility) btnCheckFeasibility.addEventListener('click', computeFeasibilityAndFare);

  // Submit Booking to Backend API
  if (formCreateBooking) {
    formCreateBooking.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmitBooking');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> <span>Booking Saga Running...</span>`;
      }

      const { total, busName, corridorText } = await computeFeasibilityAndFare();
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const trackingId = `TRK-${randomSuffix}`;
      activeCreatedTrackingId = trackingId;

      const payload = {
        trackingId,
        operatorId: 10,
        sender: {
          name: document.getElementById('bookingSenderName')?.value || 'Aarav Sharma',
          phone: document.getElementById('bookingSenderPhone')?.value || '+91 98765 43210',
          address: currentLocationName
        },
        recipient: {
          name: document.getElementById('bookingReceiverName')?.value || 'Rohan Verma',
          phone: document.getElementById('bookingReceiverPhone')?.value || '+91 98765 43211',
          address: document.getElementById('bookingReceiverAddress')?.value || 'Destination Terminal Area'
        },
        parcel: {
          weightKg: parseFloat(bookingWeight?.value || '5.0'),
          dimensions: { lengthCm: 30, widthCm: 25, heightCm: 20 },
          type: 'EXPRESS_PARCEL'
        },
        pricing: {
          totalAmount: total,
          currency: 'INR'
        }
      };

      try {
        // Send to backend REST API
        await fetch('/api/v1/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (_) {}

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span> <span>Confirm & Pay</span>`;
      }

      // Close booking modal and show success receipt
      if (bookingModal) bookingModal.classList.add('hidden');

      if (receiptTrackingId) receiptTrackingId.innerText = trackingId;
      if (receiptBus) receiptBus.innerText = busName;
      if (receiptRoute) receiptRoute.innerText = corridorText;
      if (receiptPaid) receiptPaid.innerText = `₹${total}.00`;

      if (bookingSuccessModal) bookingSuccessModal.classList.remove('hidden');
    });
  }

  // Success Modal Handlers
  if (btnCloseSuccessModal) {
    btnCloseSuccessModal.addEventListener('click', () => {
      if (bookingSuccessModal) bookingSuccessModal.classList.add('hidden');
    });
  }

  if (btnGoToLiveTracking) {
    btnGoToLiveTracking.addEventListener('click', () => {
      window.location.href = `/tracking?id=${encodeURIComponent(activeCreatedTrackingId)}`;
    });
  }

  // Notifications Drawer
  const btnNotificationTrigger = document.querySelector('[data-icon="notifications"]')?.closest('button');
  if (btnNotificationTrigger) {
    btnNotificationTrigger.addEventListener('click', () => {
      if (notificationsDrawer) notificationsDrawer.classList.remove('hidden');
    });
  }

  if (btnCloseNotifications) {
    btnCloseNotifications.addEventListener('click', () => {
      if (notificationsDrawer) notificationsDrawer.classList.add('hidden');
    });
  }

  // Initialize Map
  initHomeMap(currentLat, currentLng);

  const saved = localStorage.getItem('transitly_pickup_location');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      applyLocationToUI(parsed.name, parsed.lat, parsed.lng, true);
    } catch (_) {}
  } else {
    if (locationPermissionBanner) locationPermissionBanner.classList.remove('hidden');

    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client')
      .then(res => res.json())
      .then(data => {
        const city = data.city || data.locality || data.principalSubdivision;
        if (city && data.latitude && data.longitude) {
          applyLocationToUI(`${city}, ${data.principalSubdivision || ''}`.replace(/,\s*$/, ''), data.latitude, data.longitude, true);
        }
      })
      .catch(() => {});

    requestLiveDeviceLocation(false);
  }

  // Home search bar submits
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = homeSearchInput.value.trim();
        if (val.toUpperCase().startsWith('TRK-')) {
          window.location.href = `/tracking?id=${encodeURIComponent(val.toUpperCase())}`;
        } else {
          // Open booking modal with destination filled
          if (bookingModal) {
            bookingModal.classList.remove('hidden');
            const destInput = document.getElementById('bookingReceiverAddress');
            if (destInput && val) destInput.value = val;
            computeFeasibilityAndFare();
          }
        }
      }
    });
  }
});
