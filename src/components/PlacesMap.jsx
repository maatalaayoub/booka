'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { MapPin, Star, Navigation } from 'lucide-react';
import Image from 'next/image';

const mapStyles = `
  .custom-popup .leaflet-popup-content-wrapper {
    padding: 0;
    overflow: hidden;
    border-radius: 12px;
  }
  .custom-popup .leaflet-popup-content {
    margin: 0;
    width: 240px !important;
  }
  .custom-popup .leaflet-popup-tip-container {
    display: none;
  }
`;

const customIcon = L.divIcon({
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

// Calculate bounds to show all markers
function BoundsFitter({ businesses }) {
  const map = useMap();
  
  useEffect(() => {
    const validBusinesses = businesses?.filter(b => b && b.latitude && b.longitude) || [];
    if (validBusinesses.length > 0) {
      const bounds = L.latLngBounds(validBusinesses.map(b => [b.latitude, b.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [businesses, map]);

  return null;
}

export default function PlacesMap({ businesses, locale }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    // Fix missing icons in nextjs
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!ready) return null;

  // Default to Casablanca
  const defaultCenter = [33.5731, -7.5898];

  return (
    <>
      <style>{mapStyles}</style>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <BoundsFitter businesses={businesses} />

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={50}
        iconCreateFunction={(cluster) => {
          return L.divIcon({
            html: `<div style="
              background-color: #244C70;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              border: 3px solid white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            ">${cluster.getChildCount()}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(36, 36, true),
          });
        }}
      >
        {businesses?.filter(b => b && b.latitude && b.longitude).map((biz) => (
          <Marker 
            key={biz.id} 
            position={[biz.latitude, biz.longitude]}
            icon={customIcon}
          >
            <Popup className="custom-popup" closeButton={false} minWidth={240}>
              <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-lg border border-gray-100 p-0 m-0">
                {biz.coverGallery && biz.coverGallery[0] ? (
                  <div className="h-24 w-full relative bg-gray-200">
                    <Image 
                      src={biz.coverGallery[0]} 
                      alt={biz.businessName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-full bg-gradient-to-r from-[#244C70] to-[#E9F3FC]" />
                )}
                
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{biz.businessName}</h3>
                  <div className="flex items-center text-gray-500 text-xs mb-3 gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{biz.city || 'Location'}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/b/${biz.id}`}
                      className="flex-1 bg-[#244C70] text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-[#1a3a5a] transition-colors"
                    >
                      View Profile
                    </Link>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
    </>
  );
}