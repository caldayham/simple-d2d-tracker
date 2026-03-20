'use client';

import { useMemo } from 'react';
import type { Visit, ResultTag } from '@/lib/types';

interface AnalyticsPanelProps {
  visits: Visit[];
  resultTags: ResultTag[];
}

export function AnalyticsPanel({ visits, resultTags }: AnalyticsPanelProps) {
  const { bars, total } = useMemo(() => {
    const counts = new Map<string, number>();

    for (const visit of visits) {
      const key = visit.result ?? 'No Result';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const entries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);

    const maxCount = entries.length > 0 ? entries[0][1] : 0;

    const tagColorMap = new Map<string, string>();
    for (const tag of resultTags) {
      tagColorMap.set(tag.name, tag.color);
    }

    const barData = entries.map(([name, count]) => ({
      name,
      count,
      percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
      color: tagColorMap.get(name) ?? '#6b7280',
    }));

    return { bars: barData, total: visits.length };
  }, [visits, resultTags]);

  if (visits.length === 0) {
    return (
      <div className="h-full bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">No knock data for selected runs</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-900 overflow-y-auto p-4">
      <h3 className="text-white text-sm font-medium mb-4">
        Total Knocks: {total}
      </h3>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-300 text-xs font-medium">{bar.name}</span>
              <span className="text-zinc-400 text-xs tabular-nums">{bar.count}</span>
            </div>
            <div className="h-5 bg-zinc-800 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 ease-out"
                style={{
                  width: `${bar.percentage}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
