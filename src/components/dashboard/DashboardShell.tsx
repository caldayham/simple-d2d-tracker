'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Session, Visit } from '@/lib/types';
import { getSessionColor } from '@/lib/colors';
import { SessionFilter } from './SessionFilter';
import { VisitList } from './VisitList';
import { VisitDetail } from './VisitDetail';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
});

interface DashboardShellProps {
  sessions: Session[];
  visits: Visit[];
}

export function DashboardShell({ sessions, visits }: DashboardShellProps) {
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((session, index) => {
      map.set(session.id, getSessionColor(index));
    });
    return map;
  }, [sessions]);

  const filteredVisits = useMemo(() => {
    if (!selectedSessionId) return visits;
    return visits.filter((v) => v.session_id === selectedSessionId);
  }, [visits, selectedSessionId]);

  const selectedVisit = useMemo(() => {
    if (!selectedVisitId) return null;
    return visits.find((v) => v.id === selectedVisitId) ?? null;
  }, [visits, selectedVisitId]);

  const selectedVisitColor = selectedVisit
    ? sessionColorMap.get(selectedVisit.session_id) ?? '#3B82F6'
    : '#3B82F6';

  if (visits.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        No visits recorded yet. Start a canvassing session from your phone.
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 relative">
        <DashboardMap
          visits={filteredVisits}
          sessionColorMap={sessionColorMap}
          selectedVisitId={selectedVisitId}
          onSelectVisit={setSelectedVisitId}
        />
      </div>
      <div className="w-[400px] border-l border-zinc-800 flex flex-col overflow-hidden">
        <SessionFilter
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
        <VisitList
          visits={filteredVisits}
          sessionColorMap={sessionColorMap}
          selectedVisitId={selectedVisitId}
          onSelectVisit={setSelectedVisitId}
        />
        {selectedVisit && (
          <VisitDetail visit={selectedVisit} sessionColor={selectedVisitColor} />
        )}
      </div>
    </>
  );
}
