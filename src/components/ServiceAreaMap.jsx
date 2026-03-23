'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const DefaultIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: #244C70;
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #FFFFFF;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.2s;
  ">
    <div style="
      width: 14px;
      height: 14px;
      background-color: #FFFFFF;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export default function ServiceAreaMap({
  latitude,
  longitude,
  radiusKm = 5,
  onLocationSelect,
  className = '',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [ready, setReady] = useState(false);

  const defaultLat = 33.5731;
  const defaultLng = -7.5898; // Casablanca

  useEffect(() => {
    setReady(true);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    const center = [latitude || defaultLat, longitude || defaultLng];
    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">Carto</a>',
    }).addTo(map);

    map.on('click', (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], { icon: DefaultIcon }).addTo(map);
      circleRef.current = L.circle([latitude, longitude], {
        radius: (radiusKm || 5) * 1000,
        color: '#364153',
        fillColor: '#364153',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);
      map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    }

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Update marker + circle when lat/lng change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: DefaultIcon }).addTo(map);
      }

      const radius = (radiusKm || 5) * 1000;
      if (circleRef.current) {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(radius);
      } else {
        circleRef.current = L.circle([latitude, longitude], {
          radius,
          color: '#364153',
          fillColor: '#364153',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6, 6',
        }).addTo(map);
      }
      map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [latitude, longitude, radiusKm]);

  if (!ready) {
    return (
      <div className={`bg-gray-100 rounded-[5px] flex items-center justify-center ${className}`} style={{ minHeight: '300px' }}>
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[5px] overflow-hidden border border-gray-200 ${className}`}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '300px' }} />
    </div>
  );
}
