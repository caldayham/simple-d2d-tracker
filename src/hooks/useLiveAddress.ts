'use client';

import { useState, useEffect, useRef } from 'react';

type LiveAddressResult = {
  address: string | null;
  isResolving: boolean;
};

export function useLiveAddress(
  latitude: number | null,
  longitude: number | null
): LiveAddressResult {
  const [address, setAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const lastFetchRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (latitude === null || longitude === null) return;

    const now = Date.now();
    const last = lastFetchRef.current;

    // Skip if position hasn't moved meaningfully (~10m)
    if (last) {
      const dlat = Math.abs(latitude - last.lat);
      const dlng = Math.abs(longitude - last.lng);
      const moved = dlat > 0.0001 || dlng > 0.0001; // ~11m
      if (!moved) return;

      // Throttle to once every 3 seconds
      const elapsed = now - last.time;
      if (elapsed < 3000) {
        // Schedule a delayed fetch
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          fetchAddress(latitude, longitude);
        }, 3000 - elapsed);
        return;
      }
    }

    fetchAddress(latitude, longitude);

    async function fetchAddress(lat: number, lng: number) {
      setIsResolving(true);
      lastFetchRef.current = { lat, lng, time: Date.now() };

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const addr = data.address || {};
        const house_number = addr.house_number;
        const road = addr.road;

        let short = '';
        if (house_number && road) {
          short = `${house_number} ${road}`;
        } else if (road) {
          short = road;
        } else {
          short = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        setAddress(short);
      } catch {
        // Silently fail — keep last known address
      } finally {
        setIsResolving(false);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [latitude, longitude]);

  return { address, isResolving };
}
