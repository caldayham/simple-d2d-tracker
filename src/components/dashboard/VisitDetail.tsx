'use client';

import type { Visit } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, MapPin, Tag, Pencil, Trash2, FileText, User } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface VisitDetailProps {
  visit: Visit | null;
  sessionColor: string;
  onEdit?: (visit: Visit) => void;
  onDelete?: (visitId: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function VisitDetail({ visit, sessionColor, onEdit, onDelete }: VisitDetailProps) {
  if (!visit) return null;

  return (
    <div className="border-t border-zinc-800 p-4 space-y-3 shrink-0">
      <div className="flex items-center gap-2">
        <span
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: sessionColor }}
        />
        <h3 className="text-white font-medium text-sm truncate flex-1">
          {visit.address || 'Unknown address'}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(visit)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Edit visit"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this visit?')) onDelete(visit.id);
              }}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
              title="Delete visit"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
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
          {visit.manually_added && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 rounded px-1.5 py-0.5 ml-1">
              Manual
            </span>
          )}
        </div>
        {visit.result && (
          <div className="flex items-center gap-1.5">
            <Tag size={12} />
            <span>{visit.result}</span>
          </div>
        )}
        {(visit.contact_name || visit.gender || visit.age_range || visit.occupancy) && (
          <div className="flex items-center gap-1.5">
            <User size={12} />
            <span>
              {[
                visit.contact_name,
                [visit.gender, visit.age_range, visit.occupancy].filter(Boolean).join(', '),
              ]
                .filter(Boolean)
                .join(' - ')}
            </span>
          </div>
        )}
        {visit.audio_duration_seconds != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Duration:</span>
            <span>{formatDuration(visit.audio_duration_seconds)}</span>
          </div>
        )}
        {visit.notes && (
          <div className="flex items-start gap-1.5">
            <FileText size={12} className="mt-0.5 shrink-0" />
            <span className="text-zinc-300">{visit.notes}</span>
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
