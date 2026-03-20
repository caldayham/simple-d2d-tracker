export const RUN_COLOR_PRESETS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
] as const;

export const DEFAULT_RUN_COLORS = RUN_COLOR_PRESETS.map((c) => c.hex);

export function getSessionColor(sessionIndex: number): string {
  return DEFAULT_RUN_COLORS[sessionIndex % DEFAULT_RUN_COLORS.length];
}
