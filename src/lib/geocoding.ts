type GeocodingResult = {
  display_name: string;
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
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'CanvassingCompanion/1.0 (contact@example.com)',
        },
      }
    );

    if (!res.ok) {
      console.error(`Nominatim returned ${res.status}`);
      return null;
    }

    const data = await res.json();

    return {
      display_name: data.display_name || '',
      house_number: data.address?.house_number,
      road: data.address?.road,
      city: data.address?.city || data.address?.town || data.address?.village,
    };
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    return null;
  }
}
