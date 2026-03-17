export const SESSION_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
] as const;

export function getSessionColor(sessionIndex: number): string {
  return SESSION_COLORS[sessionIndex % SESSION_COLORS.length];
}
