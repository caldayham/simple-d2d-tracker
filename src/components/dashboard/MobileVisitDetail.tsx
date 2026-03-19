'use client';

import type { Visit } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, MapPin, Tag, X, FileText, Pencil, Trash2, User } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface MobileVisitDetailProps {
  visit: Visit;
  sessionColor: string;
  onClose: () => void;
  onEdit?: (visit: Visit) => void;
  onDelete?: (visitId: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function MobileVisitDetail({
  visit,
  sessionColor,
  onClose,
  onEdit,
  onDelete,
}: MobileVisitDetailProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up pb-[env(safe-area-inset-bottom)]">
        {/* Handle + close */}
        <div className="sticky top-0 bg-zinc-900 pt-3 pb-2 px-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{ backgroundColor: sessionColor }}
            />
            <h3 className="text-white font-medium text-base truncate">
              {visit.address || 'Unknown address'}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(visit)}
                className="text-zinc-400 hover:text-white p-1.5"
                title="Edit visit"
              >
                <Pencil size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this visit?')) onDelete(visit.id);
                }}
                className="text-zinc-400 hover:text-red-400 p-1.5"
                title="Delete visit"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Metadata */}
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>
                {visit.latitude.toFixed(5)}, {visit.longitude.toFixed(5)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
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
              <div className="flex items-center gap-2">
                <Tag size={14} />
                <span className="text-white bg-zinc-800 rounded px-2 py-0.5 text-xs">
                  {visit.result}
                </span>
              </div>
            )}
            {(visit.contact_name || visit.gender || visit.age_range || visit.occupancy) && (
              <div className="flex items-center gap-2">
                <User size={14} />
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
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Duration:</span>
                <span>{formatDuration(visit.audio_duration_seconds)}</span>
              </div>
            )}
            {visit.notes && (
              <div className="flex items-start gap-2">
                <FileText size={14} className="mt-0.5 shrink-0" />
                <span className="text-zinc-300">{visit.notes}</span>
              </div>
            )}
          </div>

          {/* Audio */}
          {visit.audio_path ? (
            <AudioPlayer
              audioPath={visit.audio_path}
              mimeType={visit.audio_mime_type}
            />
          ) : (
            <p className="text-zinc-500 text-sm">No audio recorded</p>
          )}
        </div>
      </div>
    </>
  );
}
