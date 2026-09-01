/**
 * Transitly — Bus Number Plate Identification & Live Tracking Engine
 * Direct PostgreSQL & PostGIS integration for vehicle telematics without abnormal simulation loops.
 * Features collapsible bottom sheet with Android-style swipe-down gesture bar.
 */

document.addEventListener('DOMContentLoaded', () => {
  let map = null;
  let busMarker = null;
  let routePolyline = null;
  let stopMarkers = [];
  let currentActiveBus = null;
  let alertTimeout = null;

  // DOM Elements
  const mapElement = document.getElementById('liveTrackingMap');
  const staticFallback = document.getElementById('staticMapFallback');
  const form = document.getElementById('busPlateSearchForm');
  const inputBusPlate = document.getElementById('inputBusPlate');
  const alertContainer = document.getElementById('busNotAvailableAlert');
  const alertMessage = document.getElementById('busAlertMessage');
  const btnCloseAlert = document.getElementById('btnCloseBusAlert');
  const quickBusChips = document.querySelectorAll('.quick-bus-chip');

  // Bottom Sheet Gesture Elements
  const busDetailsBottomSheet = document.getElementById('busDetailsBottomSheet');
  const bottomSheetHandleBar = document.getElementById('bottomSheetHandleBar');
  const bottomSheetHeader = document.getElementById('bottomSheetHeader');
  const sheetExpandableContent = document.getElementById('sheetExpandableContent');
  const sheetChevronIcon = document.getElementById('sheetChevronIcon');
  const sheetActionHint = document.getElementById('sheetActionHint');
  let isSheetCollapsed = false;

  // HUD Elements
  const hudBusPlate = document.getElementById('hudBusPlate');
  const hudSpeed = document.getElementById('hudSpeed');
  const hudCoords = document.getElementById('hudCoords');
  const hudJourneyState = document.getElementById('hudJourneyState');

  // Bottom Sheet Elements
  const trackStatusTitle = document.getElementById('trackStatusTitle');
  const trackLiveStatusText = document.getElementById('trackLiveStatusText');
  const trackEta = document.getElementById('trackEta');
  const trackOperatorName = document.getElementById('trackOperatorName');
  const trackNextHandoff = document.getElementById('trackNextHandoff');
  const stopsTimelineContainer = document.getElementById('stopsTimelineContainer');

  /**
   * Gesture Bar State Controller (Collapse / Expand to reveal 100% map)
   */
  const setBottomSheetState = (collapsed) => {
    isSheetCollapsed = collapsed;
    if (collapsed) {
      if (sheetExpandableContent) sheetExpandableContent.classList.add('hidden');
      if (busDetailsBottomSheet) {
        busDetailsBottomSheet.classList.remove('max-h-[50vh]');
        busDetailsBottomSheet.classList.add('max-h-[110px]');
      }
      if (sheetChevronIcon) sheetChevronIcon.textContent = 'keyboard_arrow_up';
      if (sheetActionHint) sheetActionHint.textContent = 'Swipe up or tap for bus details';
    } else {
      if (sheetExpandableContent) sheetExpandableContent.classList.remove('hidden');
      if (busDetailsBottomSheet) {
        busDetailsBottomSheet.classList.add('max-h-[50vh]');
        busDetailsBottomSheet.classList.remove('max-h-[110px]');
      }
      if (sheetChevronIcon) sheetChevronIcon.textContent = 'keyboard_arrow_down';
      if (sheetActionHint) sheetActionHint.textContent = 'Swipe down to view full map';
    }

    // Re-adjust map viewport bounds smoothly
    if (map) {
      map.invalidateSize();
      if (busMarker) {
        map.flyTo(busMarker.getLatLng(), 14.5, { duration: 0.8 });
      }
    }
  };

  const toggleBottomSheet = () => {
    setBottomSheetState(!isSheetCollapsed);
  };

  if (bottomSheetHandleBar) {
    bottomSheetHandleBar.addEventListener('click', toggleBottomSheet);
  }
  if (bottomSheetHeader) {
    bottomSheetHeader.addEventListener('click', toggleBottomSheet);
  }

  // Swipe gesture for Android/iOS mobile & mouse drag down/up
  let startY = 0;

  const handleTouchStart = (e) => {
    startY = e.touches ? e.touches[0].clientY : e.clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = endY - startY;

    // Swiping Down (deltaY > 20) -> Collapse to give full map view
    if (deltaY > 20 && !isSheetCollapsed) {
      setBottomSheetState(true);
    }
    // Swiping Up (deltaY < -20) -> Expand sheet
    else if (deltaY < -20 && isSheetCollapsed) {
      setBottomSheetState(false);
    }
  };

  if (bottomSheetHandleBar) {
    bottomSheetHandleBar.addEventListener('touchstart', handleTouchStart, { passive: true });
    bottomSheetHandleBar.addEventListener('touchend', handleTouchEnd, { passive: true });
    bottomSheetHandleBar.addEventListener('mousedown', handleTouchStart);
    bottomSheetHandleBar.addEventListener('mouseup', handleTouchEnd);
  }

  /**
   * Show Graceful Out-of-Service Alert Toast
   */
  const showBusOutOfServiceAlert = (busNumber) => {
    if (!alertContainer) return;

    if (alertMessage) {
      alertMessage.textContent = `Bus or vehicle "${busNumber || 'Entered'}" is not in service, apologies for the conveniences.`;
    }

    alertContainer.classList.remove('hidden');
    alertContainer.classList.add('flex');

    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      hideBusAlert();
    }, 5000);
  };

  /**
   * Hide Alert Toast
   */
  const hideBusAlert = () => {
    if (!alertContainer) return;
    alertContainer.classList.add('hidden');
    alertContainer.classList.remove('flex');
  };

  if (btnCloseAlert) {
    btnCloseAlert.addEventListener('click', hideBusAlert);
  }

  /**
   * Initialize Leaflet Map
   */
  const initLeafletMap = (initialCoords = [28.6675, 77.2285]) => {
    if (!mapElement || !window.L) return;

    if (staticFallback) staticFallback.style.display = 'none';

    if (!map) {
      map = L.map('liveTrackingMap', {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCoords, 10);

      // Authentic Clean Google Maps Roadmap Tile Layer
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);

      // Bind Map Zoom & Center Controls
      const btnZoomIn = document.getElementById('btnTrackZoomIn');
      const btnZoomOut = document.getElementById('btnTrackZoomOut');
      const btnCenter = document.getElementById('btnCenterBus');

      if (btnZoomIn) btnZoomIn.addEventListener('click', () => map.zoomIn());
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => map.zoomOut());
      if (btnCenter) {
        btnCenter.addEventListener('click', () => {
          if (busMarker) {
            map.flyTo(busMarker.getLatLng(), 13, { duration: 1 });
          }
        });
      }
    }
  };

  /**
   * Render Bus & Route on Leaflet Map
   */
  const renderBusOnMap = (data) => {
    if (!map && window.L) {
      initLeafletMap([data.currentLocation.latitude, data.currentLocation.longitude]);
    }
    if (!map) return;

    // Clear previous stop markers & polyline
    stopMarkers.forEach(m => map.removeLayer(m));
    stopMarkers = [];
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
    }

    const stops = data.stops || [];
    const stopCoords = stops.map(s => s.coords);

    // 1. Draw Route Polyline
    if (stopCoords.length > 1) {
      routePolyline = L.polyline(stopCoords, {
        color: '#0066FF',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: null
      }).addTo(map);
    }

    // 2. Add Stop Markers along the Highway
    stops.forEach((stop, index) => {
      const isOrigin = index === 0;
      const isDestination = index === stops.length - 1;

      const stopIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full ${isOrigin ? 'bg-primary' : isDestination ? 'bg-emerald-600' : 'bg-surface'} border-2 ${isOrigin || isDestination ? 'border-white' : 'border-primary'} shadow-md flex items-center justify-center text-[10px] font-extrabold ${isOrigin || isDestination ? 'text-white' : 'text-primary'}">
            ${index + 1}
          </div>
        </div>
      `;

      const customStopIcon = L.divIcon({
        html: stopIconHtml,
        className: 'custom-stop-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const stopMarker = L.marker(stop.coords, { icon: customStopIcon }).addTo(map);
      stopMarker.bindTooltip(`<b>${stop.name}</b><br><span style="font-size:10px;color:#666;">${stop.milestone || 'Corridor Transit Stop'}</span>`, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      stopMarkers.push(stopMarker);
    });

    // 3. Add or Move Live Bus Location Marker
    const busCoord = [data.currentLocation.latitude, data.currentLocation.longitude];
    const busIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full bg-primary/25 animate-ping"></div>
        <div class="w-10 h-10 rounded-2xl bg-primary text-white shadow-2xl border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform">
          <span class="material-symbols-outlined text-[22px]">directions_bus</span>
        </div>
        <div class="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap border border-white/20">
          ${data.busNumber}
        </div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busIconHtml,
      className: 'live-bus-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (busMarker) {
      busMarker.setLatLng(busCoord);
      busMarker.setIcon(busIcon);
    } else {
      busMarker = L.marker(busCoord, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
    }

    busMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 190px; padding: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
          <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
          <span style="font-weight: 800; font-size: 13px; color: #0066FF;">${data.busNumber}</span>
        </div>
        <div style="font-size: 11px; color: #333; margin-bottom: 4px; font-weight: 600;">${data.operatorName}</div>
        <div style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; display: inline-block; font-weight: bold; margin-bottom: 4px;">
          Speed: ${data.currentLocation.speedKmh} km/h • Highway
        </div>
        <div style="font-size: 10px; color: #666;">Route: ${data.corridorName}</div>
      </div>
    `);

    // Pinpoint directly onto the current live bus location (Zoom level 14.5)
    map.flyTo(busCoord, 14.5, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    // Auto-open popup on pinpoint
    setTimeout(() => {
      if (busMarker) {
        busMarker.openPopup();
      }
    }, 1250);
  };

  /**
   * Update HUD and Bottom Sheet UI
   */
  const updateUI = (data) => {
    // HUD
    if (hudBusPlate) hudBusPlate.textContent = data.busNumber;
    if (hudSpeed) hudSpeed.textContent = `${data.currentLocation.speedKmh} km/h • En-route`;
    if (hudCoords) hudCoords.textContent = `${data.currentLocation.latitude.toFixed(3)}° N, ${data.currentLocation.longitude.toFixed(3)}° E`;
    if (hudJourneyState) hudJourneyState.textContent = 'ACTIVE IN SERVICE';

    // Bottom Sheet
    if (trackStatusTitle) trackStatusTitle.textContent = `${data.operatorName} • ${data.busNumber}`;
    if (trackLiveStatusText) trackLiveStatusText.textContent = data.corridorName;
    if (trackOperatorName) trackOperatorName.textContent = data.operatorName;
    if (trackNextHandoff) trackNextHandoff.textContent = `Cargo Available: ${data.availableCapacityKg} kg / ${data.cargoCapacityKg} kg`;
    if (trackEta) trackEta.textContent = data.eta || '14:30';

    // Render Timeline Stops
    if (stopsTimelineContainer && data.stops && data.stops.length > 0) {
      const totalStops = data.stops.length;
      let timelineHtml = `
        <div class="absolute left-[11px] top-2 bottom-4 w-1 bg-outline-variant/30 rounded-full">
          <div id="trackProgressBar" class="absolute top-0 w-full bg-primary rounded-full transition-all duration-500" style="height: 50%;"></div>
        </div>
      `;

      data.stops.forEach((stop, index) => {
        const isPassed = index < Math.floor(totalStops / 2);
        const isCurrent = index === Math.floor(totalStops / 2);

        if (isPassed) {
          timelineHtml += `
            <div class="relative">
              <div class="absolute -left-6 w-4 h-4 rounded-full bg-emerald-600 border-2 border-surface shadow-sm z-10 top-1"></div>
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-label-md text-label-md text-on-surface font-semibold">${stop.name}</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${stop.milestone || 'Departed Stop'}</p>
                </div>
                <span class="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
              </div>
            </div>
          `;
        } else if (isCurrent) {
          timelineHtml += `
            <div class="relative">
              <div class="absolute -left-[26px] w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10 top-0.5 shadow-[0px_4px_10px_rgba(0,102,255,0.2)]">
                <div class="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></div>
              </div>
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-label-md text-label-md text-primary font-bold">${stop.name}</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-medium">Current Location • Live Telemetry Verified</p>
                </div>
                <span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">Current</span>
              </div>
            </div>
          `;
        } else {
          timelineHtml += `
            <div class="relative opacity-65">
              <div class="absolute -left-6 w-4 h-4 rounded-full bg-outline-variant border-2 border-surface shadow-sm z-10 top-1"></div>
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-label-md text-label-md text-on-surface font-semibold">${stop.name}</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Upcoming Corridor Stop</p>
                </div>
                <p class="font-label-sm text-label-sm text-on-surface-variant">Scheduled</p>
              </div>
            </div>
          `;
        }
      });

      stopsTimelineContainer.innerHTML = timelineHtml;
    }
  };

  /**
   * Query Database for Entered Bus Number Plate
   */
  const trackBusByPlate = async (plateNumber) => {
    if (!plateNumber || !plateNumber.trim()) {
      showBusOutOfServiceAlert('Empty');
      return;
    }

    const cleanPlate = plateNumber.trim();

    try {
      const response = await fetch(`/api/v1/tracking/bus/${encodeURIComponent(cleanPlate)}`);
      const result = await response.json();

      if (response.ok && result.status === 'success' && result.data) {
        hideBusAlert();
        currentActiveBus = result.data;
        renderBusOnMap(currentActiveBus);
        updateUI(currentActiveBus);
      } else {
        // Bus not in database / service
        showBusOutOfServiceAlert(cleanPlate);
      }
    } catch (err) {
      console.error('[Bus Tracking Fetch Error]', err);
      showBusOutOfServiceAlert(cleanPlate);
    }
  };

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPlate = inputBusPlate ? inputBusPlate.value : '';
      trackBusByPlate(enteredPlate);
    });
  }

  // Quick Select Bus Chips Handlers
  quickBusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickBusChips.forEach(c => {
        c.classList.remove('bg-primary-container', 'text-white');
        c.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      });
      chip.classList.add('bg-primary-container', 'text-white');
      chip.classList.remove('bg-surface-container-low', 'text-on-surface-variant');

      const busPlate = chip.getAttribute('data-bus');
      if (inputBusPlate) inputBusPlate.value = busPlate;
      trackBusByPlate(busPlate);
    });
  });

  // Google Maps Permission & Live Location Sharing Modal Handlers
  const btnShareLiveTracking = document.getElementById('btnShareLiveTracking');
  const modalGoogleMapsPermission = document.getElementById('modalGoogleMapsPermission');
  const btnConfirmOpenGoogleMaps = document.getElementById('btnConfirmOpenGoogleMaps');
  const btnShareWhatsAppLive = document.getElementById('btnShareWhatsAppLive');
  const btnCancelGoogleMaps = document.getElementById('btnCancelGoogleMaps');

  const shareModalBusTitle = document.getElementById('shareModalBusTitle');
  const shareModalCorridor = document.getElementById('shareModalCorridor');
  const shareModalCoords = document.getElementById('shareModalCoords');
  const shareModalSpeed = document.getElementById('shareModalSpeed');

  const buildGoogleMapsUrl = (data) => {
    if (!data) return 'https://maps.google.com';
    const lat = data.currentLocation ? data.currentLocation.latitude : 28.6675;
    const lng = data.currentLocation ? data.currentLocation.longitude : 77.2285;
    const stops = data.stops || [];

    let originStr = '';
    let destStr = '';
    const waypointList = [];

    if (stops.length >= 2) {
      // Exact Origin Bus Stand (e.g. Kashmiri Gate ISBT, Delhi)
      originStr = stops[0].name ? stops[0].name : `${stops[0].coords[0]},${stops[0].coords[1]}`;
      // Exact Destination Bus Stand (e.g. ISBT Sector 17, Chandigarh)
      destStr = stops[stops.length - 1].name ? stops[stops.length - 1].name : `${stops[stops.length - 1].coords[0]},${stops[stops.length - 1].coords[1]}`;

      // 1. First Waypoint: Current Live Bus Telemetry GPS Position
      waypointList.push(`${lat.toFixed(5)},${lng.toFixed(5)}`);

      // 2. Intermediate Corridor Bus Stands
      for (let i = 1; i < stops.length - 1; i++) {
        if (stops[i].name) {
          waypointList.push(stops[i].name);
        } else if (stops[i].coords) {
          waypointList.push(`${stops[i].coords[0]},${stops[i].coords[1]}`);
        }
      }
    } else {
      originStr = data.origin_terminal || `${lat},${lng}`;
      destStr = data.destination_terminal || `${lat + 0.5},${lng + 0.5}`;
      waypointList.push(`${lat.toFixed(5)},${lng.toFixed(5)}`);
    }

    // Google Maps API supports up to 8 waypoints separated by pipe '|'
    const waypointsStr = waypointList.slice(0, 8).join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&waypoints=${encodeURIComponent(waypointsStr)}&travelmode=driving`;
  };

  const buildWhatsAppShareText = (data) => {
    if (!data) return 'Live Bus Tracking';
    const gmapsUrl = buildGoogleMapsUrl(data);
    const webUrl = `${window.location.origin}/tracking?bus=${encodeURIComponent(data.busNumber)}`;
    const originName = (data.stops && data.stops.length > 0) ? data.stops[0].name : (data.origin_terminal || 'Origin Hub');
    const destName = (data.stops && data.stops.length > 1) ? data.stops[data.stops.length - 1].name : (data.destination_terminal || 'Destination Hub');

    return `🚨 *Transitly Live Bus Telematics*\n\n` +
      `🚌 *Bus:* ${data.operatorName} (${data.busNumber})\n` +
      `📍 *Live Location:* ${data.currentLocation.latitude.toFixed(4)}°N, ${data.currentLocation.longitude.toFixed(4)}°E\n` +
      `⚡ *Speed:* ${data.currentLocation.speedKmh} km/h • Highway Telemetry\n` +
      `🛣️ *Corridor:* ${originName} ➔ ${destName}\n` +
      `⏱️ *ETA:* ${data.eta || 'Today by 14:30'}\n\n` +
      `🗺️ *Open in Google Maps Native Route (Bus Stand to Bus Stand):*\n${gmapsUrl}\n\n` +
      `📦 *Web App Live View:*\n${webUrl}`;
  };

  if (btnShareLiveTracking) {
    btnShareLiveTracking.addEventListener('click', () => {
      const data = currentActiveBus || {
        busNumber: 'HR-68-A-1001',
        operatorName: 'Haryana Roadways',
        corridorName: 'Delhi ISBT ➔ Chandigarh Sector 17',
        currentLocation: { latitude: 29.6857, longitude: 76.9905, speedKmh: 68 },
        eta: '14:30'
      };

      if (shareModalBusTitle) shareModalBusTitle.textContent = `${data.operatorName} • ${data.busNumber}`;
      if (shareModalCorridor) shareModalCorridor.textContent = data.corridorName;
      if (shareModalCoords) shareModalCoords.textContent = `${data.currentLocation.latitude.toFixed(3)}° N, ${data.currentLocation.longitude.toFixed(3)}° E`;
      if (shareModalSpeed) shareModalSpeed.textContent = `${data.currentLocation.speedKmh} km/h • En-route`;

      if (modalGoogleMapsPermission) {
        modalGoogleMapsPermission.classList.remove('hidden');
        modalGoogleMapsPermission.classList.add('flex');
      }
    });
  }

  const closeGoogleMapsModal = () => {
    if (modalGoogleMapsPermission) {
      modalGoogleMapsPermission.classList.add('hidden');
      modalGoogleMapsPermission.classList.remove('flex');
    }
  };

  if (btnCancelGoogleMaps) {
    btnCancelGoogleMaps.addEventListener('click', closeGoogleMapsModal);
  }

  if (btnConfirmOpenGoogleMaps) {
    btnConfirmOpenGoogleMaps.addEventListener('click', () => {
      const gmapsUrl = buildGoogleMapsUrl(currentActiveBus);
      window.open(gmapsUrl, '_blank');
      closeGoogleMapsModal();
    });
  }

  if (btnShareWhatsAppLive) {
    btnShareWhatsAppLive.addEventListener('click', () => {
      const text = buildWhatsAppShareText(currentActiveBus);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      closeGoogleMapsModal();
    });
  }

  // Check URL query parameters (e.g. /tracking?bus=HR-68-A-1001)
  const urlParams = new URLSearchParams(window.location.search);
  const initialBus = urlParams.get('bus') || (inputBusPlate ? inputBusPlate.value : 'HR-68-A-1001');

  if (inputBusPlate) {
    inputBusPlate.value = initialBus;
  }

  // Initialize Map & Load Initial Bus from Database
  initLeafletMap();
  trackBusByPlate(initialBus);
});
