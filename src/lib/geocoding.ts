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
