import React, { useEffect, useRef } from 'react';

export const LiveMap = ({
  center = [30.7333, 76.7794],
  zoom = 13,
  interactive = true,
  markers = [],
  surgeRadius = null,
  className = 'w-full h-full'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let circle = null;

    const initOrUpdateMap = () => {
      if (typeof window === 'undefined' || !window.L || !mapContainerRef.current) return;
      const L = window.L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive
        }).setView(center, zoom);

        // Google Maps Cartography Tiles with load-balanced subdomains
        const gLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3']
        }).addTo(map);

        // Resilient fallback: If Google tiles fail, load OpenStreetMap
        gLayer.on('tileerror', function() {
          if (!this._osmFallback) {
            this._osmFallback = true;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          }
        });

        setTimeout(() => { if (map) map.invalidateSize(); }, 300);
        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView(center, zoom);
      }

      const map = mapInstanceRef.current;

      // Optional Surge Radius Circle
      if (surgeRadius) {
        circle = L.circle(center, {
          radius: surgeRadius,
          color: '#cc4204',
          fillColor: '#cc4204',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(map);
      }
    };

    if (typeof window !== 'undefined' && window.L) {
      initOrUpdateMap();
    } else {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && window.L) {
          clearInterval(timer);
          initOrUpdateMap();
        } else if (attempts > 60) {
          clearInterval(timer);
        }
      }, 50);
      return () => {
        clearInterval(timer);
        if (circle) circle.remove();
      };
    }

    return () => {
      if (circle) circle.remove();
    };
  }, [center, zoom, interactive, surgeRadius]);

  return <div ref={mapContainerRef} className={`relative z-0 ${className}`} />;
};
