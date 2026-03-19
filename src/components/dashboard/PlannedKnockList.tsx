'use client';

import { MapPin, Trash2 } from 'lucide-react';

interface PlannedKnock {
  latitude: number;
  longitude: number;
  address: string;
}

interface PlannedKnockListProps {
  knocks: PlannedKnock[];
  onClear: () => void;
}

export function PlannedKnockList({ knocks, onClear }: PlannedKnockListProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-sm text-zinc-300 font-medium">
          {knocks.length} planned knock{knocks.length !== 1 ? 's' : ''}
        </span>
        {knocks.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>

      {/* Knock list */}
      <div className="flex-1 overflow-y-auto">
        {knocks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            Draw an area on the map to find houses
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {knocks.map((knock, index) => (
              <div
                key={`${knock.latitude}-${knock.longitude}-${index}`}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="mt-0.5">
                  <div className="w-3 h-3 rounded-sm bg-zinc-500/50 border border-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">
                    {knock.address}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {knock.latitude.toFixed(5)}, {knock.longitude.toFixed(5)}
                  </p>
                </div>
                <div className="text-[11px] text-zinc-600 shrink-0">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
