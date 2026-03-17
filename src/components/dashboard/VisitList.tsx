'use client';

import type { Visit } from '@/lib/types';

interface VisitListProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
}

export function VisitList({}: VisitListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2 text-zinc-500">
      Visit list placeholder
    </div>
  );
}
