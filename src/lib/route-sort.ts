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
