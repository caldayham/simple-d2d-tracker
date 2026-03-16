'use client';

import { Mic, MicOff } from 'lucide-react';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface RecordButtonProps {
  isRecording: boolean;
  duration: number;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function RecordButton({
  isRecording,
  duration,
  disabled,
  onStart,
  onStop,
}: RecordButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={disabled && !isRecording}
        className={`
          flex items-center justify-center rounded-full transition-all
          w-24 h-24 min-w-[80px] min-h-[80px]
          ${
            isRecording
              ? 'bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
              : disabled
                ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>

      {isRecording ? (
        <span className="text-lg font-mono font-semibold text-red-600 dark:text-red-400">
          {formatDuration(duration)}
        </span>
      ) : (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {disabled ? 'Start session & wait for GPS' : 'Tap to Record'}
        </span>
      )}
    </div>
  );
}
