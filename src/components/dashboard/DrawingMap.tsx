'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  useDrawingState,
  isPointNearTarget,
  getEdges,
  type DrawingPoint,
} from '@/lib/drawing';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;

interface DrawingMapProps {
  onPolygonComplete: (points: DrawingPoint[]) => void;
  onCancel: () => void;
}

function DrawingLayer({
  drawing,
}: {
  drawing: ReturnType<typeof useDrawingState>;
}) {
  const map = useMap();
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      if (!drawing.isDrawing) return;

      const clickLatLng = e.latlng;

      // Check if click is near any existing point
      for (const point of drawing.points) {
        const pointLatLng = L.latLng(point.lat, point.lng);
        if (isPointNearTarget(clickLatLng, pointLatLng, map)) {
          // If we have an active point and this would close the polygon, close it
          if (
            drawing.activePointId &&
            drawing.activePointId !== point.id &&
            drawing.points.length >= 3
          ) {
            drawing.connectToPoint(point.id);
          } else {
            // Select this point as active (draw from here)
            drawing.selectPoint(point.id);
          }
          return;
        }
      }

      // Add new point (connects to active if one exists)
      drawing.addPoint(clickLatLng.lat, clickLatLng.lng);
    },
    mousemove(e) {
      if (drawing.isDrawing && drawing.activePointId) {
        setCursorPos([e.latlng.lat, e.latlng.lng]);
      } else {
        setCursorPos(null);
      }
    },
  });

  // Build edges from graph connections
  const edges = getEdges(drawing.points);
  const pointMap = new Map(drawing.points.map((p) => [p.id, p]));

  // Live preview line from active point to cursor
  const activePoint = drawing.activePointId
    ? pointMap.get(drawing.activePointId)
    : null;
  const showPreview =
    drawing.isDrawing &&
    activePoint &&
    cursorPos &&
    activePoint.connections.length < 2;

  return (
    <>
      {/* Edges from graph connections */}
      {edges.map(([aId, bId]) => {
        const a = pointMap.get(aId);
        const b = pointMap.get(bId);
        if (!a || !b) return null;
        return (
          <Polyline
            key={`${aId}-${bId}`}
            positions={[
              [a.lat, a.lng],
              [b.lat, b.lng],
            ]}
            pathOptions={{
              color: '#3B82F6',
              weight: 2,
              dashArray: '8 4',
            }}
          />
        );
      })}

      {/* Live preview line */}
      {showPreview && (
        <Polyline
          positions={[
            [activePoint.lat, activePoint.lng],
            cursorPos!,
          ]}
          pathOptions={{
            color: '#60A5FA',
            weight: 1,
            dashArray: '4 4',
          }}
        />
      )}

      {/* Point markers */}
      {drawing.points.map((point) => {
        const isActive = point.id === drawing.activePointId;
        const canClose =
          drawing.isDrawing &&
          drawing.activePointId &&
          drawing.activePointId !== point.id &&
          drawing.points.length >= 3 &&
          point.connections.length < 2;

        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={isActive ? 10 : canClose ? 10 : 8}
            pathOptions={{
              fillColor: canClose
                ? '#22c55e'
                : isActive
                  ? '#3B82F6'
                  : '#ffffff',
              fillOpacity: 0.9,
              color: isActive ? '#1d4ed8' : '#3B82F6',
              weight: isActive ? 3 : 2,
            }}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
              },
            }}
          />
        );
      })}
    </>
  );
}

export default function DrawingMap({
  onPolygonComplete,
  onCancel,
}: DrawingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const drawing = useDrawingState();

  useEffect(() => {
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

  // Escape key exits drawing mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && drawing.isDrawing) {
        drawing.stopDrawing();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawing.isDrawing, drawing.stopDrawing]);

  const handleToggleDrawing = useCallback(() => {
    if (drawing.isDrawing) {
      drawing.stopDrawing();
      onCancel();
    } else {
      drawing.startDrawing();
    }
  }, [drawing, onCancel]);

  const handleComplete = useCallback(() => {
    onPolygonComplete(drawing.points);
  }, [drawing.points, onPolygonComplete]);

  const hasPoints = drawing.points.length > 0;
  const activePoint = drawing.points.find((p) => p.id === drawing.activePointId);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: '#18181b' }}>
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
          <DrawingLayer drawing={drawing} />
        </MapContainer>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        <button
          onClick={handleToggleDrawing}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
            drawing.isDrawing
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {drawing.isDrawing ? 'Cancel' : 'Make Selection'}
        </button>

        {/* Delete active point */}
        {activePoint && (
          <button
            onClick={() => drawing.removePoint(activePoint.id)}
            className="px-3 py-2 text-sm rounded-lg shadow-lg bg-zinc-800 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            Delete Point
          </button>
        )}

        {/* Clear all */}
        {hasPoints && (
          <button
            onClick={drawing.clear}
            className="px-3 py-2 text-sm rounded-lg shadow-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Bottom: Create Run Route (only when polygon closed) */}
      {drawing.isClosed && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition-colors font-medium"
          >
            Create Run Route
          </button>
        </div>
      )}
    </div>
  );
}
