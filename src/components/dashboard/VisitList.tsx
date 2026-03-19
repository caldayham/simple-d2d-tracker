'use client';

import { useRef } from 'react';
import type { Visit, ResultTag } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, Mic } from 'lucide-react';

interface VisitListProps {
  visits: Visit[];
  sessionColorMap: Map<string, string>;
  selectedVisitId: string | null;
  onSelectVisit: (id: string) => void;
  resultTags?: ResultTag[];
}

export function VisitList({
  visits,
  sessionColorMap,
  selectedVisitId,
  onSelectVisit,
  resultTags = [],
}: VisitListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tagColorMap = new Map(resultTags.map((t) => [t.name.toLowerCase(), t.color]));

  // Parse result string into colored segments, matching against known tag names
  const parseResult = (result: string): { text: string; color?: string }[] => {
    // Try full string match first
    const fullColor = tagColorMap.get(result.toLowerCase());
    if (fullColor) return [{ text: result, color: fullColor }];

    // Try splitting by ", " and matching each part
    const parts = result.split(', ');
    if (parts.length > 1) {
      const matched = parts.map((p) => ({
        text: p,
        color: tagColorMap.get(p.toLowerCase()),
      }));
      // Only use split if at least one part matches a known tag
      if (matched.some((m) => m.color)) return matched;
    }

    // No match — return as single uncolored badge
    return [{ text: result }];
  };

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
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
            {visit.manually_added && (
              <span className="text-[9px] text-amber-400/70 shrink-0">
                Manual
              </span>
            )}
            {visit.audio_path && (
              <Mic size={14} className="text-zinc-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 ml-[18px]">
            <Clock size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">
              {visit.recorded_at ? format(new Date(visit.recorded_at), 'MMM d, h:mm a') : 'Planned'}
            </span>
            {visit.result && (
              <div className="flex gap-1 ml-auto flex-wrap justify-end">
                {parseResult(visit.result).map((tag) => (
                  <span
                    key={tag.text}
                    className={`text-xs rounded px-1.5 py-0.5 ${!tag.color ? 'text-zinc-400 bg-zinc-800' : ''}`}
                    style={tag.color ? {
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    } : undefined}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
