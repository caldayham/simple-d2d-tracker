'use client';

import { useState, useTransition } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveResultTags } from '@/actions/settings';
import type { ResultTag } from '@/lib/types';

const PRESET_COLORS = [
  '#16a34a', '#2563eb', '#ca8a04', '#f97316', '#ef4444',
  '#8b5cf6', '#ec4899', '#71717a', '#06b6d4', '#84cc16',
];

interface ResultTagsEditorProps {
  initialTags: ResultTag[];
}

export function ResultTagsEditor({ initialTags }: ResultTagsEditorProps) {
  const [tags, setTags] = useState<ResultTag[]>(initialTags);
  const [savedTags, setSavedTags] = useState<ResultTag[]>(initialTags);
  const [isPending, startTransition] = useTransition();

  const hasChanges = JSON.stringify(tags) !== JSON.stringify(savedTags);

  const handleSave = () => {
    const filtered = tags.filter((t) => t.name.trim());
    if (filtered.length === 0) {
      toast.error('Add at least one tag');
      return;
    }
    startTransition(async () => {
      try {
        await saveResultTags(filtered);
        setSavedTags(filtered);
        setTags(filtered);
        toast.success('Settings saved');
      } catch {
        toast.error('Failed to save');
      }
    });
  };

  const handleDiscard = () => {
    setTags(savedTags);
  };

  const updateTag = (index: number, field: keyof ResultTag, value: string) => {
    setTags((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const moveTag = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tags.length) return;
    setTags((prev) => {
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  const addTag = () => {
    const usedColors = new Set(tags.map((t) => t.color));
    const nextColor = PRESET_COLORS.find((c) => !usedColors.has(c)) ?? PRESET_COLORS[0];
    setTags((prev) => [...prev, { name: '', color: nextColor }]);
  };

  return (
    <div className="space-y-3">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5"
        >
          {/* Color picker */}
          <label className="shrink-0 cursor-pointer">
            <input
              type="color"
              value={tag.color}
              onChange={(e) => updateTag(index, 'color', e.target.value)}
              className="sr-only"
            />
            <span
              className="block w-8 h-8 rounded-md border-2 border-zinc-700"
              style={{ backgroundColor: tag.color }}
            />
          </label>

          {/* Name input */}
          <input
            type="text"
            value={tag.name}
            onChange={(e) => updateTag(index, 'name', e.target.value)}
            placeholder="Tag name..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600 min-w-0"
          />

          {/* Reorder */}
          <div className="flex flex-col shrink-0">
            <button
              onClick={() => moveTag(index, -1)}
              disabled={index === 0}
              className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => moveTag(index, 1)}
              disabled={index === tags.length - 1}
              className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5"
            >
              <ArrowDown size={14} />
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={() => removeTag(index)}
            className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* Add tag */}
      <button
        onClick={addTag}
        className="flex items-center gap-2 w-full rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 px-3 py-2.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
      >
        <Plus size={16} />
        Add tag
      </button>

      {/* Save / Discard */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className={`flex-1 rounded-lg font-medium py-2.5 text-sm transition-colors ${
            hasChanges
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {isPending ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
        </button>
        {hasChanges && (
          <button
            onClick={handleDiscard}
            disabled={isPending}
            className="rounded-lg bg-zinc-800 text-zinc-300 px-4 py-2.5 text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
