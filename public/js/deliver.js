/**
 * Transitly — Deliver / Home Controller with Live Device Geolocation
 */

document.addEventListener('DOMContentLoaded', () => {
  const liveLocationText = document.getElementById('liveLocationText');
  const livePickupBadge = document.getElementById('livePickupBadge');
  const liveGpsDot = document.getElementById('liveGpsDot');
  const liveLocationPinContainer = document.getElementById('liveLocationPinContainer');
  const homeSearchInput = document.getElementById('homeSearchInput');

  let currentLat = null;
  let currentLng = null;
  let currentLocationName = 'Current Location';

  /**
   * Reverse Geocode coordinates to human-readable address
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const area = address.suburb || address.neighbourhood || address.residential || address.commercial || address.road;
        const city = address.city || address.town || address.village || address.state_district || address.county || address.state;

        if (area && city) return `${area}, ${city}`;
        if (city) return city;
        if (data.display_name) return data.display_name.split(',').slice(0, 2).join(', ');
      }
    } catch (_) {
      // Fallback on network or timeout
    }
    return `Lat ${lat.toFixed(3)}°, Lng ${lng.toFixed(3)}°`;
  };

  /**
   * Fetch Live Current Geolocation
   */
  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      if (liveLocationText) liveLocationText.innerText = '📍 Pickup: Default Hub (GPS Unsupported)';
      return;
    }

    if (liveLocationText) liveLocationText.innerText = 'Detecting GPS position...';
    if (liveGpsDot) liveGpsDot.className = 'w-2 h-2 rounded-full bg-yellow-300 animate-ping';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 15);

        // Reverse geocode
        currentLocationName = await reverseGeocode(currentLat, currentLng);

        // Update UI
        if (liveLocationText) {
          liveLocationText.innerText = `📍 Pickup: ${currentLocationName}`;
        }
        if (liveGpsDot) {
          liveGpsDot.className = 'w-2 h-2 rounded-full bg-white';
        }
        if (livePickupBadge) {
          livePickupBadge.className = 'bg-[#128C55] text-white px-4 py-1.5 rounded-full text-label-md font-label-md mb-2 shadow-level-1 flex items-center gap-1.5 transition-all';
          livePickupBadge.title = `Live Location: ${currentLocationName} (Accuracy: ±${accuracy}m)`;
        }
        if (homeSearchInput) {
          homeSearchInput.placeholder = `From: ${currentLocationName} ➔ Where to send?`;
        }

        // Save session state
        sessionStorage.setItem('transitly_user_location', JSON.stringify({
          lat: currentLat,
          lng: currentLng,
          name: currentLocationName,
          timestamp: Date.now()
        }));
      },
      (error) => {
        console.warn('Geolocation notice:', error.message);
        if (liveLocationText) {
          liveLocationText.innerText = '📍 Pickup: Current Location (Tap to retry)';
        }
        if (liveGpsDot) {
          liveGpsDot.className = 'w-2 h-2 rounded-full bg-white/70';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Immediate location detection
  detectLiveLocation();

  // Tap pin to refresh location
  if (liveLocationPinContainer) {
    liveLocationPinContainer.addEventListener('click', () => {
      detectLiveLocation();
    });
  }

  // Home Quick Search
  const btnQuickSearch = document.getElementById('btnQuickSearch');
  const executeSearch = () => {
    const val = homeSearchInput ? homeSearchInput.value.trim() : '';
    if (val.toUpperCase().startsWith('TRK-') || val.length >= 5) {
      window.location.href = `/tracking?id=${encodeURIComponent(val)}`;
    } else {
      window.location.href = `/tracking?id=TRK-88219`;
    }
  };

  if (btnQuickSearch) btnQuickSearch.addEventListener('click', executeSearch);
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }
});
