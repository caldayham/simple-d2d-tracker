/**
 * Sort knocks by their projection along a direction polyline.
 * Each knock is projected to the nearest point on the polyline,
 * then sorted by distance along the polyline from start.
 */
export function sortKnocksByDirection<
  T extends { latitude: number; longitude: number }
>(knocks: T[], directionPoints: Array<{ lat: number; lng: number }>): T[] {
  if (directionPoints.length < 2 || knocks.length <= 1) return [...knocks];

  // Build segments with cumulative distance
  const segments: Array<{
    startLat: number; startLng: number;
    endLat: number; endLng: number;
    cumDist: number;
    length: number;
  }> = [];

  let cumDist = 0;
  for (let i = 0; i < directionPoints.length - 1; i++) {
    const s = directionPoints[i];
    const e = directionPoints[i + 1];
    const length = Math.sqrt(
      Math.pow((e.lat - s.lat) * 111320, 2) +
      Math.pow((e.lng - s.lng) * 111320 * Math.cos((s.lat * Math.PI) / 180), 2)
    );
    segments.push({
      startLat: s.lat, startLng: s.lng,
      endLat: e.lat, endLng: e.lng,
      cumDist, length,
    });
    cumDist += length;
  }

  // For each knock, find position along the polyline
  const withDist = knocks.map((knock) => {
    let minDist = Infinity;
    let alongPolyline = 0;

    for (const seg of segments) {
      // Project knock onto segment in meter-space
      const dx = (seg.endLng - seg.startLng) * 111320 * Math.cos((seg.startLat * Math.PI) / 180);
      const dy = (seg.endLat - seg.startLat) * 111320;
      const px = (knock.longitude - seg.startLng) * 111320 * Math.cos((seg.startLat * Math.PI) / 180);
      const py = (knock.latitude - seg.startLat) * 111320;

      const lenSq = dx * dx + dy * dy;
      let t = lenSq > 0 ? (px * dx + py * dy) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));

      const projX = t * dx;
      const projY = t * dy;
      const dist = Math.sqrt(Math.pow(px - projX, 2) + Math.pow(py - projY, 2));

      if (dist < minDist) {
        minDist = dist;
        alongPolyline = seg.cumDist + t * seg.length;
      }
    }

    return { knock, alongPolyline };
  });

  withDist.sort((a, b) => a.alongPolyline - b.alongPolyline);
  return withDist.map((k) => k.knock);
}

/**
 * Walking order sort algorithm for planned knocks.
 *
 * Sorts knocks into a serpentine street-walking pattern:
 * 1. Group by street name
 * 2. Order streets geographically (north to south by avg latitude)
 * 3. Within each street: odd house numbers ascending, then even descending
 */

function parseAddress(address: string): { houseNumber: number | null; street: string } {
  const match = address.match(/^(\d+)\s+(.+)$/);
  if (!match) return { houseNumber: null, street: address };
  return { houseNumber: parseInt(match[1], 10), street: match[2].toLowerCase().trim() };
}

export function sortKnocksWalkingOrder<
  T extends { latitude: number; longitude: number; address: string | null }
>(knocks: T[]): T[] {
  if (knocks.length <= 1) return [...knocks];

  // Group knocks by street name
  const streetGroups = new Map<string, T[]>();
  const noStreetGroup: T[] = [];

  for (const knock of knocks) {
    if (!knock.address) {
      noStreetGroup.push(knock);
      continue;
    }

    const { street } = parseAddress(knock.address);
    if (!streetGroups.has(street)) {
      streetGroups.set(street, []);
    }
    streetGroups.get(street)!.push(knock);
  }

  // Sort streets geographically by average latitude (north to south = descending)
  const sortedStreets = Array.from(streetGroups.entries()).sort(([, a], [, b]) => {
    const avgLatA = a.reduce((sum, k) => sum + k.latitude, 0) / a.length;
    const avgLatB = b.reduce((sum, k) => sum + k.latitude, 0) / b.length;
    return avgLatB - avgLatA; // north to south
  });

  const result: T[] = [];

  for (const [, group] of sortedStreets) {
    const odds: { knock: T; num: number }[] = [];
    const evens: { knock: T; num: number }[] = [];
    const noParse: T[] = [];

    for (const knock of group) {
      const { houseNumber } = parseAddress(knock.address!);
      if (houseNumber === null) {
        noParse.push(knock);
      } else if (houseNumber % 2 === 1) {
        odds.push({ knock, num: houseNumber });
      } else {
        evens.push({ knock, num: houseNumber });
      }
    }

    // Odd numbers ascending (down one side)
    odds.sort((a, b) => a.num - b.num);
    // Even numbers descending (back the other side)
    evens.sort((a, b) => b.num - a.num);

    for (const { knock } of odds) result.push(knock);
    for (const { knock } of evens) result.push(knock);
    for (const knock of noParse) result.push(knock);
  }

  // Append no-street knocks sorted by latitude (north to south)
  noStreetGroup.sort((a, b) => b.latitude - a.latitude);
  for (const knock of noStreetGroup) result.push(knock);

  return result;
}
