'use client';

import { useEffect, useState } from 'react';
import { createSignedDownloadUrl } from '@/actions/storage';
import { AlertCircle, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

interface AudioPlayerProps {
  audioPath: string;
  mimeType: string | null;
}

export function AudioPlayer({ audioPath, mimeType }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAudioUrl(null);
    setError(null);
    setLoading(false);
  }, [audioPath]);

  async function handlePlay() {
    if (audioUrl) return;
    setLoading(true);
    setError(null);
    try {
      const url = await createSignedDownloadUrl(audioPath);
      setAudioUrl(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load audio';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertCircle size={14} />
        <span>Failed to load audio</span>
        <button onClick={handlePlay} className="underline">
          Retry
        </button>
      </div>
    );
  }

  if (audioUrl) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio
        controls
        src={audioUrl}
        className="w-full h-8"
        autoPlay
        {...(mimeType ? { type: mimeType } : {})}
      />
    );
  }

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Play size={14} />
      )}
      {loading ? 'Loading...' : 'Load audio'}
    </button>
  );
}
