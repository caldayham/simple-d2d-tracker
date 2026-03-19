'use client';

import { useState } from 'react';
import type { Session, Visit } from '@/lib/types';
import { format } from 'date-fns';
import {
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Check,
  X,
} from 'lucide-react';

interface RunDetailProps {
  session: Session;
  visits: Visit[];
  sessionColor: string;
  onViewKnocks: (sessionId: string) => void;
  onEdit: (sessionId: string, data: { label: string; notes: string }) => void;
  onDelete: (sessionId: string) => void;
  onEndRun?: (sessionId: string) => void;
}

export function RunDetail({
  session,
  visits,
  sessionColor,
  onViewKnocks,
  onEdit,
  onDelete,
  onEndRun,
}: RunDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(session.label ?? '');
  const [notes, setNotes] = useState(session.notes ?? '');

  const knockCount = visits.filter(
    (v) => v.session_id === session.id
  ).length;

  // Compute duration
  const start = new Date(session.started_at);
  const end = session.ended_at ? new Date(session.ended_at) : new Date();
  const durationMins = Math.round(
    (end.getTime() - start.getTime()) / 60000
  );
  const durationStr =
    durationMins >= 60
      ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
      : `${durationMins}m`;

  function handleSave() {
    onEdit(session.id, { label, notes });
    setIsEditing(false);
  }

  return (
    <div className="border-t border-zinc-800 p-4 space-y-3 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: sessionColor }}
        />
        {isEditing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h3 className="text-white font-medium text-sm truncate flex-1">
            {session.label ||
              format(new Date(session.started_at), 'MMM d, yyyy')}
          </h3>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-green-400 hover:bg-zinc-800 rounded transition-colors"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLabel(session.label ?? '');
                  setNotes(session.notes ?? '');
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Edit run"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete this run and all ${knockCount} knock${knockCount !== 1 ? 's' : ''}?`
                    )
                  )
                    onDelete(session.id);
                }}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Delete run"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      {!session.started ? (
        <div className="space-y-1.5 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 bg-zinc-700 rounded px-1.5 py-0.5 font-medium">
              Planned Route
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span>{knockCount} door{knockCount !== 1 ? 's' : ''} planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>
              {(() => {
                const estMinutes = knockCount * 4;
                const estHours = Math.floor(estMinutes / 60);
                const estMins = estMinutes % 60;
                return estHours > 0
                  ? `~${estHours}h ${estMins}m estimated (4 min/door)`
                  : `~${estMins}m estimated (4 min/door)`;
              })()}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>
              {format(start, 'EEEE, MMM d, yyyy h:mm a')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Duration:</span>
            <span>
              {durationStr}
              {!session.ended_at && ' (ongoing)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span>
              {knockCount} knock{knockCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Notes (editing mode) */}
      {isEditing && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Run notes..."
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      )}

      {/* Notes (display mode) */}
      {!isEditing && session.notes && (
        <div className="flex items-start gap-1.5 text-xs">
          <FileText size={12} className="mt-0.5 shrink-0 text-zinc-400" />
          <span className="text-zinc-300">{session.notes}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {session.started && !session.ended_at && onEndRun && (
          <button
            onClick={() => onEndRun(session.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-600 transition-colors"
          >
            <Check size={14} />
            End Run
          </button>
        )}
        <button
          onClick={() => onViewKnocks(session.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Eye size={14} />
          View Knocks
        </button>
      </div>
    </div>
  );
}
