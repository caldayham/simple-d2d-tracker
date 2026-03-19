'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ResultTag } from '@/lib/types';

export type Demographics = {
  contact_name?: string;
  gender?: string;
  age_range?: string;
  occupancy?: string;
};

interface ResultPickerProps {
  tags: ResultTag[];
  onSelect: (result: string, notes?: string, demographics?: Demographics) => void;
  isSubmitting: boolean;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'] as const;
const AGE_RANGE_OPTIONS = ['<30', '30-50', '50-70', '>70'] as const;
const OCCUPANCY_OPTIONS = ['Homeowner', 'Renter', 'Unknown'] as const;

export default function ResultPicker({ tags, onSelect, isSubmitting }: ResultPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [occupancy, setOccupancy] = useState<string | null>(null);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    const ordered = tags.filter((t) => selected.has(t.name)).map((t) => t.name);
    const demographics: Demographics = {};
    if (contactName.trim()) demographics.contact_name = contactName.trim();
    if (gender) demographics.gender = gender;
    if (ageRange) demographics.age_range = ageRange;
    if (occupancy) demographics.occupancy = occupancy;
    const hasDemographics = Object.keys(demographics).length > 0;
    onSelect(ordered.join(', '), notes || undefined, hasDemographics ? demographics : undefined);
  };

  return (
    <div className="rounded-xl bg-black/70 backdrop-blur-md p-4 w-full max-w-sm">
      <p className="text-white text-sm font-medium text-center mb-3">
        How did it go?
      </p>
      <div className="flex flex-col gap-2">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => toggle(tag.name)}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSelected ? tag.color : undefined,
                borderColor: tag.color,
              }}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-sm
                transition-all active:scale-95 min-h-[48px]
                flex items-center justify-between
                border-2
                ${isSelected ? 'text-white' : 'text-zinc-300 bg-white/5'}
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {tag.name}
              {isSelected && <Check size={18} />}
            </button>
          );
        })}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes (optional)..."
        rows={2}
        className="mt-3 w-full rounded-lg bg-white/10 border border-white/20 text-white text-sm px-3 py-2 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 resize-none"
      />

      {/* Demographics */}
      <div className="mt-3 space-y-3">
        {/* Name */}
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Name (optional)"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white text-sm px-3 py-2 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
        />

        {/* Gender */}
        <div>
          <p className="text-white/50 text-xs mb-1.5">Gender</p>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(gender === g ? null : g)}
                className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                  gender === g
                    ? 'bg-white text-black'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div>
          <p className="text-white/50 text-xs mb-1.5">Age Range</p>
          <div className="flex gap-2">
            {AGE_RANGE_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAgeRange(ageRange === a ? null : a)}
                className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                  ageRange === a
                    ? 'bg-white text-black'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Occupancy */}
        <div>
          <p className="text-white/50 text-xs mb-1.5">Occupancy</p>
          <div className="flex gap-2">
            {OCCUPANCY_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOccupancy(occupancy === o ? null : o)}
                className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                  occupancy === o
                    ? 'bg-white text-black'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isSubmitting || selected.size === 0}
        className={`mt-3 w-full py-3 rounded-lg font-medium text-sm transition-all ${
          selected.size > 0
            ? 'bg-white text-black hover:bg-zinc-200 active:scale-95'
            : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
        } ${isSubmitting ? 'opacity-50' : ''}`}
      >
        {isSubmitting ? 'Saving...' : selected.size === 0 ? 'Select at least one' : `Done (${selected.size})`}
      </button>
    </div>
  );
}
