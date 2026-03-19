'use client';

import { useRef, useState } from 'react';
import { MapPin, Trash2, GripVertical } from 'lucide-react';
import type { Visit } from '@/lib/types';

interface PlannedKnock {
  latitude: number;
  longitude: number;
  address: string;
}

interface PlannedKnockListProps {
  // Unsaved mode (Plan tab)
  knocks?: PlannedKnock[];
  onClear?: () => void;
  onReorder?: (knocks: PlannedKnock[]) => void;
  // Saved mode (viewing planned route)
  visits?: Visit[];
  onReorderKnocks?: (orderedIds: string[]) => void;
}

export function PlannedKnockList({
  knocks,
  onClear,
  onReorder,
  visits,
  onReorderKnocks,
}: PlannedKnockListProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Determine which mode we're in
  const items = visits
    ? visits.map((v) => ({
        id: v.id,
        address: v.address ?? `${v.latitude.toFixed(5)}, ${v.longitude.toFixed(5)}`,
        latitude: v.latitude,
        longitude: v.longitude,
      }))
    : (knocks ?? []).map((k, i) => ({
        id: String(i),
        address: k.address,
        latitude: k.latitude,
        longitude: k.longitude,
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
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-start gap-2 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors cursor-grab active:cursor-grabbing ${
                  dragIndexRef.current === index ? 'opacity-50' : ''
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
                <div className="text-[11px] text-zinc-500 shrink-0 font-mono">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
