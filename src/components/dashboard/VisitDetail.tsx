'use client';

import type { Visit } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, MapPin, Tag } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface VisitDetailProps {
  visit: Visit | null;
  sessionColor: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function VisitDetail({ visit, sessionColor }: VisitDetailProps) {
  if (!visit) return null;

  return (
    <div className="border-t border-zinc-800 p-4 space-y-3 shrink-0">
      <div className="flex items-center gap-2">
        <span
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: sessionColor }}
        />
        <h3 className="text-white font-medium text-sm truncate">
          {visit.address || 'Unknown address'}
        </h3>
      </div>

      <div className="space-y-1.5 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} />
          <span>
            {visit.latitude.toFixed(5)}, {visit.longitude.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>
            {format(
              new Date(visit.recorded_at),
              'EEEE, MMM d, yyyy h:mm a'
            )}
          </span>
        </div>
        {visit.result && (
          <div className="flex items-center gap-1.5">
            <Tag size={12} />
            <span>{visit.result}</span>
          </div>
        )}
        {visit.audio_duration_seconds != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Duration:</span>
            <span>{formatDuration(visit.audio_duration_seconds)}</span>
          </div>
        )}
      </div>

      {visit.audio_path ? (
        <AudioPlayer
          audioPath={visit.audio_path}
          mimeType={visit.audio_mime_type}
        />
      ) : (
        <p className="text-zinc-500 text-xs">No audio recorded</p>
      )}
    </div>
  );
}
