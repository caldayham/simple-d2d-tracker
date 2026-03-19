export type AddressSuggestion = {
  display_name: string;
  short_address: string;
  lat: number;
  lon: number;
};

// Default center: Palo Alto
const DEFAULT_LAT = 37.4419;
const DEFAULT_LON = -122.143;

// ~5km radius in degrees (rough)
const VIEWBOX_SPREAD = 0.045;

export async function searchAddress(
  query: string,
  centerLat?: number,
  centerLon?: number
): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) return [];
  try {
    const lat = centerLat ?? DEFAULT_LAT;
    const lon = centerLon ?? DEFAULT_LON;
    const viewbox = `${lon - VIEWBOX_SPREAD},${lat + VIEWBOX_SPREAD},${lon + VIEWBOX_SPREAD},${lat - VIEWBOX_SPREAD}`;

    const params = new URLSearchParams({
      format: 'jsonv2',
      q: query,
      addressdetails: '1',
      limit: '5',
      viewbox,
      bounded: '0', // prefer results in viewbox but don't exclude others
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: Record<string, unknown>) => {
      const addr = (item.address || {}) as Record<string, string>;
      const house_number = addr.house_number;
      const road = addr.road;
      const city = addr.city || addr.town || addr.village;
      let short_address = '';
      if (house_number && road) {
        short_address = `${house_number} ${road}`;
      } else if (road) {
        short_address = city ? `${road}, ${city}` : road;
      } else {
        short_address = (item.display_name as string) || '';
      }
      return {
        display_name: (item.display_name as string) || '',
        short_address,
        lat: parseFloat(item.lat as string),
        lon: parseFloat(item.lon as string),
      };
    });
  } catch {
    return [];
  }
}

type GeocodingResult = {
  display_name: string;
  short_address: string;
  house_number?: string;
  road?: string;
  city?: string;
};

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
        },
      }
    );

    if (!res.ok) {
      console.error(`Nominatim returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const addr = data.address || {};
    const house_number = addr.house_number;
    const road = addr.road;
    const city = addr.city || addr.town || addr.village;

    // Build short address like "123 Main St" or "Main St, Palo Alto"
    let short_address = '';
    if (house_number && road) {
      short_address = `${house_number} ${road}`;
    } else if (road) {
      short_address = city ? `${road}, ${city}` : road;
    } else {
      short_address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    return {
      display_name: data.display_name || '',
      short_address,
      house_number,
      road,
      city,
    };
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    return null;
  }
}
