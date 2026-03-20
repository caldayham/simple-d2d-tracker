'use client';

import type { Session, Visit } from '@/lib/types';
import { format } from 'date-fns';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react';

interface RunsListProps {
  sessions: Session[];
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedRunId: string | null;
  onSelectRun: (id: string | null) => void;
  onReorder?: (sessionId: string, direction: 'up' | 'down') => void;
  onChangeColor?: (sessionId: string, color: string) => void;
}

export function RunsList({
  sessions,
  visits,
  sessionColorMap,
  selectedRunId,
  onSelectRun,
  onReorder,
}: RunsListProps) {
  // Count visits per session
  const visitCounts = new Map<string, number>();
  for (const v of visits) {
    visitCounts.set(v.session_id, (visitCounts.get(v.session_id) ?? 0) + 1);
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <p className="text-zinc-500 text-sm text-center p-4">No runs yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sessions.map((session, index) => {
        const count = visitCounts.get(session.id) ?? 0;
        const color = sessionColorMap.get(session.id) ?? '#3B82F6';
        const isSelected = session.id === selectedRunId;
        const isFirst = index === 0;
        const isLast = index === sessions.length - 1;

        return (
          <div
            key={session.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRun(isSelected ? null : session.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectRun(isSelected ? null : session.id);
            }}
            className={`w-full text-left p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer ${
              isSelected ? 'bg-zinc-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-white truncate flex-1">
                {session.label || format(new Date(session.started_at), 'MMM d, yyyy')}
              </span>
              {/* Reorder controls (only show when selected) */}
              {isSelected && onReorder && (
                <div
                  className="flex flex-col shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onReorder(session.id, 'up')}
                    disabled={isFirst}
                    className="p-0.5 text-zinc-400 hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onReorder(session.id, 'down')}
                    disabled={isLast}
                    className="p-0.5 text-zinc-400 hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
              {!session.started ? (
                <span className="text-[10px] text-zinc-400 bg-zinc-700 rounded px-1.5 py-0.5">
                  Planned
                </span>
              ) : session.ended_at ? (
                <span className="text-[10px] text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">
                  Ended
                </span>
              ) : (
                <span className="text-[10px] text-green-400 bg-green-400/10 rounded px-1.5 py-0.5">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 ml-[18px] text-xs text-zinc-500">
              {!session.started ? (
                <span>
                  {count} door{count !== 1 ? 's' : ''} |{' '}
                  {(() => {
                    const estMinutes = count * 4;
                    const estHours = Math.floor(estMinutes / 60);
                    const estMins = estMinutes % 60;
                    return estHours > 0 ? `~${estHours}h ${estMins}m est.` : `~${estMins}m est.`;
                  })()}
                </span>
              ) : (
                <>
                  <span>
                    {format(new Date(session.started_at), 'MMM d, h:mm a')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {count} knock{count !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
