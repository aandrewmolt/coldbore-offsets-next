'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSLocation } from '@/lib/types';

interface WellMapProps {
  locations: Array<{ name: string; location: GPSLocation }>;
}

export default function WellMap({ locations }: WellMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || locations.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const bounds = L.latLngBounds([]);

    for (const loc of locations) {
      const marker = L.marker([loc.location.lat, loc.location.lng], { icon: defaultIcon }).addTo(map);
      marker.bindPopup(`<strong>${loc.name}</strong><br/>${loc.location.lat.toFixed(5)}, ${loc.location.lng.toFixed(5)}`);
      bounds.extend([loc.location.lat, loc.location.lng]);
    }

    map.fitBounds(bounds, { padding: [30, 30] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [locations]);

  return (
    <div
      ref={containerRef}
      className="h-[250px] w-full rounded-lg overflow-hidden border border-zinc-800"
    />
  );
}
