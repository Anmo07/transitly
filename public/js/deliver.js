/**
 * Transitly — Deliver / Home Controller with Interactive Map, Zoom, and Live Location Services
 */

document.addEventListener('DOMContentLoaded', () => {
  let homeMap = null;
  let userMarker = null;
  let userAccuracyCircle = null;
  let watchId = null;

  let currentLat = 28.4595;
  let currentLng = 77.0266;
  let currentLocationName = 'Gurgaon, Haryana';

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

  // Modal elements
  const locationPickerModal = document.getElementById('locationPickerModal');
  const btnCloseLocationModal = document.getElementById('btnCloseLocationModal');
  const btnTriggerGpsDetect = document.getElementById('btnTriggerGpsDetect');
  const inputCustomLocation = document.getElementById('inputCustomLocation');

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

    // Clean light-mode voyager tiles
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

    // Drag pin on map to pick custom location
    userMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      currentLat = pos.lat;
      currentLng = pos.lng;
      const reverseName = await reverseGeocode(pos.lat, pos.lng);
      applyLocationToUI(reverseName, pos.lat, pos.lng, false);
    });

    // Wire Zoom Buttons
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

    // Invalidate size
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

    // Update Map
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
        const accuracy = Math.round(position.coords.accuracy || 10);

        const revName = await reverseGeocode(lat, lng);
        applyLocationToUI(revName, lat, lng, true);

        // Hide permission banner once granted
        if (locationPermissionBanner) locationPermissionBanner.classList.add('hidden');
        closeLocationModal();

        // Continuous watch
        if (!watchId) {
          watchId = navigator.geolocation.watchPosition((pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            if (userMarker) userMarker.setLatLng([currentLat, currentLng]);
          }, null, { enableHighAccuracy: true, maximumAge: 10000 });
        }
      },
      (error) => {
        console.warn('Geolocation prompt notice:', error.message);
        if (fromUserPrompt) {
          alert('Location permission was not granted. You can select your pickup hub from the list.');
          openLocationModal();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Wire Map Floating Locate Me Button
  if (btnMapLocateMe) {
    btnMapLocateMe.addEventListener('click', (e) => {
      e.stopPropagation();
      requestLiveDeviceLocation(true);
    });
  }

  // Wire In-App Permission Banner Button
  if (btnAllowLocation) {
    btnAllowLocation.addEventListener('click', (e) => {
      e.stopPropagation();
      requestLiveDeviceLocation(true);
    });
  }

  // Modal Open / Close Handlers
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

  // GPS Button in Modal
  if (btnTriggerGpsDetect) {
    btnTriggerGpsDetect.addEventListener('click', () => {
      requestLiveDeviceLocation(true);
    });
  }

  // Quick Hub Buttons
  document.querySelectorAll('.hub-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const lat = parseFloat(btn.getAttribute('data-lat'));
      const lng = parseFloat(btn.getAttribute('data-lng'));
      applyLocationToUI(name, lat, lng, true);
      closeLocationModal();
    });
  });

  // Custom Search Input in Modal
  if (inputCustomLocation) {
    inputCustomLocation.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && inputCustomLocation.value.trim()) {
        const val = inputCustomLocation.value.trim();
        applyLocationToUI(val, null, null, false);
        closeLocationModal();
      }
    });
  }

  // Initialize Map and Location Pipeline
  initHomeMap(currentLat, currentLng);

  // Check saved or request IP & device GPS
  const saved = localStorage.getItem('transitly_pickup_location');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      applyLocationToUI(parsed.name, parsed.lat, parsed.lng, true);
    } catch (_) {}
  } else {
    // Show banner to ask user for Location Services
    if (locationPermissionBanner) locationPermissionBanner.classList.remove('hidden');

    // Auto-detect fast initial IP location
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client')
      .then(res => res.json())
      .then(data => {
        const city = data.city || data.locality || data.principalSubdivision;
        if (city && data.latitude && data.longitude) {
          applyLocationToUI(`${city}, ${data.principalSubdivision || ''}`.replace(/,\s*$/, ''), data.latitude, data.longitude, true);
        }
      })
      .catch(() => {});

    // Trigger browser prompt
    requestLiveDeviceLocation(false);
  }

  // Search input redirects to tracking or booking
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = homeSearchInput.value.trim();
        if (val.toUpperCase().startsWith('TRK-')) {
          window.location.href = `/tracking?id=${encodeURIComponent(val.toUpperCase())}`;
        } else {
          window.location.href = `/tracking?id=TRK-88219`;
        }
      }
    });
  }
});
