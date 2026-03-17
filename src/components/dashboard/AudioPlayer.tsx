'use client';

interface AudioPlayerProps {
  audioPath: string;
  mimeType: string | null;
}

export function AudioPlayer({}: AudioPlayerProps) {
  return (
    <div className="text-zinc-500">Audio player placeholder</div>
  );
}
