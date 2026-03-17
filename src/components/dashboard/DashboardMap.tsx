'use client';

import { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visit } from '@/lib/types';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;

function visitToBounds(lat: number, lng: number): LatLngBoundsExpression {
  const offset = 0.00005; // ~5 meters at Palo Alto latitude
  return [
    [lat - offset, lng - offset],
    [lat + offset, lng + offset],
  ];
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

const VisitRectangle = memo(function VisitRectangle({
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
  const bounds = useMemo(
    () => visitToBounds(visit.latitude, visit.longitude),
    [visit.latitude, visit.longitude]
  );

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: isSelected ? '#ffffff' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.6,
        weight: isSelected ? 3 : 1,
      }}
      eventHandlers={{ click: onClick }}
    />
  );
});

interface DashboardMapProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
}

export default function DashboardMap({
  visits,
  sessionColorMap,
  selectedVisitId,
  onSelectVisit,
}: DashboardMapProps) {
  return (
    <MapContainer
      center={PALO_ALTO_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      style={{ background: '#18181b' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds visits={visits} />
      {visits.map((visit) => (
        <VisitRectangle
          key={visit.id}
          visit={visit}
          color={sessionColorMap.get(visit.session_id) ?? '#3B82F6'}
          isSelected={visit.id === selectedVisitId}
          onClick={() => onSelectVisit(visit.id)}
        />
      ))}
    </MapContainer>
  );
}
