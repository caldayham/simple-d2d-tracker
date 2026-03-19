'use client';

import { useState, useCallback } from 'react';
import L from 'leaflet';

export type DrawingPoint = { lat: number; lng: number; id: string };

export type DrawingState = {
  points: DrawingPoint[];
  isDrawing: boolean;
  isClosed: boolean;
  resumeFromId: string | null;
};

const INITIAL_STATE: DrawingState = {
  points: [],
  isDrawing: false,
  isClosed: false,
  resumeFromId: null,
};

export function useDrawingState() {
  const [state, setState] = useState<DrawingState>(INITIAL_STATE);

  const startDrawing = useCallback(() => {
    setState((s) => ({ ...s, isDrawing: true }));
  }, []);

  const stopDrawing = useCallback(() => {
    setState((s) => ({ ...s, isDrawing: false, resumeFromId: null }));
  }, []);

  const addPoint = useCallback((lat: number, lng: number) => {
    setState((s) => {
      const newPoint: DrawingPoint = {
        lat,
        lng,
        id: crypto.randomUUID(),
      };

      let newPoints: DrawingPoint[];
      if (s.resumeFromId) {
        const idx = s.points.findIndex((p) => p.id === s.resumeFromId);
        if (idx >= 0) {
          newPoints = [
            ...s.points.slice(0, idx + 1),
            newPoint,
            ...s.points.slice(idx + 1),
          ];
        } else {
          newPoints = [...s.points, newPoint];
        }
      } else {
        newPoints = [...s.points, newPoint];
      }

      return {
        ...s,
        points: newPoints,
        resumeFromId: null,
      };
    });
  }, []);

  const removePoint = useCallback((id: string) => {
    setState((s) => {
      const newPoints = s.points.filter((p) => p.id !== id);
      return {
        ...s,
        points: newPoints,
        isClosed: newPoints.length <= 1 ? false : s.isClosed,
      };
    });
  }, []);

  const closePolygon = useCallback(() => {
    setState((s) => {
      if (s.points.length < 3) return s;
      return { ...s, isClosed: true, isDrawing: false };
    });
  }, []);

  const resumeFrom = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      resumeFromId: id,
      isDrawing: true,
    }));
  }, []);

  const clear = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const getCoordinates = useCallback((): [number, number][] => {
    return state.points.map((p) => [p.lat, p.lng]);
  }, [state.points]);

  return {
    ...state,
    startDrawing,
    stopDrawing,
    addPoint,
    removePoint,
    closePolygon,
    resumeFrom,
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
  pixelThreshold: number = 15
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
