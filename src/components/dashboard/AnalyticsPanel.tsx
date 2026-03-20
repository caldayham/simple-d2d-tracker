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

    // Always show all result tags in fixed order, plus "No Result" at the end
    const maxCount = Math.max(0, ...counts.values());

    const barData = [
      ...resultTags.map((tag) => ({
        name: tag.name,
        count: counts.get(tag.name) ?? 0,
        percentage: maxCount > 0 ? ((counts.get(tag.name) ?? 0) / maxCount) * 100 : 0,
        color: tag.color,
      })),
      {
        name: 'No Result',
        count: counts.get('No Result') ?? 0,
        percentage: maxCount > 0 ? ((counts.get('No Result') ?? 0) / maxCount) * 100 : 0,
        color: '#6b7280',
      },
    ];

    return { bars: barData, total: visits.length };
  }, [visits, resultTags]);

  return (
    <div className="h-full bg-zinc-950 overflow-y-auto p-4 pr-8">
      {/* Knock Results card */}
      <div className="bg-zinc-800/60 rounded-lg p-4">
        <h3 className="text-white text-sm font-medium mb-4">
          Knock Results {total > 0 && <span className="text-zinc-400">({total} total)</span>}
        </h3>
        <div className="space-y-3">
          {bars.map((bar) => (
            <div key={bar.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-300 text-xs font-medium">{bar.name}</span>
                <span className="text-zinc-400 text-xs tabular-nums">{bar.count}</span>
              </div>
              <div className="h-5 bg-zinc-900 rounded overflow-hidden">
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
    </div>
  );
}
