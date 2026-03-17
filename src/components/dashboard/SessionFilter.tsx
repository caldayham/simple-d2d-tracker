'use client';

import type { Session } from '@/lib/types';

interface SessionFilterProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export function SessionFilter({}: SessionFilterProps) {
  return (
    <div className="p-2 border-b border-zinc-800 text-zinc-500">
      Filter placeholder
    </div>
  );
}
