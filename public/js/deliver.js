/**
 * Transitly — Deliver / Home Controller with Multi-Tiered Live Geolocation
 */

document.addEventListener('DOMContentLoaded', () => {
  const liveLocationText = document.getElementById('liveLocationText');
  const livePickupBadge = document.getElementById('livePickupBadge');
  const liveGpsDot = document.getElementById('liveGpsDot');
  const liveLocationPinContainer = document.getElementById('liveLocationPinContainer');
  const homeSearchInput = document.getElementById('homeSearchInput');

  // Modal elements
  const locationPickerModal = document.getElementById('locationPickerModal');
  const btnCloseLocationModal = document.getElementById('btnCloseLocationModal');
  const btnTriggerGpsDetect = document.getElementById('btnTriggerGpsDetect');
  const inputCustomLocation = document.getElementById('inputCustomLocation');

  let currentLat = 28.4595;
  let currentLng = 77.0266;
  let currentLocationName = 'Gurgaon, Haryana';

  /**
   * Update all UI elements with the active location
   */
  const applyLocationToUI = (name, lat, lng) => {
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
      livePickupBadge.title = `Current Pickup: ${currentLocationName} (Click to change)`;
    }
    if (homeSearchInput) {
      homeSearchInput.placeholder = `From: ${currentLocationName} ➔ Where to send?`;
    }

    // Persist
    localStorage.setItem('transitly_pickup_location', JSON.stringify({
      name: currentLocationName,
      lat: currentLat,
      lng: currentLng,
      time: Date.now()
    }));
  };

  /**
   * Tier 1: Instant Client IP Geolocation (Zero Permission, Instantaneous)
   */
  const detectLocationByIP = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Fast BigDataCloud Reverse IP Client
      const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const state = data.principalSubdivision || data.countryName;
        if (city) {
          applyLocationToUI(`${city}, ${state}`, data.latitude, data.longitude);
          return true;
        }
      }
    } catch (_) {
      // Fallback
    }

    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.city) {
          applyLocationToUI(`${data2.city}, ${data2.region}`, data2.latitude, data2.longitude);
          return true;
        }
      }
    } catch (_) {}

    return false;
  };

  /**
   * Tier 2: Browser Device GPS (High Accuracy Refinement)
   */
  const detectLocationByGPS = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert('Geolocation is not supported by your browser.');
      return;
    }

    if (!silent && liveLocationText) {
      liveLocationText.innerText = 'Detecting live device GPS...';
      if (liveGpsDot) liveGpsDot.className = 'w-2 h-2 rounded-full bg-yellow-300 animate-ping';
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          if (res.ok) {
            const data = await res.json();
            const locality = data.locality || data.suburb || data.city;
            const city = data.city || data.principalSubdivision;
            const label = locality && city && locality !== city ? `${locality}, ${city}` : (city || `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`);
            applyLocationToUI(label, lat, lng);
            closeLocationModal();
            return;
          }
        } catch (_) {}

        applyLocationToUI(`Live GPS (${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E)`, lat, lng);
        closeLocationModal();
      },
      (err) => {
        console.warn('GPS notice:', err.message);
        if (!silent) {
          // If GPS denied/unavailable, prompt user with location picker modal
          openLocationModal();
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  };

  /**
   * Modal Management
   */
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

  // Trigger GPS button inside modal
  if (btnTriggerGpsDetect) {
    btnTriggerGpsDetect.addEventListener('click', () => {
      detectLocationByGPS(false);
    });
  }

  // Quick Hub Select buttons
  document.querySelectorAll('.hub-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const lat = parseFloat(btn.getAttribute('data-lat'));
      const lng = parseFloat(btn.getAttribute('data-lng'));
      applyLocationToUI(name, lat, lng);
      closeLocationModal();
    });
  });

  // Custom Search Input in modal
  if (inputCustomLocation) {
    inputCustomLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && inputCustomLocation.value.trim()) {
        applyLocationToUI(inputCustomLocation.value.trim(), null, null);
        closeLocationModal();
      }
    });
  }

  // Initial Load Pipeline
  const saved = localStorage.getItem('transitly_pickup_location');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      applyLocationToUI(parsed.name, parsed.lat, parsed.lng);
    } catch (_) {}
  } else {
    // 1. Instantly detect location from IP
    detectLocationByIP().then((found) => {
      if (!found) {
        applyLocationToUI('Delhi NCR Hub (Default)', 28.6139, 77.2090);
      }
      // 2. Refine in background with GPS if authorized
      detectLocationByGPS(true);
    });
  }

  // Home Quick Search Input
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
