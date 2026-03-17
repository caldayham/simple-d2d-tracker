'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

export default function LocationMap({ latitude, longitude, accuracy }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
    }).setView([37.4419, -122.143], 16); // Default to Palo Alto

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude === null || longitude === null) return;

    const latlng: L.LatLngExpression = [latitude, longitude];

    // Blue dot
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        color: '#fff',
        weight: 3,
      }).addTo(map);
    }

    // Accuracy circle
    if (accuracy) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latlng);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(latlng, {
          radius: accuracy,
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          color: '#4285F4',
          weight: 1,
        }).addTo(map);
      }
    }

    map.setView(latlng, map.getZoom(), { animate: true });
  }, [latitude, longitude, accuracy]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: '#1a1a2e' }}
    />
  );
}
