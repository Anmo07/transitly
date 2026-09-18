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
    if (typeof window === 'undefined' || !window.L) return;

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

      // Google Maps Cartography Tiles
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    const map = mapInstanceRef.current;

    // Optional Surge Radius Circle
    let circle = null;
    if (surgeRadius) {
      circle = L.circle(center, {
        radius: surgeRadius,
        color: '#cc4204',
        fillColor: '#cc4204',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map);
    }

    return () => {
      if (circle) circle.remove();
    };
  }, [center, zoom, interactive, surgeRadius]);

  return <div ref={mapContainerRef} className={`relative z-0 ${className}`} />;
};
