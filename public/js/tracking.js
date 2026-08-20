/**
 * Transitly — Live Telematics & Parcel Tracking Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  let map = null;
  let busMarker = null;
  let routeLine = null;
  let currentStep = 1;
  let refreshTimerInterval = null;
  let refreshSecondsLeft = 30;

  // Internal Validated Parcel Catalog
  const parcelDatabase = {
    'TRK-88219': {
      trackingId: 'TRK-88219',
      busNumber: 'Fleet Bus #402 (HR-55-AB-1234)',
      routeName: 'Delhi ➔ Chandigarh (GT Road)',
      cargoBay: 'Bay B2 • QR Sealed',
      parties: 'Aarav S. ➔ Rohan V.',
      eta: '14:30',
      speed: '64 km/h',
      statusTitle: 'In Transit via Fleet Bus #402',
      handoffText: 'North ISBT Terminal to Rapido Rider',
      distance: '2.4 km',
      stops: [
        [28.6675, 77.2285], // ISBT Kashmiri Gate
        [28.9931, 77.0151], // Sonipat Bypass
        [29.3909, 76.9635], // Panipat Toll
        [29.6857, 76.9905], // Karnal Depot
        [29.9695, 76.8783], // Kurukshetra Hub
        [30.3782, 76.7767], // Ambala Cantt
        [30.7410, 76.7790]  // ISBT Chandigarh Sector 17
      ]
    },
    'TRK-60912': {
      trackingId: 'TRK-60912',
      busNumber: 'Fleet Bus #108 (HR-66-XY-5678)',
      routeName: 'Delhi ➔ Jaipur Highway',
      cargoBay: 'Bay A1 • Tamper-Evident',
      parties: 'Pooja K. ➔ Manish T.',
      eta: '16:45',
      speed: '72 km/h',
      statusTitle: 'In Transit via Fleet Bus #108',
      handoffText: 'Dhaula Kuan Depot to Uber Rider',
      distance: '18.2 km',
      stops: [
        [28.5915, 77.1610], // Dhaula Kuan Delhi
        [28.4595, 77.0266], // Gurgaon IFFCO Chowk
        [28.2055, 76.8406], // Dharuhera
        [28.0050, 76.5800], // Bawal Interchange
        [27.7900, 76.3200], // Behror Midpoint
        [27.3500, 75.9800], // Kotputli Hub
        [26.9124, 75.7873]  // Sindhi Camp Jaipur
      ]
    },
    'TRK-74911': {
      trackingId: 'TRK-74911',
      busNumber: 'Fleet Bus #515 (HR-26-CC-9012)',
      routeName: 'Delhi ➔ Hisar ➔ Sirsa',
      cargoBay: 'Bay C3 • Dual-OTP Sealed',
      parties: 'Vikas N. ➔ Anjali D.',
      eta: '18:15',
      speed: '58 km/h',
      statusTitle: 'In Transit via Fleet Bus #515',
      handoffText: 'Bahadurgarh Hub to Door Delivery',
      distance: '45.0 km',
      stops: [
        [28.6920, 76.9240], // Bahadurgarh
        [28.8955, 76.6066], // Rohtak New Bus Stand
        [29.0020, 76.2200], // Meham Bypass
        [29.1492, 75.7217], // Hisar Military Cantt Hub
        [29.5320, 75.0318]  // Sirsa ISBT
      ]
    }
  };

  // Dynamic on-demand Leaflet Loader
  const loadLeaflet = () => {
    return new Promise((resolve) => {
      if (window.L) return resolve();

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  };

  const initMap = async () => {
    if (!window.L || map) return;

    const defaultParcel = parcelDatabase['TRK-88219'];
    const mapElement = document.getElementById('liveTrackingMap');
    if (!mapElement) return;

    map = L.map('liveTrackingMap', { zoomControl: false }).setView(defaultParcel.stops[1], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO'
    }).addTo(map);

    routeLine = L.polyline(defaultParcel.stops, {
      color: '#0050cb',
      weight: 5,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    const busIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute w-10 h-10 rounded-full bg-primary/20 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-sm fill">directions_bus</span>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    busMarker = L.marker(defaultParcel.stops[1], { icon: busIcon }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    window.addEventListener('resize', () => {
      if (map) map.invalidateSize();
    });
  };

  const updateInsightsCard = (parcel) => {
    const trackedIdDisplay = document.getElementById('trackedIdDisplay');
    const insightBusName = document.getElementById('insightBusName');
    const insightRouteName = document.getElementById('insightRouteName');
    const insightCargoBay = document.getElementById('insightCargoBay');
    const insightParties = document.getElementById('insightParties');
    const insightSpeed = document.getElementById('insightSpeed');
    const trackStatusTitle = document.getElementById('trackStatusTitle');
    const trackEta = document.getElementById('trackEta');
    const trackHandoffText = document.getElementById('trackHandoffText');
    const trackDistance = document.getElementById('trackDistance');
    const timelineActiveStopTitle = document.getElementById('timelineActiveStopTitle');
    const timelineActiveStopSub = document.getElementById('timelineActiveStopSub');

    if (trackedIdDisplay) trackedIdDisplay.innerText = parcel.trackingId;
    if (insightBusName) insightBusName.innerText = parcel.busNumber;
    if (insightRouteName) insightRouteName.innerText = parcel.routeName;
    if (insightCargoBay) insightCargoBay.innerText = parcel.cargoBay;
    if (insightParties) insightParties.innerText = parcel.parties;
    if (insightSpeed) insightSpeed.innerText = `Speed: ${parcel.speed}`;
    if (trackStatusTitle) trackStatusTitle.innerText = parcel.statusTitle;
    if (trackEta) trackEta.innerText = parcel.eta;
    if (trackHandoffText) trackHandoffText.innerText = parcel.handoffText;
    if (trackDistance) trackDistance.innerText = parcel.distance;
    if (timelineActiveStopTitle) timelineActiveStopTitle.innerText = `In Transit – ${parcel.busNumber.split(' ')[2] || 'Bus #402'}`;
    if (timelineActiveStopSub) timelineActiveStopSub.innerText = `Currently on ${parcel.routeName}`;
  };

  const start30SecAutoRefresh = (parcel) => {
    if (refreshTimerInterval) clearInterval(refreshTimerInterval);
    refreshSecondsLeft = 30;

    const refreshSecSpan = document.getElementById('refreshCountdownSecs');
    if (refreshSecSpan) refreshSecSpan.innerText = refreshSecondsLeft;

    refreshTimerInterval = setInterval(async () => {
      refreshSecondsLeft--;
      if (refreshSecSpan) refreshSecSpan.innerText = refreshSecondsLeft;

      if (refreshSecondsLeft <= 0) {
        refreshSecondsLeft = 30;
        if (refreshSecSpan) refreshSecSpan.innerText = refreshSecondsLeft;

        // Step bus position along route
        currentStep = (currentStep + 1) % parcel.stops.length;
        const nextCoord = parcel.stops[currentStep];
        if (busMarker && map) {
          busMarker.setLatLng(nextCoord);
          map.panTo(nextCoord, { animate: true, duration: 1.5 });
        }
      }
    }, 1000);
  };

  const searchByTrackingId = async (inputVal) => {
    const rawId = inputVal.trim().toUpperCase();
    const errorBox = document.getElementById('parcelSearchError');
    const errorMsg = document.getElementById('parcelSearchErrorMsg');

    let parcel = parcelDatabase[rawId];

    if (!parcel) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/shipments/${rawId}`);
        const data = await res.json();
        if (data && data.data) {
          parcel = {
            trackingId: data.data.trackingId || rawId,
            busNumber: 'Fleet Bus #402 (HR-55-AB-1234)',
            routeName: 'Delhi ➔ Chandigarh (GT Road)',
            cargoBay: 'Bay B2 • QR Sealed',
            parties: `${data.data.sender?.name || 'Aarav S.'} ➔ ${data.data.recipient?.name || 'Rohan V.'}`,
            eta: '14:30',
            speed: '64 km/h',
            statusTitle: `In Transit via Fleet Bus #402`,
            handoffText: 'Destination Hub to Rapido Rider',
            distance: '2.4 km',
            stops: parcelDatabase['TRK-88219'].stops
          };
        }
      } catch (err) {
        // Fallback check
      }
    }

    if (!parcel) {
      if (errorBox) errorBox.classList.remove('hidden');
      if (errorMsg) errorMsg.innerText = `Parcel ID "${rawId}" not recognized. Please verify your receipt or contact WhatsApp support.`;
      return;
    }

    if (errorBox) errorBox.classList.add('hidden');
    updateInsightsCard(parcel);

    if (map && routeLine && busMarker) {
      currentStep = 1;
      routeLine.setLatLngs(parcel.stops);
      busMarker.setLatLng(parcel.stops[1]);
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    start30SecAutoRefresh(parcel);
  };

  // Form submission search
  const trackingForm = document.getElementById('trackingIdSearchForm');
  const inputTrackingId = document.getElementById('inputTrackingId');

  if (trackingForm) {
    trackingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inputTrackingId && inputTrackingId.value) {
        searchByTrackingId(inputTrackingId.value);
      }
    });
  }

  // Initialize Map and check URL params
  await initMap();

  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('id');
  if (paramId) {
    if (inputTrackingId) inputTrackingId.value = paramId;
    searchByTrackingId(paramId);
  } else {
    start30SecAutoRefresh(parcelDatabase['TRK-88219']);
  }
});
