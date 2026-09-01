/**
 * Transitly — Deliver / Home Controller
 * Full Two-Way Interactive Map, Dedicated From/To Route Configuration,
 * One-Time Live Device GPS Permission & Multi-Modal Booking Saga Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  let homeMap = null;
  let fromMarker = null;
  let toMarker = null;
  let routePolyline = null;
  let watchId = null;
  let activeTarget = 'from'; // 'from' | 'to'

  // Location State
  let fromLocation = {
    name: 'Mohali, Punjab',
    lat: 30.7046,
    lng: 76.7179
  };

  let toLocation = {
    name: 'ISBT Sector 17, Chandigarh',
    lat: 30.7410,
    lng: 76.7790
  };

  // DOM Elements - Search Panel
  const inputSearchFrom = document.getElementById('inputSearchFrom');
  const inputSearchTo = document.getElementById('inputSearchTo');
  const btnClearFrom = document.getElementById('btnClearFrom');
  const btnClearTo = document.getElementById('btnClearTo');
  const btnGpsFrom = document.getElementById('btnGpsFrom');
  const btnPickOnMapTo = document.getElementById('btnPickOnMapTo');
  const btnSwapRoute = document.getElementById('btnSwapRoute');
  const dropdownSuggestionsFrom = document.getElementById('dropdownSuggestionsFrom');
  const dropdownSuggestionsTo = document.getElementById('dropdownSuggestionsTo');
  const btnProceedBookingDirect = document.getElementById('btnProceedBookingDirect');

  // Floating Map Controls & Banner
  const btnMapZoomIn = document.getElementById('btnMapZoomIn');
  const btnMapZoomOut = document.getElementById('btnMapZoomOut');
  const btnMapLocateMe = document.getElementById('btnMapLocateMe');
  const locationPermissionBanner = document.getElementById('locationPermissionBanner');
  const btnAllowLocation = document.getElementById('btnAllowLocation');

  // Location Modal Elements
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
  const bookingSenderAddress = document.getElementById('bookingSenderAddress');
  const bookingReceiverAddress = document.getElementById('bookingReceiverAddress');

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

  // Curated catalog of Northern India / Intercity Transit Hubs & Landmarks
  const POPULAR_HUBS = [
    { name: 'Mohali Phase 7 / Sector 70, Punjab', lat: 30.7046, lng: 76.7179, type: 'hub' },
    { name: 'ISBT Sector 17, Chandigarh', lat: 30.7410, lng: 76.7790, type: 'bus_stand' },
    { name: 'ISBT Sector 43, Chandigarh', lat: 30.7180, lng: 76.7450, type: 'bus_stand' },
    { name: 'ISBT Kashmiri Gate, New Delhi', lat: 28.6675, lng: 77.2285, type: 'bus_stand' },
    { name: 'Dhaula Kuan Bus Transit, New Delhi', lat: 28.5921, lng: 77.1610, type: 'hub' },
    { name: 'Gurgaon Central Bus Stand, Cyber City', lat: 28.4595, lng: 77.0266, type: 'hub' },
    { name: 'Noida Sector 62 Electronic City, UP', lat: 28.6280, lng: 77.3649, type: 'hub' },
    { name: 'Panipat Bus Stand & Toll Plaza, Haryana', lat: 29.3909, lng: 76.9635, type: 'bus_stand' },
    { name: 'Karnal Central Bus Stand, Haryana', lat: 29.6857, lng: 76.9905, type: 'bus_stand' },
    { name: 'Ambala Cantt Junction ISBT, Haryana', lat: 30.3752, lng: 76.7821, type: 'bus_stand' },
    { name: 'Kurukshetra Pipli Chowk, Haryana', lat: 29.9695, lng: 76.8783, type: 'hub' },
    { name: 'Rohtak New Bus Stand, Haryana', lat: 28.8955, lng: 76.6066, type: 'bus_stand' },
    { name: 'Hisar Central Bus Depot, Haryana', lat: 29.1539, lng: 75.7229, type: 'bus_stand' },
    { name: 'Sirsa General Bus Stand, Haryana', lat: 29.5340, lng: 75.0280, type: 'bus_stand' },
    { name: 'Sindhi Camp Bus Stand, Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873, type: 'bus_stand' },
    { name: 'Ludhiana ISBT Amar Shaheed Sukhdev, Punjab', lat: 30.9010, lng: 75.8573, type: 'bus_stand' }
  ];

  /**
   * Create Custom Pin Icons
   */
  const createFromPinIcon = (name) => {
    return L.divIcon({
      className: 'custom-pickup-pin',
      html: `
        <div class="flex flex-col items-center drop-shadow-xl cursor-pointer pointer-events-auto" style="transform: translate(-50%, -100%);">
          <div class="bg-[#128C55] text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap mb-1 hover:scale-105 transition-transform border border-white/30">
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span id="mapPinFromLabel">📍 From: ${name || fromLocation.name}</span>
          </div>
          <div class="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white animate-bounce">
            <span class="material-symbols-outlined text-white text-base" style="font-variation-settings: 'FILL' 1;">trip_origin</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  const createToPinIcon = (name) => {
    return L.divIcon({
      className: 'custom-dropoff-pin',
      html: `
        <div class="flex flex-col items-center drop-shadow-xl cursor-pointer pointer-events-auto" style="transform: translate(-50%, -100%);">
          <div class="bg-[#DC2626] text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap mb-1 hover:scale-105 transition-transform border border-white/30">
            <span class="w-2 h-2 rounded-full bg-white"></span>
            <span id="mapPinToLabel">🏁 To: ${name || toLocation.name}</span>
          </div>
          <div class="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
            <span class="material-symbols-outlined text-white text-base" style="font-variation-settings: 'FILL' 1;">location_on</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
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
   * Forward Geocode (Place / Address Text -> Coordinates)
   */
  const forwardGeocode = async (queryText) => {
    if (!queryText || !queryText.trim()) return null;
    const clean = queryText.toLowerCase().trim();

    // 1. Check local catalog first (instant & reliable)
    const localMatch = POPULAR_HUBS.find(h => h.name.toLowerCase().includes(clean) || clean.includes(h.name.toLowerCase()));
    if (localMatch) {
      return { name: localMatch.name, lat: localMatch.lat, lng: localMatch.lng };
    }

    // 2. Query OpenStreetMap Nominatim with India countrycode filter
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&countrycodes=in&limit=1`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          return {
            name: item.display_name.split(',').slice(0, 2).join(', '),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };
        }
      }
    } catch (_) {}

    return null;
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
   * Update Route Line on Map and Auto Fit Bounds
   */
  const updateMapRoute = () => {
    if (!homeMap) return;

    const fromLatLng = [fromLocation.lat, fromLocation.lng];
    const toLatLng = [toLocation.lat, toLocation.lng];

    if (routePolyline) {
      homeMap.removeLayer(routePolyline);
    }

    // Draw smooth blue corridor polyline
    routePolyline = L.polyline([fromLatLng, toLatLng], {
      color: '#0066FF',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(homeMap);

    // Fit map to view both points comfortably
    const bounds = L.latLngBounds([fromLatLng, toLatLng]);
    homeMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  };

  /**
   * Apply "From" Location to UI & Map
   */
  const applyFromLocation = (name, lat, lng, pan = true) => {
    fromLocation.name = name;
    if (lat) fromLocation.lat = lat;
    if (lng) fromLocation.lng = lng;

    if (inputSearchFrom) {
      inputSearchFrom.value = name;
      if (btnClearFrom) btnClearFrom.classList.toggle('hidden', !name);
    }

    if (fromMarker) {
      fromMarker.setLatLng([fromLocation.lat, fromLocation.lng]);
      fromMarker.setIcon(createFromPinIcon(name));
    }

    updateMapRoute();

    localStorage.setItem('transitly_pickup_location', JSON.stringify({
      name: fromLocation.name,
      lat: fromLocation.lat,
      lng: fromLocation.lng,
      time: Date.now()
    }));
  };

  /**
   * Apply "To" Location to UI & Map
   */
  const applyToLocation = (name, lat, lng, pan = true) => {
    toLocation.name = name;
    if (lat) toLocation.lat = lat;
    if (lng) toLocation.lng = lng;

    if (inputSearchTo) {
      inputSearchTo.value = name;
      if (btnClearTo) btnClearTo.classList.toggle('hidden', !name);
    }

    if (toMarker) {
      toMarker.setLatLng([toLocation.lat, toLocation.lng]);
      toMarker.setIcon(createToPinIcon(name));
    }

    updateMapRoute();

    localStorage.setItem('transitly_dropoff_location', JSON.stringify({
      name: toLocation.name,
      lat: toLocation.lat,
      lng: toLocation.lng,
      time: Date.now()
    }));
  };

  /**
   * Initialize Leaflet Interactive Google Map
   */
  const initHomeMap = () => {
    const mapElement = document.getElementById('homeInteractiveMap');
    const staticFallback = document.getElementById('homeStaticFallback');
    if (!mapElement || !window.L || homeMap) return;

    if (staticFallback) staticFallback.style.display = 'none';

    homeMap = L.map('homeInteractiveMap', {
      zoomControl: false,
      attributionControl: false,
      center: [fromLocation.lat, fromLocation.lng],
      zoom: 13,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true
    });

    // Google Maps Roadmap Layer
    googleRoadmapLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      attribution: '© Google Maps'
    }).addTo(homeMap);

    // Google Satellite Layer
    googleSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Google Maps / World Imagery'
    });

    // 1. Pickup Origin (From) Draggable Marker
    fromMarker = L.marker([fromLocation.lat, fromLocation.lng], {
      icon: createFromPinIcon(fromLocation.name),
      draggable: true,
      zIndexOffset: 500
    }).addTo(homeMap);

    fromMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      const name = await reverseGeocode(pos.lat, pos.lng);
      applyFromLocation(name, pos.lat, pos.lng, false);
      showLocationToast(`📍 Pickup set to ${name.split(',')[0]}`);
    });

    fromMarker.on('click', () => {
      activeTarget = 'from';
      if (inputSearchFrom) inputSearchFrom.focus();
    });

    // 2. Dropoff Destination (To) Draggable Marker
    toMarker = L.marker([toLocation.lat, toLocation.lng], {
      icon: createToPinIcon(toLocation.name),
      draggable: true,
      zIndexOffset: 400
    }).addTo(homeMap);

    toMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      const name = await reverseGeocode(pos.lat, pos.lng);
      applyToLocation(name, pos.lat, pos.lng, false);
      showLocationToast(`🏁 Destination set to ${name.split(',')[0]}`);
    });

    toMarker.on('click', () => {
      activeTarget = 'to';
      if (inputSearchTo) inputSearchTo.focus();
    });

    // 3. User Clicks Anywhere on Map -> Updates Active Target ("From" or "To")
    homeMap.on('click', async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const placeName = await reverseGeocode(lat, lng);

      if (activeTarget === 'to') {
        applyToLocation(placeName, lat, lng, false);
        showLocationToast(`🏁 Destination placed: ${placeName.split(',')[0]}`);
      } else {
        applyFromLocation(placeName, lat, lng, false);
        showLocationToast(`📍 Pickup placed: ${placeName.split(',')[0]}`);
      }
    });

    // Initial Route Polyline & Bounds
    updateMapRoute();

    // Map controls
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
   * Request Live GPS Location (One-Time Action with LocalStorage Persistence)
   */
  const requestLiveDeviceLocation = (isUserInitiated = false) => {
    const btnTrigger = document.getElementById('btnTriggerGpsDetect');
    const originalBtnText = btnTrigger ? btnTrigger.innerHTML : '';

    if (btnTrigger) {
      btnTrigger.innerHTML = `
        <span class="material-symbols-outlined text-xl animate-spin">refresh</span>
        <span>Detecting Live GPS...</span>
      `;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const revName = await reverseGeocode(lat, lng);

          // Mark permission as permanently granted
          localStorage.setItem('transitly_gps_permission_granted', 'true');
          if (locationPermissionBanner) locationPermissionBanner.classList.add('hidden');

          applyFromLocation(revName, lat, lng, true);

          if (btnTrigger) btnTrigger.innerHTML = originalBtnText;
          closeLocationModal();
          showLocationToast(`📍 Live GPS set: ${revName.split(',')[0]}`);

          if (!watchId) {
            watchId = navigator.geolocation.watchPosition((pos) => {
              fromLocation.lat = pos.coords.latitude;
              fromLocation.lng = pos.coords.longitude;
              if (fromMarker) fromMarker.setLatLng([fromLocation.lat, fromLocation.lng]);
            }, null, { enableHighAccuracy: true, maximumAge: 10000 });
          }
        },
        async () => {
          // If browser GPS is denied or fails, fallback smoothly to IP location
          if (isUserInitiated) {
            showLocationToast('GPS access denied. Using network location.');
          }
          if (btnTrigger) btnTrigger.innerHTML = originalBtnText;
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    }
  };

  // -------------------------------------------------------------
  // Search Panel Autocomplete & Real-Time Typing Listeners
  // -------------------------------------------------------------

  let debounceTimerFrom = null;
  let debounceTimerTo = null;

  const renderSuggestions = (container, inputElement, isFrom = true) => {
    const query = inputElement.value.toLowerCase().trim();
    if (!query) {
      container.classList.add('hidden');
      return;
    }

    const matches = POPULAR_HUBS.filter(h => h.name.toLowerCase().includes(query));

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="p-3 text-on-surface-variant text-center flex items-center justify-center gap-1.5 cursor-pointer hover:bg-surface-variant transition-colors" id="btnGeocodeLivePrompt">
          <span class="material-symbols-outlined text-primary text-sm">search</span>
          <span>Search location "<b>${inputElement.value}</b>" on map</span>
        </div>
      `;
      container.classList.remove('hidden');

      const btnGeocode = document.getElementById('btnGeocodeLivePrompt');
      if (btnGeocode) {
        btnGeocode.addEventListener('click', async () => {
          container.classList.add('hidden');
          const geo = await forwardGeocode(inputElement.value);
          if (geo) {
            if (isFrom) applyFromLocation(geo.name, geo.lat, geo.lng);
            else applyToLocation(geo.name, geo.lat, geo.lng);
            showLocationToast(`Resolved: ${geo.name}`);
          }
        });
      }
      return;
    }

    let html = '';
    matches.forEach(item => {
      const icon = item.type === 'bus_stand' ? 'directions_bus' : 'location_city';
      html += `
        <div class="suggestion-item p-2.5 flex items-center gap-2.5 hover:bg-surface-variant cursor-pointer transition-colors" data-name="${item.name}" data-lat="${item.lat}" data-lng="${item.lng}">
          <span class="material-symbols-outlined text-primary text-[18px] shrink-0">${icon}</span>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-on-surface text-xs truncate">${item.name.split(',')[0]}</p>
            <p class="text-[10px] text-on-surface-variant truncate">${item.name}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    container.classList.remove('hidden');

    container.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-name');
        const lat = parseFloat(el.getAttribute('data-lat'));
        const lng = parseFloat(el.getAttribute('data-lng'));

        if (isFrom) {
          applyFromLocation(name, lat, lng);
        } else {
          applyToLocation(name, lat, lng);
        }

        container.classList.add('hidden');
        showLocationToast(`Selected: ${name.split(',')[0]}`);
      });
    });
  };

  // 1. "From" input typing
  if (inputSearchFrom) {
    inputSearchFrom.addEventListener('focus', () => {
      activeTarget = 'from';
      if (btnClearFrom) btnClearFrom.classList.toggle('hidden', !inputSearchFrom.value);
    });

    inputSearchFrom.addEventListener('input', () => {
      if (btnClearFrom) btnClearFrom.classList.toggle('hidden', !inputSearchFrom.value);
      clearTimeout(debounceTimerFrom);
      debounceTimerFrom = setTimeout(async () => {
        renderSuggestions(dropdownSuggestionsFrom, inputSearchFrom, true);
        const geo = await forwardGeocode(inputSearchFrom.value);
        if (geo) {
          applyFromLocation(geo.name, geo.lat, geo.lng, false);
        }
      }, 350);
    });

    inputSearchFrom.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        dropdownSuggestionsFrom.classList.add('hidden');
        const geo = await forwardGeocode(inputSearchFrom.value);
        if (geo) applyFromLocation(geo.name, geo.lat, geo.lng);
      }
    });
  }

  // 2. "To" input typing
  if (inputSearchTo) {
    inputSearchTo.addEventListener('focus', () => {
      activeTarget = 'to';
      if (btnClearTo) btnClearTo.classList.toggle('hidden', !inputSearchTo.value);
    });

    inputSearchTo.addEventListener('input', () => {
      if (btnClearTo) btnClearTo.classList.toggle('hidden', !inputSearchTo.value);
      clearTimeout(debounceTimerTo);
      debounceTimerTo = setTimeout(async () => {
        renderSuggestions(dropdownSuggestionsTo, inputSearchTo, false);
        const geo = await forwardGeocode(inputSearchTo.value);
        if (geo) {
          applyToLocation(geo.name, geo.lat, geo.lng, false);
        }
      }, 350);
    });

    inputSearchTo.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        dropdownSuggestionsTo.classList.add('hidden');
        const geo = await forwardGeocode(inputSearchTo.value);
        if (geo) applyToLocation(geo.name, geo.lat, geo.lng);
      }
    });
  }

  // Clear Buttons
  if (btnClearFrom) {
    btnClearFrom.addEventListener('click', () => {
      inputSearchFrom.value = '';
      btnClearFrom.classList.add('hidden');
      dropdownSuggestionsFrom.classList.add('hidden');
      inputSearchFrom.focus();
    });
  }

  if (btnClearTo) {
    btnClearTo.addEventListener('click', () => {
      inputSearchTo.value = '';
      btnClearTo.classList.add('hidden');
      dropdownSuggestionsTo.classList.add('hidden');
      inputSearchTo.focus();
    });
  }

  // Swap Route Button
  if (btnSwapRoute) {
    btnSwapRoute.addEventListener('click', () => {
      const temp = { ...fromLocation };
      fromLocation = { ...toLocation };
      toLocation = { ...temp };

      applyFromLocation(fromLocation.name, fromLocation.lat, fromLocation.lng, false);
      applyToLocation(toLocation.name, toLocation.lat, toLocation.lng, false);

      showLocationToast('⇄ Route swapped: Origin & Destination inverted');
    });
  }

  // Quick GPS Button in From Input
  if (btnGpsFrom) {
    btnGpsFrom.addEventListener('click', () => {
      activeTarget = 'from';
      requestLiveDeviceLocation(true);
    });
  }

  // Pick on Map Button in To Input
  if (btnPickOnMapTo) {
    btnPickOnMapTo.addEventListener('click', () => {
      activeTarget = 'to';
      showLocationToast('🏁 Tap anywhere on the map to place Destination pin');
    });
  }

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#inputSearchFrom') && !e.target.closest('#dropdownSuggestionsFrom')) {
      if (dropdownSuggestionsFrom) dropdownSuggestionsFrom.classList.add('hidden');
    }
    if (!e.target.closest('#inputSearchTo') && !e.target.closest('#dropdownSuggestionsTo')) {
      if (dropdownSuggestionsTo) dropdownSuggestionsTo.classList.add('hidden');
    }
  });

  // -------------------------------------------------------------
  // Map Floating Buttons & Banner Permission Handlers (Step 3)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Location Modal Handlers
  // -------------------------------------------------------------
  const openLocationModal = () => {
    if (locationPickerModal) locationPickerModal.classList.remove('hidden');
  };
  const closeLocationModal = () => {
    if (locationPickerModal) locationPickerModal.classList.add('hidden');
  };

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
      if (activeTarget === 'to') {
        applyToLocation(name, lat, lng);
      } else {
        applyFromLocation(name, lat, lng);
      }
      closeLocationModal();
      showLocationToast(`Selected ${name.split(',')[0]}`);
    });
  });

  // -------------------------------------------------------------
  // BACKEND MULTI-MODAL BOOKING INTEGRATION
  // -------------------------------------------------------------

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
    } else if (route === 'HR-GGN-HDL') {
      baseBusFare = 180;
      busName = 'Fleet Bus #204';
      corridorText = 'Gurgaon ➔ Hodal';
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

  const openBookingModalWithContext = () => {
    if (bookingModal) bookingModal.classList.remove('hidden');

    const senderAddrInput = document.getElementById('bookingSenderAddress');
    const receiverAddrInput = document.getElementById('bookingReceiverAddress');

    if (senderAddrInput) senderAddrInput.value = fromLocation.name;
    if (receiverAddrInput) receiverAddrInput.value = toLocation.name;

    // Auto-select best matching corridor based on origin / destination
    if (bookingRouteSelect) {
      const combined = `${fromLocation.name} ${toLocation.name}`.toLowerCase();
      if (combined.includes('jaipur')) {
        bookingRouteSelect.value = 'HR-DEL-JPR';
      } else if (combined.includes('sirsa') || combined.includes('hisar') || combined.includes('rohtak')) {
        bookingRouteSelect.value = 'HR-DEL-SRS';
      } else if (combined.includes('narnaul') || combined.includes('rewari')) {
        bookingRouteSelect.value = 'HR-DEL-NRN';
      } else if (combined.includes('hodal') || combined.includes('faridabad')) {
        bookingRouteSelect.value = 'HR-GGN-HDL';
      } else {
        bookingRouteSelect.value = 'HR-DEL-CHD';
      }
    }

    computeFeasibilityAndFare();
  };

  if (btnOpenBookingModal) {
    btnOpenBookingModal.addEventListener('click', openBookingModalWithContext);
  }

  if (btnProceedBookingDirect) {
    btnProceedBookingDirect.addEventListener('click', openBookingModalWithContext);
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

  // Submit Booking Saga to Backend REST API
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
          address: fromLocation.name
        },
        recipient: {
          name: document.getElementById('bookingReceiverName')?.value || 'Rohan Verma',
          phone: document.getElementById('bookingReceiverPhone')?.value || '+91 98765 43211',
          address: document.getElementById('bookingReceiverAddress')?.value || toLocation.name
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

  // Notifications Drawer Handlers
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

  // -------------------------------------------------------------
  // Initialization Routine (Map & Location State)
  // -------------------------------------------------------------

  // 1. Check if user already saved locations
  const savedFrom = localStorage.getItem('transitly_pickup_location');
  if (savedFrom) {
    try {
      const parsed = JSON.parse(savedFrom);
      fromLocation.name = parsed.name;
      fromLocation.lat = parsed.lat;
      fromLocation.lng = parsed.lng;
    } catch (_) {}
  }

  const savedTo = localStorage.getItem('transitly_dropoff_location');
  if (savedTo) {
    try {
      const parsed = JSON.parse(savedTo);
      toLocation.name = parsed.name;
      toLocation.lat = parsed.lat;
      toLocation.lng = parsed.lng;
    } catch (_) {}
  }

  // 2. Initialize interactive Map
  initHomeMap();

  // 3. One-Time GPS Logic (Step 3)
  const isGpsPermissionGranted = localStorage.getItem('transitly_gps_permission_granted') === 'true';

  if (isGpsPermissionGranted) {
    // If previously granted, do not show banner; silently refresh live GPS in background
    if (locationPermissionBanner) locationPermissionBanner.classList.add('hidden');
    requestLiveDeviceLocation(false);
  } else {
    // Show one-time banner
    if (locationPermissionBanner) locationPermissionBanner.classList.remove('hidden');
  }

  // Apply initial texts to inputs
  if (inputSearchFrom) inputSearchFrom.value = fromLocation.name;
  if (inputSearchTo) inputSearchTo.value = toLocation.name;
});
