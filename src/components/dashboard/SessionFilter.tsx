'use client';

import type { Session } from '@/lib/types';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';

interface SessionFilterProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export function SessionFilter({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionFilterProps) {
  return (
    <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
      <Filter size={16} className="text-zinc-400 shrink-0" />
      <select
        className="flex-1 bg-zinc-800 text-white text-sm rounded px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-blue-500"
        value={selectedSessionId ?? ''}
        onChange={(e) => onSelectSession(e.target.value || null)}
      >
        <option value="">All Sessions</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.label ||
              format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}
          </option>
        ))}
      </select>
    </div>
  );
}
