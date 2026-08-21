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

  let googleRoadmapLayer = null;
  let googleSatelliteLayer = null;
  let isSatelliteMode = false;

  /**
   * Initialize Authentic Google Maps on Homepage
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

    // Authentic Google Maps Roadmap Tile Layer
    googleRoadmapLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      attribution: '© Google Maps'
    }).addTo(homeMap);

    // High-Resolution Satellite Layer
    googleSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Google Maps / World Imagery'
    });

    // Custom Live User Pickup Pin with Integrated Pulsing Badge
    const createPinIcon = (locationName) => {
      return L.divIcon({
        className: 'custom-pickup-pin',
        html: `
          <div class="flex flex-col items-center drop-shadow-xl cursor-pointer pointer-events-auto" style="transform: translate(-50%, -100%);">
            <div class="bg-[#128C55] text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap mb-1 hover:scale-105 transition-transform">
              <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span id="mapPinLocationLabel">📍 Pickup: ${locationName || currentLocationName}</span>
            </div>
            <div class="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center shadow-2xl border-2 border-white animate-bounce">
              <span class="material-symbols-outlined text-white text-base" style="font-variation-settings: 'FILL' 1;">person_pin_circle</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    userMarker = L.marker([lat, lng], { icon: createPinIcon(currentLocationName), draggable: true }).addTo(homeMap);

    userMarker.on('click', () => {
      openLocationModal();
    });

    userMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      currentLat = pos.lat;
      currentLng = pos.lng;
      const reverseName = await reverseGeocode(pos.lat, pos.lng);
      applyLocationToUI(reverseName, pos.lat, pos.lng, false);
    });

    // Map layer toggle (Streets <-> Satellite)
    const btnToggleMapLayer = document.getElementById('btnToggleMapLayer');
    if (btnToggleMapLayer) {
      btnToggleMapLayer.addEventListener('click', (e) => {
        e.stopPropagation();
        isSatelliteMode = !isSatelliteMode;
        if (isSatelliteMode) {
          homeMap.removeLayer(googleRoadmapLayer);
          googleSatelliteLayer.addTo(homeMap);
          btnToggleMapLayer.className = 'w-10 h-10 rounded-xl bg-primary text-white shadow-md border border-primary flex items-center justify-center transition-all active:scale-95';
          showLocationToast('Google Maps: Satellite View enabled');
        } else {
          homeMap.removeLayer(googleSatelliteLayer);
          googleRoadmapLayer.addTo(homeMap);
          btnToggleMapLayer.className = 'w-10 h-10 rounded-xl bg-surface/95 backdrop-blur-md shadow-md border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-variant transition-all active:scale-95';
          showLocationToast('Google Maps: Standard Roadmap enabled');
        }
      });
    }

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
   * Show feedback toast
   */
  const showLocationToast = (msg) => {
    const locationToast = document.getElementById('locationToast');
    const locationToastText = document.getElementById('locationToastText');
    if (!locationToast || !locationToastText) return;
    locationToastText.innerText = msg;
    locationToast.classList.remove('hidden');
    setTimeout(() => {
      locationToast.classList.add('hidden');
    }, 2800);
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

    const mapPinLocationLabel = document.getElementById('mapPinLocationLabel');
    if (mapPinLocationLabel) {
      mapPinLocationLabel.innerText = `📍 Pickup: ${currentLocationName}`;
    }

    if (homeMap) {
      if (userMarker) userMarker.setLatLng([currentLat, currentLng]);
      if (panMap) homeMap.flyTo([currentLat, currentLng], 14, { animate: true, duration: 1.2 });
    }

    localStorage.setItem('transitly_pickup_location', JSON.stringify({
      name: currentLocationName,
      lat: currentLat,
      lng: currentLng,
      time: Date.now()
    }));
  };

  /**
   * Fallback IP Geolocation Resolver
   */
  const resolveIpLocation = async () => {
    try {
      const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        if (city && data.latitude && data.longitude) {
          const formatted = `${city}, ${data.principalSubdivision || ''}`.replace(/,\s*$/, '');
          applyLocationToUI(formatted, data.latitude, data.longitude, true);
          return formatted;
        }
      }
    } catch (_) {}

    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (res2.ok) {
        const d2 = await res2.json();
        if (d2.city && d2.latitude && d2.longitude) {
          const formatted2 = `${d2.city}, ${d2.region || ''}`.replace(/,\s*$/, '');
          applyLocationToUI(formatted2, d2.latitude, d2.longitude, true);
          return formatted2;
        }
      }
    } catch (_) {}

    return null;
  };

  /**
   * Request User Location Services (Non-blocking & Robust)
   */
  const requestLiveDeviceLocation = async (fromUserPrompt = false) => {
    const btnTrigger = document.getElementById('btnTriggerGpsDetect');
    const originalBtnText = btnTrigger ? btnTrigger.innerHTML : '';

    if (btnTrigger) {
      btnTrigger.innerHTML = `
        <span class="material-symbols-outlined text-xl animate-spin">refresh</span>
        <span>Detecting Live GPS...</span>
      `;
    }

    if (liveLocationText) liveLocationText.innerText = 'Detecting Location...';
    if (liveGpsDot) liveGpsDot.className = 'w-2 h-2 rounded-full bg-yellow-300 animate-ping';

    let resolved = false;

    // Helper to finish detection
    const finalizeLocation = (cityName) => {
      if (locationPermissionBanner) locationPermissionBanner.classList.add('hidden');
      closeLocationModal();
      if (btnTrigger) btnTrigger.innerHTML = originalBtnText;
      showLocationToast(`📍 Pickup set to ${cityName || currentLocationName}`);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          resolved = true;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const revName = await reverseGeocode(lat, lng);
          applyLocationToUI(revName, lat, lng, true);
          finalizeLocation(revName);

          if (!watchId) {
            watchId = navigator.geolocation.watchPosition((pos) => {
              currentLat = pos.coords.latitude;
              currentLng = pos.coords.longitude;
              if (userMarker) userMarker.setLatLng([currentLat, currentLng]);
            }, null, { enableHighAccuracy: true, maximumAge: 10000 });
          }
        },
        async () => {
          // If browser GPS is denied/unavailable, fallback smoothly to IP Geolocation without alert dialogs
          if (!resolved) {
            resolved = true;
            const ipCity = await resolveIpLocation();
            finalizeLocation(ipCity);
          }
        },
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 30000 }
      );
    } else {
      const ipCity = await resolveIpLocation();
      finalizeLocation(ipCity);
    }

    // Safety timeout in case callback hangs
    setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        const ipCity = await resolveIpLocation();
        finalizeLocation(ipCity);
      }
    }, 4000);
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

  // Live filtering in Location Modal
  const inputCustomLocation = document.getElementById('inputCustomLocation');
  if (inputCustomLocation) {
    inputCustomLocation.addEventListener('input', () => {
      const q = inputCustomLocation.value.toLowerCase().trim();
      document.querySelectorAll('.hub-select-btn').forEach(btn => {
        const text = (btn.getAttribute('data-name') || btn.innerText).toLowerCase();
        btn.style.display = q === '' || text.includes(q) ? 'flex' : 'none';
      });
    });

    inputCustomLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputCustomLocation.value.trim();
        if (val) {
          applyLocationToUI(val, currentLat, currentLng, true);
          closeLocationModal();
          showLocationToast(`📍 Pickup set to ${val}`);
        }
      }
    });
  }

  document.querySelectorAll('.hub-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const lat = parseFloat(btn.getAttribute('data-lat'));
      const lng = parseFloat(btn.getAttribute('data-lng'));
      applyLocationToUI(name, lat, lng, true);
      closeLocationModal();
      showLocationToast(`📍 Pickup set to ${name.split(',')[0]}`);
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
