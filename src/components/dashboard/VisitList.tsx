'use client';

import type { Visit } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, Mic } from 'lucide-react';

interface VisitListProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
}

export function VisitList({
  visits,
  sessionColorMap,
  selectedVisitId,
  onSelectVisit,
}: VisitListProps) {
  if (visits.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <p className="text-zinc-500 text-sm text-center p-4">
          No visits to show
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {visits.map((visit) => (
        <button
          key={visit.id}
          onClick={() => onSelectVisit(visit.id)}
          className={`w-full text-left p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
            visit.id === selectedVisitId ? 'bg-zinc-800' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  sessionColorMap.get(visit.session_id) ?? '#3B82F6',
              }}
            />
            <span className="text-sm text-white truncate flex-1">
              {visit.address || 'Unknown address'}
            </span>
            {visit.audio_path && (
              <Mic size={14} className="text-zinc-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 ml-[18px]">
            <Clock size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">
              {format(new Date(visit.recorded_at), 'MMM d, h:mm a')}
            </span>
            {visit.result && (
              <span className="text-xs text-zinc-400 bg-zinc-800 rounded px-1.5 py-0.5 ml-auto">
                {visit.result}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
