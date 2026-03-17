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
      <div className="flex items-center justify-between gap-4 rounded-xl bg-black/50 backdrop-blur-sm px-4 py-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-sm font-medium text-green-400">
              Session Active
            </p>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Started{' '}
            {formatDistanceToNow(new Date(activeSession.started_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <button
          onClick={onEnd}
          disabled={isLoading}
          className="rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
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
      className="w-full rounded-xl bg-green-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] shadow-lg"
    >
      {isLoading ? 'Starting...' : 'Start Canvassing'}
    </button>
  );
}
