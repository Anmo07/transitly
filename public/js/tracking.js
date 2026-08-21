/**
 * Transitly — Live Journey Vehicle Simulation & Telematics Controller
 * High-FPS animated bus movement with Leaflet, real-time highway telematics, and Start/Restart/End lifecycle.
 */

document.addEventListener('DOMContentLoaded', () => {
  let map = null;
  let busMarker = null;
  let routePolyline = null;
  let stopMarkers = [];
  let journeyInterval = null;
  let isRunning = false;
  let currentSegmentIndex = 0;
  let currentSubStep = 0;
  let currentActiveRoute = null;
  let simSpeedMultiplier = 1;

  const SUB_STEPS_PER_SEGMENT = 30; // Smooth 30 sub-steps per stop segment

  // Multi-Corridor Database
  const routesData = {
    'TRK-88219': {
      trackingId: 'TRK-88219',
      busNumber: 'Fleet Bus #402 (HR-55-AB-1234)',
      corridorName: 'Delhi ➔ Chandigarh Express (GT Road / NH-44)',
      eta: '14:30',
      totalKm: 248,
      origin: 'Delhi Kashmiri Gate ISBT',
      destination: 'Chandigarh ISBT Sector 17',
      nextHandoff: 'ISBT Sector 17 ➔ Rapido Delivery Partner',
      stops: [
        { name: 'Kashmiri Gate ISBT, Delhi', coords: [28.6675, 77.2285], milestone: 'Departed Delhi Hub' },
        { name: 'Sonipat Highway Junction', coords: [28.9931, 77.0151], milestone: 'Passing Sonipat Toll Plaza' },
        { name: 'Panipat Elevated Highway', coords: [29.3909, 76.9635], milestone: 'Crossing Panipat Industrial Corridor' },
        { name: 'Karnal Oasis Depot', coords: [29.6857, 76.9905], milestone: 'Passing Karnal Midpoint Hub' },
        { name: 'Kurukshetra Pipli Junction', coords: [29.9695, 76.8783], milestone: 'Cruising Kurukshetra Sector 3' },
        { name: 'Ambala Cantt Interchange', coords: [30.3782, 76.7767], milestone: 'Approaching Ambala Flyover' },
        { name: 'Chandigarh Sector 17 ISBT', coords: [30.7410, 76.7790], milestone: 'Arrived at Chandigarh Destination Hub' }
      ]
    },
    'TRK-60912': {
      trackingId: 'TRK-60912',
      busNumber: 'Fleet Bus #108 (HR-66-XY-5678)',
      corridorName: 'Delhi ➔ Jaipur Superfast (NH-48)',
      eta: '16:45',
      totalKm: 270,
      origin: 'Dhaula Kuan Hub, Delhi',
      destination: 'Sindhi Camp ISBT, Jaipur',
      nextHandoff: 'Sindhi Camp ➔ Uber Direct Courier',
      stops: [
        { name: 'Dhaula Kuan Terminal, Delhi', coords: [28.5915, 77.1610], milestone: 'Departed Dhaula Kuan Terminal' },
        { name: 'Gurgaon IFFCO Chowk', coords: [28.4595, 77.0266], milestone: 'Cleared Gurgaon Cyber City Toll' },
        { name: 'Dharuhera Industrial Toll', coords: [28.2055, 76.8406], milestone: 'Crossing Dharuhera Flyover' },
        { name: 'Bawal Intercity Interchange', coords: [28.0050, 76.5800], milestone: 'Passing Bawal Express Node' },
        { name: 'Behror Midway Oasis', coords: [27.7900, 76.3200], milestone: 'Cruising Behror Highway corridor' },
        { name: 'Kotputli Express Bypass', coords: [27.3500, 75.9800], milestone: 'Passing Kotputli Junction' },
        { name: 'Sindhi Camp ISBT, Jaipur', coords: [26.9124, 75.7873], milestone: 'Arrived at Jaipur Destination Hub' }
      ]
    },
    'TRK-74911': {
      trackingId: 'TRK-74911',
      busNumber: 'Fleet Bus #515 (HR-26-CC-9012)',
      corridorName: 'Delhi ➔ Rohtak ➔ Hisar ➔ Sirsa (NH-9)',
      eta: '18:15',
      totalKm: 255,
      origin: 'Bahadurgarh Hub, Delhi NCR',
      destination: 'Sirsa ISBT Terminal',
      nextHandoff: 'Sirsa ISBT ➔ Local Courier Partner',
      stops: [
        { name: 'Bahadurgarh Gate, Delhi NCR', coords: [28.6920, 76.9240], milestone: 'Departed Bahadurgarh Hub' },
        { name: 'Rohtak New Bus Terminal', coords: [28.8955, 76.6066], milestone: 'Crossing Rohtak Bypass' },
        { name: 'Meham Intercity Expressway', coords: [29.0020, 76.2200], milestone: 'Passing Meham Highway Oasis' },
        { name: 'Hansi City Interchange', coords: [29.1000, 75.9600], milestone: 'Cruising Hansi Flyover' },
        { name: 'Hisar Cantt Central Hub', coords: [29.1492, 75.7217], milestone: 'Cleared Hisar Transit Checkpoint' },
        { name: 'Agroha Heritage Highway', coords: [29.3500, 75.6000], milestone: 'Approaching Agroha Toll' },
        { name: 'Sirsa ISBT Bus Terminal', coords: [29.5320, 75.0318], milestone: 'Arrived at Sirsa Destination Hub' }
      ]
    }
  };

  /**
   * Linear Coordinate Interpolation
   */
  const interpolateCoord = (start, end, fraction) => {
    return [
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction
    ];
  };

  /**
   * Bearing between 2 coords in degrees
   */
  const calculateBearing = (start, end) => {
    const lat1 = (start[0] * Math.PI) / 180;
    const lat2 = (end[0] * Math.PI) / 180;
    const dLng = ((end[1] - start[1]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  /**
   * Initialize Leaflet Interactive Map
   */
  const initLeafletMap = (route) => {
    const mapElement = document.getElementById('liveTrackingMap');
    const staticFallback = document.getElementById('staticMapFallback');
    if (!mapElement || !window.L) return;

    if (staticFallback) staticFallback.style.display = 'none';

    if (!map) {
      map = L.map('liveTrackingMap', {
        zoomControl: false,
        attributionControl: false
      }).setView(route.stops[0].coords, 10);

      // Authentic Google Maps Roadmap Tile Layer
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        attribution: '© Google Maps'
      }).addTo(map);

      // Wire zoom & center buttons
      const btnTrackZoomIn = document.getElementById('btnTrackZoomIn');
      const btnTrackZoomOut = document.getElementById('btnTrackZoomOut');
      const btnCenterBus = document.getElementById('btnCenterBus');

      if (btnTrackZoomIn) btnTrackZoomIn.addEventListener('click', () => map && map.zoomIn());
      if (btnTrackZoomOut) btnTrackZoomOut.addEventListener('click', () => map && map.zoomOut());
      if (btnCenterBus) {
        btnCenterBus.addEventListener('click', () => {
          if (busMarker && map) {
            map.flyTo(busMarker.getLatLng(), 13, { animate: true, duration: 1.0 });
          }
        });
      }
    }

    // Clear old stop markers
    stopMarkers.forEach(m => map.removeLayer(m));
    stopMarkers = [];

    // Render polyline route
    const allCoords = route.stops.map(s => s.coords);
    if (routePolyline) {
      routePolyline.setLatLngs(allCoords);
    } else {
      routePolyline = L.polyline(allCoords, {
        color: '#0050cb',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round'
      }).addTo(map);
    }

    // Stop markers
    route.stops.forEach((stop, index) => {
      const isEndpoint = index === 0 || index === route.stops.length - 1;
      const markerIcon = L.divIcon({
        className: 'stop-pin',
        html: `
          <div class="flex items-center justify-center w-5 h-5 rounded-full ${isEndpoint ? 'bg-primary border-2 border-white shadow-md' : 'bg-white border-2 border-primary shadow-sm'}">
            <span class="w-1.5 h-1.5 rounded-full ${isEndpoint ? 'bg-white' : 'bg-primary'}"></span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const marker = L.marker(stop.coords, { icon: markerIcon }).addTo(map).bindPopup(`<b>${stop.name}</b><br><span class="text-xs text-outline">${stop.milestone}</span>`);
      stopMarkers.push(marker);
    });

    // Custom Bus Marker with animated radar ping
    const busDivIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div id="busMarkerInner" class="relative flex items-center justify-center w-12 h-12 transition-transform duration-300">
          <div class="absolute w-12 h-12 rounded-full bg-primary/25 animate-ping"></div>
          <div class="w-9 h-9 rounded-full bg-primary border-2 border-white shadow-xl flex items-center justify-center text-white z-10">
            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    if (busMarker) {
      busMarker.setLatLng(route.stops[0].coords);
    } else {
      busMarker = L.marker(route.stops[0].coords, { icon: busDivIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // Fit map bounds with padding
    map.fitBounds(routePolyline.getBounds(), {
      paddingTopLeft: [20, 80],
      paddingBottomRight: [20, 180]
    });

    setTimeout(() => map && map.invalidateSize(), 300);
  };

  /**
   * Tick step execution (Runs continuously on interval)
   */
  const executeTick = () => {
    if (!currentActiveRoute) return;
    const route = currentActiveRoute;
    const totalStops = route.stops.length;

    const p1 = route.stops[currentSegmentIndex].coords;
    const p2 = route.stops[Math.min(currentSegmentIndex + 1, totalStops - 1)].coords;

    currentSubStep++;
    const fraction = currentSubStep / SUB_STEPS_PER_SEGMENT;
    const currentPos = interpolateCoord(p1, p2, Math.min(fraction, 1));

    // Move Bus Marker
    if (busMarker) {
      busMarker.setLatLng(currentPos);
    }

    // Smoothly pan map to follow vehicle every 5 steps
    if (map && currentSubStep % 5 === 0) {
      map.panTo(currentPos, { animate: true, duration: 0.5 });
    }

    // Calculate Telematics Metrics
    const totalStepsOverall = (totalStops - 1) * SUB_STEPS_PER_SEGMENT;
    const currentGlobalStep = currentSegmentIndex * SUB_STEPS_PER_SEGMENT + currentSubStep;
    const progressRatio = Math.min(currentGlobalStep / totalStepsOverall, 0.98);
    const progressPct = Math.round(15 + progressRatio * 82);

    const remainingDistanceKm = Math.max(0.4, (route.totalKm * (1 - progressRatio))).toFixed(1);
    const simulatedSpeed = (62 + Math.sin(currentGlobalStep / 2) * 8).toFixed(0);

    // Update Telematics HUD
    const hudSpeed = document.getElementById('hudSpeed');
    const hudCoords = document.getElementById('hudCoords');
    const trackDistance = document.getElementById('trackDistance');
    const trackProgressBar = document.getElementById('trackProgressBar');
    const timelineLiveStopTitle = document.getElementById('timelineLiveStopTitle');
    const timelineLiveStopSub = document.getElementById('timelineLiveStopSub');

    if (hudSpeed) hudSpeed.innerText = `${simulatedSpeed} km/h`;
    if (hudCoords) hudCoords.innerText = `${currentPos[0].toFixed(3)}° N, ${currentPos[1].toFixed(3)}° E`;
    if (trackDistance) trackDistance.innerText = `${remainingDistanceKm} km`;
    if (trackProgressBar) trackProgressBar.style.height = `${progressPct}%`;

    // Update Active Milestone
    const currentStopInfo = route.stops[currentSegmentIndex];
    if (timelineLiveStopTitle) {
      timelineLiveStopTitle.innerText = `In Transit — ${route.busNumber.split('(')[0].trim()}`;
    }
    if (timelineLiveStopSub) {
      timelineLiveStopSub.innerText = `${currentStopInfo.milestone} • Speed: ${simulatedSpeed} km/h`;
    }

    // Advance to next route segment
    if (currentSubStep >= SUB_STEPS_PER_SEGMENT) {
      currentSubStep = 0;
      currentSegmentIndex++;

      // Conclude journey when last stop reached
      if (currentSegmentIndex >= totalStops - 1) {
        endLiveJourney();
      }
    }
  };

  /**
   * Action 1: START JOURNEY
   */
  const startLiveJourney = (route = currentActiveRoute) => {
    if (!route) return;
    currentActiveRoute = route;

    if (journeyInterval) clearInterval(journeyInterval);
    isRunning = true;

    // Update button states
    const btnStart = document.getElementById('btnStartJourney');
    const btnRestart = document.getElementById('btnRestartJourney');
    const btnEnd = document.getElementById('btnEndJourney');

    if (btnStart) btnStart.className = 'px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md ring-2 ring-primary/40 active:scale-95 transition-all flex items-center gap-1';
    if (btnRestart) btnRestart.className = 'px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-variant active:scale-95 transition-all flex items-center gap-1';
    if (btnEnd) btnEnd.className = 'px-3 py-1.5 rounded-xl bg-surface border border-error/30 text-xs font-bold text-error hover:bg-error-container active:scale-95 transition-all flex items-center gap-1';

    // UI Updates
    const trackStatusTitle = document.getElementById('trackStatusTitle');
    const trackedIdBadge = document.getElementById('trackedIdBadge');
    const trackEta = document.getElementById('trackEta');
    const trackNextHandoff = document.getElementById('trackNextHandoff');
    const timelinePickupLoc = document.getElementById('timelinePickupLoc');
    const timelineFinalTitle = document.getElementById('timelineFinalTitle');
    const timelineFinalSub = document.getElementById('timelineFinalSub');
    const hudJourneyState = document.getElementById('hudJourneyState');
    const trackLiveStatusText = document.getElementById('trackLiveStatusText');

    if (trackStatusTitle) trackStatusTitle.innerText = `In Transit via ${route.busNumber.split('(')[0].trim()}`;
    if (trackedIdBadge) trackedIdBadge.innerText = route.trackingId;
    if (trackLiveStatusText) trackLiveStatusText.innerText = `${route.corridorName} • Live Highway Telematics`;
    if (trackEta) trackEta.innerText = route.eta;
    if (trackNextHandoff) trackNextHandoff.innerText = route.nextHandoff;
    if (timelinePickupLoc) timelinePickupLoc.innerText = `${route.origin} • Driver Verified`;
    if (timelineFinalTitle) timelineFinalTitle.innerText = `${route.destination} Handoff`;
    if (timelineFinalSub) timelineFinalSub.innerText = `${route.nextHandoff}`;
    if (hudJourneyState) hudJourneyState.innerText = 'GPS LIVE JOURNEY';

    initLeafletMap(route);

    // High FPS smooth interval (200ms divided by multiplier)
    const intervalMs = Math.max(40, Math.round(220 / simSpeedMultiplier));
    journeyInterval = setInterval(executeTick, intervalMs);
  };

  /**
   * Action 2: RESTART JOURNEY
   */
  const restartLiveJourney = () => {
    if (!currentActiveRoute) return;
    const route = currentActiveRoute;

    if (journeyInterval) clearInterval(journeyInterval);
    currentSegmentIndex = 0;
    currentSubStep = 0;
    isRunning = true;

    if (busMarker) {
      busMarker.setLatLng(route.stops[0].coords);
    }
    if (map) {
      map.setView(route.stops[0].coords, 11);
    }

    const trackProgressBar = document.getElementById('trackProgressBar');
    const trackDistance = document.getElementById('trackDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudJourneyState = document.getElementById('hudJourneyState');
    const timelineLiveStopTitle = document.getElementById('timelineLiveStopTitle');
    const timelineLiveStopSub = document.getElementById('timelineLiveStopSub');

    if (trackProgressBar) trackProgressBar.style.height = '15%';
    if (trackDistance) trackDistance.innerText = `${route.totalKm} km`;
    if (hudSpeed) hudSpeed.innerText = '58 km/h';
    if (hudJourneyState) hudJourneyState.innerText = 'JOURNEY RESTARTED';
    if (timelineLiveStopTitle) timelineLiveStopTitle.innerText = `Departing ${route.origin}`;
    if (timelineLiveStopSub) timelineLiveStopSub.innerText = 'Bus cargo sealed & on route to highway';

    const intervalMs = Math.max(40, Math.round(220 / simSpeedMultiplier));
    journeyInterval = setInterval(executeTick, intervalMs);
  };

  /**
   * Action 3: END JOURNEY
   */
  const endLiveJourney = () => {
    if (!currentActiveRoute) return;
    const route = currentActiveRoute;

    if (journeyInterval) clearInterval(journeyInterval);
    isRunning = false;

    const finalStop = route.stops[route.stops.length - 1];
    currentSegmentIndex = route.stops.length - 1;
    currentSubStep = SUB_STEPS_PER_SEGMENT;

    if (busMarker) {
      busMarker.setLatLng(finalStop.coords);
    }
    if (map) {
      map.setView(finalStop.coords, 13);
    }

    // Set UI to 100% Completed
    const trackStatusTitle = document.getElementById('trackStatusTitle');
    const trackLiveStatusText = document.getElementById('trackLiveStatusText');
    const trackProgressBar = document.getElementById('trackProgressBar');
    const trackDistance = document.getElementById('trackDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudCoords = document.getElementById('hudCoords');
    const hudJourneyState = document.getElementById('hudJourneyState');
    const timelineLiveStopTitle = document.getElementById('timelineLiveStopTitle');
    const timelineLiveStopSub = document.getElementById('timelineLiveStopSub');
    const timelineFinalDot = document.getElementById('timelineFinalDot');
    const timelineFinalTitle = document.getElementById('timelineFinalTitle');

    if (trackStatusTitle) trackStatusTitle.innerText = `Arrived at ${route.destination}`;
    if (trackLiveStatusText) trackLiveStatusText.innerText = `Trip Concluded • Parcel Handed Over to Last-Mile Partner`;
    if (trackProgressBar) trackProgressBar.style.height = '100%';
    if (trackDistance) trackDistance.innerText = '0.0 km';
    if (hudSpeed) hudSpeed.innerText = '0 km/h (Parked)';
    if (hudCoords) hudCoords.innerText = `${finalStop.coords[0].toFixed(3)}° N, ${finalStop.coords[1].toFixed(3)}° E`;
    if (hudJourneyState) hudJourneyState.innerText = 'JOURNEY COMPLETED';
    if (timelineLiveStopTitle) timelineLiveStopTitle.innerText = `Arrived at ${finalStop.name}`;
    if (timelineLiveStopSub) timelineLiveStopSub.innerText = 'Handoff QR scanned and verified at terminal';
    if (timelineFinalDot) timelineFinalDot.className = 'absolute -left-6 w-4 h-4 rounded-full bg-emerald-600 border-2 border-surface shadow-sm z-10 top-1';
    if (timelineFinalTitle) timelineFinalTitle.innerText = 'Successfully Delivered / Ready for Pickup';
  };

  /**
   * Search / Submit Handler
   */
  const handleTrackingLookup = async (idVal) => {
    const cleanId = (idVal || '').trim().toUpperCase();

    // Check backend first for real booking
    let route = routesData[cleanId];
    if (!route) {
      try {
        const res = await fetch(`/api/v1/shipments/${cleanId}`);
        if (res.ok) {
          const json = await res.json();
          const d = json.data;
          route = {
            trackingId: d.trackingId || cleanId,
            busNumber: 'Fleet Bus #402 (Express)',
            corridorName: `${d.sender?.address || 'Delhi'} ➔ ${d.recipient?.address || 'Chandigarh'}`,
            eta: '14:30',
            totalKm: 248,
            origin: d.sender?.address || 'Origin Hub',
            destination: d.recipient?.address || 'Destination Terminal',
            nextHandoff: 'Destination Hub ➔ Rapido Agent',
            stops: routesData['TRK-88219'].stops
          };
        }
      } catch (_) {}
    }

    if (!route) {
      route = {
        trackingId: cleanId || 'TRK-CUSTOM',
        busNumber: `Fleet Bus #${cleanId.slice(-3) || '402'} (HR-Express)`,
        corridorName: `Intercity Corridor (${cleanId})`,
        eta: '15:10',
        totalKm: 220,
        origin: 'Delhi Central Logistics Hub',
        destination: 'Regional Intercity Terminal',
        nextHandoff: 'Destination Bus Bay ➔ Doorstep Agent',
        stops: routesData['TRK-88219'].stops
      };
    }

    const inputTrackingId = document.getElementById('inputTrackingId');
    if (inputTrackingId) inputTrackingId.value = route.trackingId;

    // Highlight active chip
    document.querySelectorAll('.quick-id-chip').forEach(chip => {
      if (chip.getAttribute('data-id') === route.trackingId) {
        chip.className = 'quick-id-chip px-2.5 py-1 rounded-full bg-primary-container text-white font-bold shrink-0 transition-all active:scale-95';
      } else {
        chip.className = 'quick-id-chip px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-variant shrink-0 transition-all active:scale-95';
      }
    });

    currentSegmentIndex = 1;
    currentSubStep = 0;
    startLiveJourney(route);
  };

  // Wire up 3 Buttons: Start, Restart, End
  const btnStart = document.getElementById('btnStartJourney');
  if (btnStart) btnStart.addEventListener('click', () => startLiveJourney(currentActiveRoute));

  const btnRestart = document.getElementById('btnRestartJourney');
  if (btnRestart) btnRestart.addEventListener('click', () => restartLiveJourney());

  const btnEnd = document.getElementById('btnEndJourney');
  if (btnEnd) btnEnd.addEventListener('click', () => endLiveJourney());

  // Form submission
  const searchForm = document.getElementById('trackingIdSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('inputTrackingId');
      if (input && input.value) handleTrackingLookup(input.value);
    });
  }

  // Quick ID Chips
  document.querySelectorAll('.quick-id-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-id');
      handleTrackingLookup(id);
    });
  });

  // Simulation Speed Multipliers (1x, 2x, 5x)
  document.querySelectorAll('.btn-sim-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      simSpeedMultiplier = parseInt(btn.getAttribute('data-speed') || '1', 10);
      document.querySelectorAll('.btn-sim-speed').forEach(b => {
        b.className = 'btn-sim-speed px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant hover:bg-surface-variant font-bold';
      });
      btn.className = 'btn-sim-speed px-1.5 py-0.5 rounded bg-primary text-white font-bold';

      if (isRunning) {
        const intervalMs = Math.max(40, Math.round(220 / simSpeedMultiplier));
        clearInterval(journeyInterval);
        journeyInterval = setInterval(executeTick, intervalMs);
      }
    });
  });

  // Auto-start on load
  const urlParams = new URLSearchParams(window.location.search);
  const initialId = urlParams.get('id') || 'TRK-88219';
  handleTrackingLookup(initialId);
});
