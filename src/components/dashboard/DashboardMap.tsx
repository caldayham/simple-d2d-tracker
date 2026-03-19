'use client';

import { useEffect, useMemo, memo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visit } from '@/lib/types';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;
const MARKER_SIZE = 20;
const MARKER_SIZE_SELECTED = 26;

function createSquareIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      opacity:${isSelected ? 0.95 : 0.7};
      border:${isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)'};
      border-radius:2px;
      cursor:pointer;
    "></div>`,
  });
}

function FitBounds({ visits }: { visits: Visit[] }) {
  const map = useMap();

  useEffect(() => {
    if (visits.length > 0) {
      const bounds = L.latLngBounds(
        visits.map((v) => [v.latitude, v.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(PALO_ALTO_CENTER, DEFAULT_ZOOM);
    }
  }, [visits, map]);

  return null;
}

const VisitMarker = memo(function VisitMarker({
  visit,
  color,
  isSelected,
  onClick,
}: {
  visit: Visit;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const icon = useMemo(
    () => createSquareIcon(color, isSelected),
    [color, isSelected]
  );

  const position = useMemo(
    () => [visit.latitude, visit.longitude] as [number, number],
    [visit.latitude, visit.longitude]
  );

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: onClick }}
    />
  );
});

const PLANNED_COLOR = '#71717a';
const PLANNED_OPACITY = 0.5;

function createPlannedIcon(): L.DivIcon {
  const size = MARKER_SIZE;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${PLANNED_COLOR};
      opacity:${PLANNED_OPACITY};
      border:1px solid rgba(255,255,255,0.2);
      border-radius:2px;
      cursor:pointer;
    "></div>`,
  });
}

const plannedIcon = createPlannedIcon();

interface DashboardMapProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
  plannedKnocks?: Visit[];
}

export default function DashboardMap({
  visits,
  sessionColorMap,
  selectedVisitId,
  onSelectVisit,
  plannedKnocks = [],
}: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait until the container has layout dimensions before mounting Leaflet
    const el = containerRef.current;
    if (!el) return;
    if (el.clientHeight > 0 && el.clientWidth > 0) {
      setReady(true);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setReady(true);
          observer.disconnect();
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: '#18181b' }}>
      {ready && (
        <MapContainer
          center={PALO_ALTO_CENTER}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full"
          style={{ background: '#18181b' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles-dark"
          />
          <FitBounds visits={[...visits, ...plannedKnocks]} />
          {visits.map((visit) => (
            <VisitMarker
              key={visit.id}
              visit={visit}
              color={sessionColorMap.get(visit.session_id) ?? '#3B82F6'}
              isSelected={visit.id === selectedVisitId}
              onClick={() => onSelectVisit(visit.id)}
            />
          ))}
          {plannedKnocks.map((knock) => (
            <Marker
              key={`planned-${knock.id}`}
              position={[knock.latitude, knock.longitude] as [number, number]}
              icon={plannedIcon}
            />
          ))}
        </MapContainer>
      )}
    </div>
  );
}
