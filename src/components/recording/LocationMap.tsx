'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type KnockedDoor = {
  latitude: number;
  longitude: number;
  result: string | null;
};

type LocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  knockedDoors?: KnockedDoor[];
};

function getMarkerColor(result: string | null): string {
  switch (result) {
    case 'Interested':
      return '#16a34a';
    case 'Booked Consult':
      return '#2563eb';
    case 'Not Home':
      return '#ca8a04';
    case 'Come Back Later':
      return '#f97316';
    case 'Not Interested':
      return '#71717a';
    default:
      return '#a855f7'; // purple for no result yet
  }
}

export default function LocationMap({ latitude, longitude, accuracy, knockedDoors }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const doorMarkersRef = useRef<L.CircleMarker[]>([]);
  const hasInitialPositionRef = useRef(false);

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
    }).setView([37.4419, -122.143], 19);

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

    // Only auto-center on first position fix, then let user pan freely
    if (!hasInitialPositionRef.current) {
      map.setView(latlng, 19, { animate: true });
      hasInitialPositionRef.current = true;
    }
  }, [latitude, longitude, accuracy]);

  // Render knocked door markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    doorMarkersRef.current.forEach((m) => m.remove());
    doorMarkersRef.current = [];

    if (!knockedDoors?.length) return;

    for (const door of knockedDoors) {
      const color = getMarkerColor(door.result);
      const marker = L.circleMarker([door.latitude, door.longitude], {
        radius: 12,
        fillColor: color,
        fillOpacity: 0.9,
        color: '#fff',
        weight: 3,
      }).addTo(map);

      if (door.result) {
        marker.bindTooltip(door.result, {
          direction: 'top',
          offset: [0, -8],
          className: 'door-tooltip',
        });
      }

      doorMarkersRef.current.push(marker);
    }

    // Make sure blue dot stays on top
    if (markerRef.current) {
      markerRef.current.bringToFront();
    }
  }, [knockedDoors]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: '#1a1a2e' }}
    />
  );
}
