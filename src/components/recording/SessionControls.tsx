'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Session } from '@/lib/types';

interface SessionControlsProps {
  activeSession: Session | null;
  isLoading: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export default function SessionControls({
  activeSession,
  isLoading,
  onStart,
  onEnd,
}: SessionControlsProps) {
  if (activeSession) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Session Active
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Started{' '}
            {formatDistanceToNow(new Date(activeSession.started_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <button
          onClick={onEnd}
          disabled={isLoading}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isLoading ? 'Ending...' : 'End Session'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={isLoading}
      className="w-full rounded-lg bg-green-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
    >
      {isLoading ? 'Starting...' : 'Start Canvassing'}
    </button>
  );
}
