'use client';

import type { Visit } from '@/lib/types';

interface VisitDetailProps {
  visit: Visit | null;
  sessionColor: string;
}

export function VisitDetail({ visit }: VisitDetailProps) {
  if (!visit) return null;

  return (
    <div className="p-4 border-t border-zinc-800 text-zinc-500">
      Detail placeholder
    </div>
  );
}
