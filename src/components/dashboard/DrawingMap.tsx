'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import {
  useDrawingState,
  isPointNearTarget,
  getEdges,
  getOrderedPoints,
  nearestPointOnSegment,
  type DrawingPoint,
} from '@/lib/drawing';

const MAP_VIEW_KEY = 'plan-map-view';

const PALO_ALTO_CENTER: [number, number] = [37.4419, -122.143];
const DEFAULT_ZOOM = 13;

function getSavedMapView(): { center: [number, number]; zoom: number } {
  try {
    const saved = localStorage.getItem(MAP_VIEW_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.center && parsed.zoom) return parsed;
    }
  } catch {}
  return { center: PALO_ALTO_CENTER, zoom: DEFAULT_ZOOM };
}

function MapStateTracker() {
  const map = useMap();
  useMapEvents({
    moveend() {
      const c = map.getCenter();
      localStorage.setItem(MAP_VIEW_KEY, JSON.stringify({ center: [c.lat, c.lng], zoom: map.getZoom() }));
    },
  });
  return null;
}

export interface PlannedKnock {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  notes: string;
}

interface ExecutedVisit {
  id: string;
  latitude: number;
  longitude: number;
}

interface DirectionPoint {
  lat: number;
  lng: number;
}

interface DrawingMapProps {
  onPolygonComplete: (points: DrawingPoint[]) => void;
  onCancel: () => void;
  onClearAll?: () => void;
  onDirectionSet?: (points: DirectionPoint[]) => void;
  plannedKnocks?: PlannedKnock[];
  selectedKnockId?: string | null;
  onSelectKnock?: (id: string | null) => void;
  executedVisits?: ExecutedVisit[];
  showExecuted?: boolean;
}

function getBearing(from: DirectionPoint, to: DirectionPoint): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createTriangleIcon(bearing: number): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(${bearing}deg)">
      <polygon points="9,2 15,14 3,14" fill="#f59e0b" opacity="0.9" stroke="#fff" stroke-width="1"/>
    </svg>`,
  });
}

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

// Pre-create common icons
const knockIcon = createSquareIcon('#3B82F6', false);
const knockIconSelected = createSquareIcon('#3B82F6', true);
const executedIcon = createSquareIcon('#ef4444', false);

function DrawingLayer({
  drawing,
  plannedKnocks = [],
  selectedKnockId,
  onSelectKnock,
  executedVisits = [],
  showExecuted = false,
  directionPoints = [],
  isDirectionMode = false,
  onAddDirectionPoint,
}: {
  drawing: ReturnType<typeof useDrawingState>;
  plannedKnocks: PlannedKnock[];
  selectedKnockId: string | null;
  onSelectKnock: (id: string | null) => void;
  executedVisits: ExecutedVisit[];
  showExecuted: boolean;
  directionPoints: DirectionPoint[];
  isDirectionMode: boolean;
  onAddDirectionPoint?: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);
  const [edgeHover, setEdgeHover] = useState<{ lat: number; lng: number; aId: string; bId: string } | null>(null);
  const draggingRef = useRef<{ id: string; moved: boolean } | null>(null);
  const skipNextClick = useRef(false);

  const EDGE_THRESHOLD = 10; // pixels

  // Find nearest edge to a latlng position
  const findNearestEdge = useCallback(
    (latlng: L.LatLng) => {
      const edges = getEdges(drawing.points);
      const pointMap = new Map(drawing.points.map((p) => [p.id, p]));
      const cursorPx = map.latLngToContainerPoint(latlng);

      let best: { aId: string; bId: string; lat: number; lng: number; dist: number } | null = null;

      for (const [aId, bId] of edges) {
        const a = pointMap.get(aId);
        const b = pointMap.get(bId);
        if (!a || !b) continue;

        const aPx = map.latLngToContainerPoint(L.latLng(a.lat, a.lng));
        const bPx = map.latLngToContainerPoint(L.latLng(b.lat, b.lng));
        const { projected, distance, t } = nearestPointOnSegment(cursorPx, aPx, bPx);

        // Skip if too close to endpoints (those are point interactions, not edge)
        if (t < 0.1 || t > 0.9) continue;

        if (distance < EDGE_THRESHOLD && (!best || distance < best.dist)) {
          const projLatLng = map.containerPointToLatLng(projected);
          best = { aId, bId, lat: projLatLng.lat, lng: projLatLng.lng, dist: distance };
        }
      }

      return best;
    },
    [drawing.points, map],
  );

  useMapEvents({
    mousedown(e) {
      // Check if near a drawing point for dragging
      for (const point of drawing.points) {
        const pointLatLng = L.latLng(point.lat, point.lng);
        if (isPointNearTarget(e.latlng, pointLatLng, map, 20)) {
          draggingRef.current = { id: point.id, moved: false };
          map.dragging.disable();
          return;
        }
      }
    },
    mousemove(e) {
      if (draggingRef.current) {
        draggingRef.current.moved = true;
        drawing.movePoint(draggingRef.current.id, e.latlng.lat, e.latlng.lng);
        setEdgeHover(null);
      } else if (isDirectionMode) {
        setCursorPos([e.latlng.lat, e.latlng.lng]);
        setEdgeHover(null);
      } else if (drawing.isDrawing && drawing.activePointId) {
        setCursorPos([e.latlng.lat, e.latlng.lng]);
        setEdgeHover(null);
      } else {
        setCursorPos(null);

        // Check for edge hover (when not drawing and not dragging)
        if (drawing.points.length >= 2) {
          const nearest = findNearestEdge(e.latlng);
          setEdgeHover(nearest ? { lat: nearest.lat, lng: nearest.lng, aId: nearest.aId, bId: nearest.bId } : null);
        } else {
          setEdgeHover(null);
        }
      }
    },
    mouseup() {
      if (draggingRef.current) {
        const { id, moved } = draggingRef.current;
        map.dragging.enable();
        draggingRef.current = null;

        if (!moved) {
          // Click on point (no drag) — select or close polygon
          if (
            drawing.isDrawing &&
            drawing.activePointId &&
            drawing.activePointId !== id &&
            drawing.points.length >= 3
          ) {
            const point = drawing.points.find((p) => p.id === id);
            if (point && point.connections.length < 2) {
              drawing.connectToPoint(id);
            } else {
              drawing.selectPoint(id);
            }
          } else {
            drawing.selectPoint(id);
          }
        }

        skipNextClick.current = true;
      }
    },
    click(e) {
      if (skipNextClick.current) {
        skipNextClick.current = false;
        return;
      }

      // Check if near any existing point (handled by mousedown/mouseup)
      for (const point of drawing.points) {
        if (isPointNearTarget(e.latlng, L.latLng(point.lat, point.lng), map)) {
          return;
        }
      }

      // Check if clicking on an edge — insert point
      if (drawing.points.length >= 2) {
        const nearest = findNearestEdge(e.latlng);
        if (nearest) {
          drawing.insertPointOnEdge(nearest.aId, nearest.bId, nearest.lat, nearest.lng);
          setEdgeHover(null);
          return;
        }
      }

      // Direction mode — add direction point
      if (isDirectionMode) {
        onAddDirectionPoint?.(e.latlng.lat, e.latlng.lng);
        return;
      }

      // Add new point (only in drawing mode)
      if (!drawing.isDrawing) return;
      drawing.addPoint(e.latlng.lat, e.latlng.lng);
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

      {/* Executed visit markers (red squares) */}
      {showExecuted && executedVisits.map((v) => (
        <Marker
          key={`exec-${v.id}`}
          position={[v.latitude, v.longitude]}
          icon={executedIcon}
        />
      ))}

      {/* Planned knock markers (blue squares) */}
      {plannedKnocks.map((knock) => (
        <Marker
          key={`knock-${knock.id}`}
          position={[knock.latitude, knock.longitude]}
          icon={knock.id === selectedKnockId ? knockIconSelected : knockIcon}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              onSelectKnock(knock.id === selectedKnockId ? null : knock.id);
            },
          }}
        />
      ))}

      {/* Direction polyline */}
      {directionPoints.length >= 2 && (
        <Polyline
          positions={directionPoints.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: '#f59e0b',
            weight: 3,
            dashArray: '6 4',
            opacity: 0.8,
          }}
        />
      )}

      {/* Direction preview line (last point to cursor) */}
      {isDirectionMode && directionPoints.length > 0 && cursorPos && (
        <Polyline
          positions={[
            [directionPoints[directionPoints.length - 1].lat, directionPoints[directionPoints.length - 1].lng],
            cursorPos,
          ]}
          pathOptions={{
            color: '#f59e0b',
            weight: 2,
            dashArray: '4 4',
            opacity: 0.5,
          }}
        />
      )}

      {/* Direction triangle markers */}
      {directionPoints.map((point, i) => {
        const next = directionPoints[i + 1];
        const prev = directionPoints[i - 1];
        // Determine what to point toward: next point, or cursor if last point in direction mode
        let target: DirectionPoint | null = null;
        if (next) {
          target = next;
        } else if (isDirectionMode && cursorPos) {
          // Last point + direction mode: point toward cursor
          target = { lat: cursorPos[0], lng: cursorPos[1] };
        } else if (prev) {
          // Last point, not in direction mode: extrapolate from prev
          target = { lat: point.lat + (point.lat - prev.lat), lng: point.lng + (point.lng - prev.lng) };
        }
        if (!target) {
          // Single point with no cursor — show a default up-facing triangle
          return (
            <Marker
              key={`dir-${i}`}
              position={[point.lat, point.lng]}
              icon={createTriangleIcon(0)}
            />
          );
        }
        const bearing = getBearing(point, target);
        return (
          <Marker
            key={`dir-${i}`}
            position={[point.lat, point.lng]}
            icon={createTriangleIcon(bearing)}
          />
        );
      })}

      {/* Drawing point markers — rendered last so they sit above house boxes */}
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
          />
        );
      })}

      {/* Edge hover ghost point */}
      {edgeHover && (
        <CircleMarker
          center={[edgeHover.lat, edgeHover.lng]}
          radius={7}
          pathOptions={{
            fillColor: '#60A5FA',
            fillOpacity: 0.6,
            color: '#3B82F6',
            weight: 2,
          }}
        />
      )}
    </>
  );
}

export default function DrawingMap({
  onPolygonComplete,
  onCancel,
  onClearAll,
  onDirectionSet,
  plannedKnocks = [],
  selectedKnockId = null,
  onSelectKnock,
  executedVisits = [],
  showExecuted = false,
}: DrawingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const drawing = useDrawingState();
  const [initialView] = useState(() => getSavedMapView());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Direction tool state
  const [directionPoints, setDirectionPoints] = useState<DirectionPoint[]>([]);
  const [isDirectionMode, setIsDirectionMode] = useState(false);

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

  const handleAddDirectionPoint = useCallback((lat: number, lng: number) => {
    setDirectionPoints((prev) => [...prev, { lat, lng }]);
  }, []);

  // Notify parent when direction changes (outside render cycle)
  useEffect(() => {
    if (directionPoints.length >= 2) {
      onDirectionSet?.(directionPoints);
    }
  }, [directionPoints, onDirectionSet]);

  // Plain function — always reads from current render's `drawing`
  function handleComplete() {
    const closed = drawing.points.length >= 3 && drawing.points.every((p) => p.connections.length === 2);
    if (!closed) {
      toast.error('No selection areas found. Close the loop by clicking the first point.');
      return;
    }
    onPolygonComplete(getOrderedPoints(drawing.points));
  }

  // Keyboard shortcuts — `drawing` in deps ensures fresh closure
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'a') {
        setIsDirectionMode(false);
        if (drawing.isDrawing) {
          drawing.stopDrawing();
        } else {
          drawing.startDrawing();
        }
        return;
      }

      if (e.key === 'd') {
        drawing.stopDrawing();
        setIsDirectionMode((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (showClearConfirm) {
          drawing.clear();
          setDirectionPoints([]);
          onClearAll?.();
          setShowClearConfirm(false);
          return;
        }
        if (drawing.points.length > 0) {
          setShowClearConfirm(true);
          return;
        }
        setDirectionPoints((prev) => {
          if (prev.length > 0) {
            setShowClearConfirm(true);
          }
          return prev;
        });
        return;
      }

      if (e.key === 'r') {
        if (drawing.points.length === 0) return;
        // Inline check — reads directly from effect closure's `drawing`
        const closed = drawing.points.length >= 3 && drawing.points.every((p) => p.connections.length === 2);
        if (!closed) {
          toast.error('No selection areas found. Close the loop by clicking the first point.');
          return;
        }
        onPolygonComplete(getOrderedPoints(drawing.points));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setDirectionPoints((prev) => {
          if (isDirectionMode && prev.length > 0) {
            const next = prev.slice(0, -1);
            if (next.length >= 2) {
              onDirectionSet?.(next);
            }
            return next;
          }
          return prev;
        });
        if (!isDirectionMode && drawing.activePointId) {
          drawing.removePoint(drawing.activePointId);
        }
        return;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawing, showClearConfirm, onClearAll, onDirectionSet, isDirectionMode, onPolygonComplete]);

  const handleToggleDrawing = useCallback(() => {
    if (drawing.isDrawing) {
      drawing.stopDrawing();
      onCancel();
    } else {
      drawing.startDrawing();
    }
  }, [drawing, onCancel]);

  const handleSelectKnock = useCallback(
    (id: string | null) => {
      onSelectKnock?.(id);
    },
    [onSelectKnock],
  );

  const hasPoints = drawing.points.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: '#18181b' }}>
      {ready && (
        <MapContainer
          center={initialView.center}
          zoom={initialView.zoom}
          className="w-full h-full"
          style={{ background: '#18181b' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles-dark"
          />
          <MapStateTracker />
          <DrawingLayer
            drawing={drawing}
            plannedKnocks={plannedKnocks}
            selectedKnockId={selectedKnockId}
            onSelectKnock={handleSelectKnock}
            executedVisits={executedVisits}
            showExecuted={showExecuted}
            directionPoints={directionPoints}
            isDirectionMode={isDirectionMode}
            onAddDirectionPoint={handleAddDirectionPoint}
          />
        </MapContainer>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        <button
          onClick={() => {
            setIsDirectionMode(false);
            handleToggleDrawing();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
            drawing.isDrawing
              ? 'bg-blue-800 text-white hover:bg-blue-700 ring-2 ring-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          Make Selection
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">A</kbd>
        </button>

        {/* Set Direction */}
        <button
          onClick={() => {
            drawing.stopDrawing();
            setIsDirectionMode((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
            isDirectionMode
              ? 'bg-amber-700 text-white hover:bg-amber-600 ring-2 ring-amber-400'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          Set Direction
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">D</kbd>
        </button>

        {/* Create Run Route — always visible */}
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          Create Run Route
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">R</kbd>
        </button>

        {/* Clear all */}
        {(hasPoints || directionPoints.length > 0) && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 text-sm rounded-lg shadow-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Mode hints */}
      {drawing.isDrawing && drawing.points.length === 0 && (
        <div className="absolute top-4 left-4 z-[1000] px-3 py-2 bg-zinc-800/90 text-zinc-400 text-xs rounded-lg">
          Click to place points · Click first point to close · A to toggle
        </div>
      )}
      {isDirectionMode && (
        <div className="absolute top-4 left-4 z-[1000] px-3 py-2 bg-zinc-800/90 text-amber-400 text-xs rounded-lg">
          Click to set direction path · Knocks will be ordered along this line · Backspace to undo
        </div>
      )}

      {/* Clear confirmation popup */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/40">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl max-w-xs text-center space-y-4">
            <p className="text-sm text-zinc-200">Clear all selection points?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  drawing.clear();
                  onClearAll?.();
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Yes
                <kbd className="ml-1.5 px-1 py-0.5 text-[10px] bg-red-700 rounded">Esc</kbd>
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-3 py-2 text-sm bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                No, keep points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
