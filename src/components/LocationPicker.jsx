'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix default marker icon
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

export default function LocationPicker({ latitude, longitude, onLocationSelect, className = '' }) {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const defaultLat = 33.5731;
  const defaultLng = -7.5898; // Casablanca, Morocco as default

  // Wait for DOM
  useEffect(() => {
    setReady(true);
  }, []);

  // Initialize Leaflet map manually via ref
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude || defaultLat, longitude || defaultLng],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: false, // We will add it manually for better positioning if needed
    });

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">Carto</a>',
    }).addTo(map);

    // Handle clicks
    map.on('click', (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // Place initial marker if coords exist
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], { icon: DefaultIcon }).addTo(map);
      markerRef.current = marker;
    }

    mapInstanceRef.current = map;

    // Fix tile rendering after mount
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [ready]); // Only init once

  // Update marker when lat/lng change externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: DefaultIcon }).addTo(map);
      }
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude]);

  if (!ready) {
    return (
      <div className={`bg-gray-100 rounded-[5px] flex items-center justify-center ${className}`} style={{ minHeight: '250px' }}>
        <p className="text-gray-400 text-sm">{t('onboarding.loadingMap')}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[5px] overflow-hidden border border-gray-200 ${className}`}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '250px' }} />
    </div>
  );
}
