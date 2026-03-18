'use client';

import { useState } from 'react';
import { VISIT_RESULTS } from '@/lib/types';

const RESULT_COLORS: Record<string, string> = {
  'Interested': 'bg-green-600 hover:bg-green-700',
  'Not Interested': 'bg-zinc-500 hover:bg-zinc-600',
  'Not Home': 'bg-yellow-600 hover:bg-yellow-700',
  'Booked Consult': 'bg-blue-600 hover:bg-blue-700',
  'Come Back Later': 'bg-orange-500 hover:bg-orange-600',
};

interface ResultPickerProps {
  onSelect: (result: string, notes?: string) => void;
  isSubmitting: boolean;
}

export default function ResultPicker({ onSelect, isSubmitting }: ResultPickerProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="rounded-xl bg-black/70 backdrop-blur-md p-4 w-full max-w-sm">
      <p className="text-white text-sm font-medium text-center mb-3">
        How did it go?
      </p>
      <div className="flex flex-col gap-2">
        {VISIT_RESULTS.map((result) => (
          <button
            key={result}
            onClick={() => onSelect(result, notes || undefined)}
            disabled={isSubmitting}
            className={`
              w-full py-3 px-4 rounded-lg text-white font-medium text-sm
              transition-all active:scale-95 min-h-[48px]
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : RESULT_COLORS[result] || 'bg-zinc-600'}
            `}
          >
            {result}
          </button>
        ))}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes (optional)..."
        rows={2}
        className="mt-3 w-full rounded-lg bg-white/10 border border-white/20 text-white text-sm px-3 py-2 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 resize-none"
      />
    </div>
  );
}
