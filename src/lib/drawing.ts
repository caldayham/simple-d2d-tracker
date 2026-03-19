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

  const clear = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const getCoordinates = useCallback((): [number, number][] => {
    return state.points.map((p) => [p.lat, p.lng]);
  }, [state.points]);

  return {
    ...state,
    isClosed,
    startDrawing,
    stopDrawing,
    addPoint,
    selectPoint,
    connectToPoint,
    removePoint,
    clear,
    getCoordinates,
  };
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
