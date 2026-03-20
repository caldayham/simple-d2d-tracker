'use client';

import { useState, useCallback, useMemo } from 'react';
import L from 'leaflet';

export type DrawingPoint = {
  id: string;
  lat: number;
  lng: number;
  connections: string[];
};

export type DrawingState = {
  points: DrawingPoint[];
  isDrawing: boolean;
  activePointId: string | null;
};

const INITIAL_STATE: DrawingState = {
  points: [],
  isDrawing: false,
  activePointId: null,
};

/**
 * Traverse the connection graph to return points in polygon-boundary order.
 * Starts from the first point and follows connections to produce a correctly
 * ordered polygon. This is critical because the points array is in insertion
 * order, which diverges from traversal order when points are inserted on edges.
 */
export function getOrderedPoints(points: DrawingPoint[]): DrawingPoint[] {
  if (points.length < 3) return points;

  const byId = new Map(points.map((p) => [p.id, p]));
  const ordered: DrawingPoint[] = [];
  const visited = new Set<string>();

  let current = points[0];
  ordered.push(current);
  visited.add(current.id);

  while (ordered.length < points.length) {
    const next = current.connections
      .map((id) => byId.get(id)!)
      .find((p) => p && !visited.has(p.id));
    if (!next) break; // shouldn't happen in a valid closed polygon
    ordered.push(next);
    visited.add(next.id);
    current = next;
  }

  return ordered;
}

/** Deduplicated edges from point connections */
export function getEdges(points: DrawingPoint[]): [string, string][] {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const point of points) {
    for (const connId of point.connections) {
      const key = [point.id, connId].sort().join(':');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([point.id, connId]);
      }
    }
  }
  return edges;
}

export function useDrawingState() {
  const [state, setState] = useState<DrawingState>(INITIAL_STATE);

  const isClosed = useMemo(
    () => state.points.length >= 3 && state.points.every((p) => p.connections.length === 2),
    [state.points],
  );

  const startDrawing = useCallback(() => {
    setState((s) => ({ ...s, isDrawing: true, activePointId: null }));
  }, []);

  const stopDrawing = useCallback(() => {
    setState((s) => ({ ...s, isDrawing: false }));
  }, []);

  const addPoint = useCallback((lat: number, lng: number) => {
    setState((s) => {
      const newId = crypto.randomUUID();
      const newPoint: DrawingPoint = { id: newId, lat, lng, connections: [] };

      // Connect to active point if one exists
      if (s.activePointId) {
        const activePoint = s.points.find((p) => p.id === s.activePointId);
        if (activePoint) {
          newPoint.connections = [s.activePointId];
          return {
            ...s,
            points: s.points.map((p) =>
              p.id === s.activePointId
                ? { ...p, connections: [...p.connections, newId] }
                : p,
            ).concat(newPoint),
            activePointId: newId,
          };
        }
      }

      // No active point — standalone point
      return {
        ...s,
        points: [...s.points, newPoint],
        activePointId: newId,
      };
    });
  }, []);

  const selectPoint = useCallback((id: string) => {
    setState((s) => ({ ...s, activePointId: id }));
  }, []);

  const connectToPoint = useCallback((targetId: string) => {
    setState((s) => {
      if (!s.activePointId || s.activePointId === targetId) return s;

      const active = s.points.find((p) => p.id === s.activePointId);
      const target = s.points.find((p) => p.id === targetId);
      if (!active || !target) return s;

      // Already connected
      if (active.connections.includes(targetId)) return s;

      // Don't allow more than 2 connections per point (polygon path)
      if (active.connections.length >= 2 || target.connections.length >= 2) return s;

      return {
        ...s,
        points: s.points.map((p) => {
          if (p.id === s.activePointId) return { ...p, connections: [...p.connections, targetId] };
          if (p.id === targetId) return { ...p, connections: [...p.connections, s.activePointId!] };
          return p;
        }),
        isDrawing: false,
        activePointId: null,
      };
    });
  }, []);

  const movePoint = useCallback((id: string, lat: number, lng: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) => (p.id === id ? { ...p, lat, lng } : p)),
    }));
  }, []);

  const removePoint = useCallback((id: string) => {
    setState((s) => {
      const point = s.points.find((p) => p.id === id);
      if (!point) return s;

      // Remove the point and clean up connections
      let newPoints = s.points
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          connections: p.connections.filter((c) => c !== id),
        }));

      // If removed point bridged two others, reconnect them
      if (point.connections.length === 2) {
        const [a, b] = point.connections;
        newPoints = newPoints.map((p) => {
          if (p.id === a && !p.connections.includes(b)) {
            return { ...p, connections: [...p.connections, b] };
          }
          if (p.id === b && !p.connections.includes(a)) {
            return { ...p, connections: [...p.connections, a] };
          }
          return p;
        });
      }

      return {
        ...s,
        points: newPoints,
        activePointId: s.activePointId === id ? null : s.activePointId,
      };
    });
  }, []);

  const insertPointOnEdge = useCallback((aId: string, bId: string, lat: number, lng: number) => {
    setState((s) => {
      const a = s.points.find((p) => p.id === aId);
      const b = s.points.find((p) => p.id === bId);
      if (!a || !b) return s;
      if (!a.connections.includes(bId)) return s;

      const newId = crypto.randomUUID();
      const newPoint: DrawingPoint = {
        id: newId,
        lat,
        lng,
        connections: [aId, bId],
      };

      // Remove old A↔B connection, add A↔new and B↔new
      const newPoints = s.points.map((p) => {
        if (p.id === aId) {
          return { ...p, connections: p.connections.map((c) => (c === bId ? newId : c)) };
        }
        if (p.id === bId) {
          return { ...p, connections: p.connections.map((c) => (c === aId ? newId : c)) };
        }
        return p;
      });
      newPoints.push(newPoint);

      return { ...s, points: newPoints, activePointId: newId };
    });
  }, []);

  const clear = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const getCoordinates = useCallback((): [number, number][] => {
    return getOrderedPoints(state.points).map((p) => [p.lat, p.lng]);
  }, [state.points]);

  return {
    ...state,
    isClosed,
    startDrawing,
    stopDrawing,
    addPoint,
    selectPoint,
    connectToPoint,
    movePoint,
    insertPointOnEdge,
    removePoint,
    clear,
    getCoordinates,
  };
}

/**
 * Find the nearest point on a line segment to a given point, in pixel space.
 * Returns the projected point and pixel distance.
 */
export function nearestPointOnSegment(
  point: L.Point,
  segA: L.Point,
  segB: L.Point,
): { projected: L.Point; distance: number; t: number } {
  const dx = segB.x - segA.x;
  const dy = segB.y - segA.y;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = ((point.x - segA.x) * dx + (point.y - segA.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const projected = L.point(segA.x + t * dx, segA.y + t * dy);
  const pdx = point.x - projected.x;
  const pdy = point.y - projected.y;

  return { projected, distance: Math.sqrt(pdx * pdx + pdy * pdy), t };
}

/**
 * Check if a click is near a target point, using pixel distance for zoom-independence.
 */
export function isPointNearTarget(
  clickLatLng: L.LatLng,
  targetLatLng: L.LatLng,
  map: L.Map,
  pixelThreshold: number = 15,
): boolean {
  const clickPx = map.latLngToContainerPoint(clickLatLng);
  const targetPx = map.latLngToContainerPoint(targetLatLng);
  const dx = clickPx.x - targetPx.x;
  const dy = clickPx.y - targetPx.y;
  return Math.sqrt(dx * dx + dy * dy) < pixelThreshold;
}

/**
 * Get bounding box of drawn points.
 */
export function getPolygonBounds(points: DrawingPoint[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null {
  if (points.length < 2) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}
