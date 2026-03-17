'use client';

import type { Visit } from '@/lib/types';

interface DashboardMapProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
}

export default function DashboardMap({}: DashboardMapProps) {
  return (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
      Map loading...
    </div>
  );
}
