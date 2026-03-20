'use client';

import { useEffect, useMemo, memo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visit } from '@/lib/types';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;
const MAP_VIEW_KEY = 'dashboard-map-view';
const MARKER_SIZE = 20;
const MARKER_SIZE_SELECTED = 26;

function createSquareIcon(color: string, isSelected: boolean, opacity = isSelected ? 0.95 : 0.7): L.DivIcon {
  const size = isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      opacity:${opacity};
      border:${isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)'};
      border-radius:2px;
      cursor:pointer;
    "></div>`,
  });
}

function getSavedMapView(): { center: [number, number]; zoom: number } | null {
  try {
    const saved = localStorage.getItem(MAP_VIEW_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.center && parsed.zoom) return parsed;
    }
  } catch {}
  return null;
}

function MapStateTracker() {
  const map = useMap();
  useMapEvents({
    moveend() {
      const c = map.getCenter();
      localStorage.setItem(MAP_VIEW_KEY, JSON.stringify({ center: [c.lat, c.lng], zoom: map.getZoom() }));
    },
  });

  // Tell Leaflet when the container resizes (e.g. analytics panel toggled)
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function FitBounds({ visits }: { visits: Visit[] }) {
  const map = useMap();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only auto-fit on first mount if no saved view
    if (hasRun.current) return;
    hasRun.current = true;

    const saved = getSavedMapView();
    if (saved) {
      map.setView(saved.center, saved.zoom);
    } else if (visits.length > 0) {
      const bounds = L.latLngBounds(
        visits.map((v) => [v.latitude, v.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [visits, map]);

  return null;
}

/** Re-fits map bounds whenever the focusKey changes (e.g. selected run/session filter) */
function FitToSelection({ visits, focusKey }: { visits: Visit[]; focusKey: string | null }) {
  const map = useMap();
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    if (focusKey === prevKey.current) return;
    prevKey.current = focusKey;

    if (visits.length === 0) return;

    const bounds = L.latLngBounds(
      visits.map((v) => [v.latitude, v.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  }, [visits, focusKey, map]);

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

const PLANNED_OPACITY = 0.35;

const PlannedMarker = memo(function PlannedMarker({
  knock,
  color,
}: {
  knock: Visit;
  color: string;
}) {
  const icon = useMemo(
    () => createSquareIcon(color, false, PLANNED_OPACITY),
    [color]
  );

  const position = useMemo(
    () => [knock.latitude, knock.longitude] as [number, number],
    [knock.latitude, knock.longitude]
  );

  return <Marker position={position} icon={icon} />;
});

interface DashboardMapProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
  plannedKnocks?: Visit[];
  focusKey?: string | null;
}

export default function DashboardMap({
  visits,
  sessionColorMap,
  selectedVisitId,
  onSelectVisit,
  plannedKnocks = [],
  focusKey = null,
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
          <MapStateTracker />
          <FitBounds visits={[...visits, ...plannedKnocks]} />
          <FitToSelection visits={[...visits, ...plannedKnocks]} focusKey={focusKey} />
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
            <PlannedMarker
              key={`planned-${knock.id}`}
              knock={knock}
              color={sessionColorMap.get(knock.session_id) ?? '#3B82F6'}
            />
          ))}
        </MapContainer>
      )}
    </div>
  );
}
