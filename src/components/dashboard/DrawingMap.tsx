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
  type DrawingPoint,
} from '@/lib/drawing';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;

interface DrawingMapProps {
  onPolygonComplete: (points: DrawingPoint[]) => void;
  onCancel: () => void;
}

/**
 * Inner component that handles map events and renders drawing elements.
 * Must be a child of MapContainer to access useMap/useMapEvents.
 */
function DrawingLayer({
  drawing,
  onPolygonComplete,
}: {
  drawing: ReturnType<typeof useDrawingState>;
  onPolygonComplete: (points: DrawingPoint[]) => void;
}) {
  const map = useMap();
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      if (!drawing.isDrawing) return;

      const clickLatLng = e.latlng;

      // Check if click is near the first point (close polygon)
      if (drawing.points.length >= 3) {
        const firstPoint = drawing.points[0];
        const firstLatLng = L.latLng(firstPoint.lat, firstPoint.lng);
        if (isPointNearTarget(clickLatLng, firstLatLng, map)) {
          drawing.closePolygon();
          return;
        }
      }

      // Check if click is near any existing point (delete it)
      for (const point of drawing.points) {
        const pointLatLng = L.latLng(point.lat, point.lng);
        if (isPointNearTarget(clickLatLng, pointLatLng, map)) {
          drawing.removePoint(point.id);
          return;
        }
      }

      // Add new point
      drawing.addPoint(clickLatLng.lat, clickLatLng.lng);
    },
    mousemove(e) {
      if (drawing.isDrawing && drawing.points.length > 0) {
        setCursorPos([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  // Build polyline positions
  const linePositions: [number, number][] = drawing.points.map((p) => [p.lat, p.lng]);
  if (drawing.isClosed && linePositions.length > 0) {
    linePositions.push(linePositions[0]);
  }

  // Live preview line from last point to cursor
  const lastPoint = drawing.points[drawing.points.length - 1];
  const previewPositions: [number, number][] =
    drawing.isDrawing && lastPoint && cursorPos
      ? [[lastPoint.lat, lastPoint.lng], cursorPos]
      : [];

  return (
    <>
      {/* Connecting lines */}
      {linePositions.length >= 2 && (
        <Polyline
          positions={linePositions}
          pathOptions={{
            color: '#3B82F6',
            weight: 2,
            dashArray: '8 4',
          }}
        />
      )}

      {/* Live preview line */}
      {previewPositions.length === 2 && (
        <Polyline
          positions={previewPositions}
          pathOptions={{
            color: '#60A5FA',
            weight: 1,
            dashArray: '4 4',
          }}
        />
      )}

      {/* Point markers */}
      {drawing.points.map((point, index) => {
        const isFirst = index === 0;
        const canClose = isFirst && drawing.points.length >= 3 && !drawing.isClosed;

        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={canClose ? 10 : 8}
            pathOptions={{
              fillColor: canClose ? '#22c55e' : '#ffffff',
              fillOpacity: 0.9,
              color: '#3B82F6',
              weight: 2,
            }}
            eventHandlers={{
              click: (e) => {
                // Prevent map click from also firing
                L.DomEvent.stopPropagation(e.originalEvent);
                if (!drawing.isDrawing) {
                  // Re-enter drawing from this point
                  drawing.resumeFrom(point.id);
                }
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

  // Wait for container layout before mounting Leaflet
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
          <DrawingLayer
            drawing={drawing}
            onPolygonComplete={onPolygonComplete}
          />
        </MapContainer>
      )}

      {/* Drawing mode toggle button */}
      <button
        onClick={handleToggleDrawing}
        className={`absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
          drawing.isDrawing
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {drawing.isDrawing ? 'Cancel' : 'Make Selection'}
      </button>

      {/* Bottom controls: Create Run Route + Clear */}
      {drawing.isClosed && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3">
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition-colors font-medium"
          >
            Create Run Route
          </button>
          <button
            onClick={drawing.clear}
            className="px-3 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
