'use client';

import { MapPin } from 'lucide-react';

interface GpsStatusProps {
  accuracy: number | null;
  isWatching: boolean;
  isAccurate: boolean;
}

export default function GpsStatus({
  accuracy,
  isWatching,
  isAccurate,
}: GpsStatusProps) {
  if (!isWatching) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
        <MapPin className="w-4 h-4" />
        <span>GPS Off</span>
      </div>
    );
  }

  if (isAccurate) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <MapPin className="w-4 h-4" />
        <span>GPS: {Math.round(accuracy!)}m</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
      </span>
      <MapPin className="w-4 h-4" />
      <span>GPS: {accuracy !== null ? `${Math.round(accuracy)}m` : 'Searching...'}</span>
    </div>
  );
}
