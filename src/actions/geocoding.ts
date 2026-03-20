'use server';

/**
 * Ray-casting point-in-polygon test.
 * Returns true if (lat, lng) is inside the polygon defined by vertices.
 */
function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat, xi = polygon[i].lng;
    const yj = polygon[j].lat, xj = polygon[j].lng;
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Find house addresses within a polygon using OpenStreetMap's Overpass API.
 * Overpass is designed for spatial queries ("find all X within this area"),
 * unlike Nominatim which is for single-address lookups.
 */
export async function findAddressesInArea(
  polygon: Array<{ lat: number; lng: number }>
): Promise<Array<{ latitude: number; longitude: number; address: string }>> {
  try {
    if (polygon.length < 3) return [];

    // Build Overpass poly filter: space-separated "lat lng" pairs
    const polyString = polygon.map((p) => `${p.lat} ${p.lng}`).join(' ');

    // Query for buildings and nodes with house numbers within the polygon
    const query = `
      [out:json][timeout:25];
      (
        way["building"]["addr:housenumber"](poly:"${polyString}");
        node["addr:housenumber"](poly:"${polyString}");
      );
      out center;
    `.trim();

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.error(`Overpass API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const elements: Array<{
      type: string;
      tags?: Record<string, string>;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
    }> = data.elements || [];

    // Extract addresses with coordinates
    const seen = new Set<string>();
    const results: Array<{ latitude: number; longitude: number; address: string }> = [];

    for (const el of elements) {
      const tags = el.tags;
      if (!tags) continue;

      const housenumber = tags['addr:housenumber'];
      const street = tags['addr:street'];
      if (!housenumber || !street) continue;

      const address = `${housenumber} ${street}`;

      // Deduplicate (same house can appear as both node and way)
      if (seen.has(address)) continue;
      seen.add(address);

      // Get coordinates: nodes have lat/lon directly, ways have center
      const lat = el.type === 'node' ? el.lat : el.center?.lat;
      const lon = el.type === 'node' ? el.lon : el.center?.lon;
      if (lat === undefined || lon === undefined) continue;

      results.push({ latitude: lat, longitude: lon, address });
    }

    // Filter to only houses whose center is actually inside the polygon
    // (Overpass poly filter matches buildings with any vertex touching the polygon)
    const filtered = results.filter((r) =>
      isPointInPolygon(r.latitude, r.longitude, polygon)
    );

    // Natural sort by address so "2 Main St" comes before "10 Main St"
    filtered.sort((a, b) =>
      a.address.localeCompare(b.address, undefined, { numeric: true })
    );

    return filtered;
  } catch (err) {
    console.error('Failed to find addresses in area:', err);
    return [];
  }
}
