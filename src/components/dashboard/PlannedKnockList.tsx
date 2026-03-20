'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, GripVertical, X } from 'lucide-react';
import type { Visit } from '@/lib/types';
import type { PlannedKnock } from './DrawingMap';

interface PlannedKnockListProps {
  // Unsaved mode (Plan tab)
  knocks?: PlannedKnock[];
  onClear?: () => void;
  onReorder?: (knocks: PlannedKnock[]) => void;
  selectedKnockId?: string | null;
  onSelectKnock?: (id: string) => void;
  onDeleteKnock?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  // Saved mode (viewing planned route)
  visits?: Visit[];
  onReorderKnocks?: (orderedIds: string[]) => void;
}

export function PlannedKnockList({
  knocks,
  onClear,
  onReorder,
  selectedKnockId,
  onSelectKnock,
  onDeleteKnock,
  onUpdateNotes,
  visits,
  onReorderKnocks,
}: PlannedKnockListProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll selected knock into view (e.g. when selected from map)
  useEffect(() => {
    if (selectedKnockId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedKnockId]);

  const items = visits
    ? visits.map((v) => ({
        id: v.id,
        address: v.address ?? `${v.latitude.toFixed(5)}, ${v.longitude.toFixed(5)}`,
        latitude: v.latitude,
        longitude: v.longitude,
      }))
    : (knocks ?? []).map((k) => ({
        id: k.id,
        address: k.address,
        latitude: k.latitude,
        longitude: k.longitude,
        notes: k.notes,
      }));

  const itemCount = items.length;

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(dropIndex: number) {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }

    if (visits && onReorderKnocks) {
      const newVisits = [...visits];
      const [moved] = newVisits.splice(dragIndex, 1);
      newVisits.splice(dropIndex, 0, moved);
      onReorderKnocks(newVisits.map((v) => v.id));
    } else if (knocks && onReorder) {
      const newKnocks = [...knocks];
      const [moved] = newKnocks.splice(dragIndex, 1);
      newKnocks.splice(dropIndex, 0, moved);
      onReorder(newKnocks);
    }

    setDragOverIndex(null);
    dragIndexRef.current = null;
  }

  function handleDragEnd() {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-sm text-zinc-300 font-medium">
          {itemCount} planned knock{itemCount !== 1 ? 's' : ''}
        </span>
        {itemCount > 0 && onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>

      {/* Knock list */}
      <div className="flex-1 overflow-y-auto">
        {itemCount === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            Draw an area on the map to find houses
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {items.map((item, index) => {
              const isSelected = !visits && item.id === selectedKnockId;

              return (
                <div key={item.id} ref={isSelected ? selectedRef : undefined}>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (!visits && onSelectKnock) {
                        onSelectKnock(item.id);
                      }
                    }}
                    className={`flex items-start gap-2 px-4 py-2.5 transition-colors cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'bg-zinc-800'
                        : 'hover:bg-zinc-800/30'
                    } ${
                      dragOverIndex === index ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent'
                    }`}
                  >
                    <div className="mt-0.5 text-zinc-600 hover:text-zinc-400 transition-colors">
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">
                        {item.address}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">
                        {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!visits && onDeleteKnock && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteKnock(item.id);
                          }}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                          title="Remove knock"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <span className="text-[11px] text-zinc-500 font-mono">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail when selected */}
                  {isSelected && (
                    <div className="px-4 py-3 bg-zinc-800/50 border-t border-zinc-700/50 space-y-2">
                      <textarea
                        value={knocks?.find((k) => k.id === item.id)?.notes ?? ''}
                        onChange={(e) => onUpdateNotes?.(item.id, e.target.value)}
                        placeholder="Add notes..."
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-900 text-white text-sm rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
