'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createSession, endSession } from '@/actions/sessions';
import { createSignedUploadUrl } from '@/actions/storage';
import { createVisit, resolveAndUpdateAddress } from '@/actions/visits';
import { createClient } from '@/lib/supabase/client';
import { getFileExtension } from '@/lib/audio';
import type { Session } from '@/lib/types';
import RecordButton from '@/components/recording/RecordButton';
import SessionControls from '@/components/recording/SessionControls';
import GpsStatus from '@/components/recording/GpsStatus';
import AddressDisplay from '@/components/recording/AddressDisplay';
import UploadStatus from '@/components/recording/UploadStatus';

type SessionVisit = {
  address: string | null;
  duration: number;
  recordedAt: string;
};

export default function RecordPage() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [lastUploadStatus, setLastUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [sessionVisits, setSessionVisits] = useState<SessionVisit[]>([]);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useAudioRecorder();

  const {
    position,
    accuracy,
    isWatching,
    isAccurate,
    error: geoError,
    startWatching,
    stopWatching,
  } = useGeolocation();

  // Show errors as toasts
  if (recorderError) {
    toast.error(recorderError);
  }
  if (geoError) {
    toast.error(geoError);
  }

  const handleStartSession = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const session = await createSession();
      setActiveSession(session);
      startWatching();
      setSessionVisits([]);
      setLastAddress(null);
      setLastUploadStatus('idle');
    } catch (err) {
      toast.error('Failed to start session');
      console.error(err);
    } finally {
      setIsSessionLoading(false);
    }
  }, [startWatching]);

  const handleEndSession = useCallback(async () => {
    if (!activeSession || isRecording) return;
    setIsSessionLoading(true);
    try {
      await endSession(activeSession.id);
      stopWatching();
      setActiveSession(null);
      setSessionVisits([]);
      setLastAddress(null);
      setLastUploadStatus('idle');
      setPendingUploads(0);
    } catch (err) {
      toast.error('Failed to end session');
      console.error(err);
    } finally {
      setIsSessionLoading(false);
    }
  }, [activeSession, isRecording, stopWatching]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch {
      // Error already set in hook
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    if (!activeSession || !position) return;

    try {
      const result = await stopRecording();

      // Capture current position
      const { latitude, longitude } = position;

      setLastUploadStatus('uploading');
      setPendingUploads((p) => p + 1);

      // Generate file path
      const ext = getFileExtension(result.mimeType);
      const filePath = `recordings/${activeSession.id}/${Date.now()}.${ext}`;

      // Get signed URL
      const { path, token } = await createSignedUploadUrl(filePath);

      // Upload directly to Supabase Storage
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .uploadToSignedUrl(path, token, result.blob, {
          contentType: result.mimeType,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create visit record
      const visit = await createVisit({
        session_id: activeSession.id,
        latitude,
        longitude,
        audio_path: filePath,
        audio_mime_type: result.mimeType,
        audio_duration_seconds: result.durationSeconds,
      });

      setLastUploadStatus('success');
      setPendingUploads((p) => Math.max(0, p - 1));

      // Add to session visits
      const newVisit: SessionVisit = {
        address: null,
        duration: result.durationSeconds,
        recordedAt: new Date().toISOString(),
      };
      setSessionVisits((prev) => [newVisit, ...prev]);

      // Fire-and-forget: resolve address
      setIsResolving(true);
      resolveAndUpdateAddress(visit.id, latitude, longitude)
        .then((address) => {
          setLastAddress(address);
          setIsResolving(false);
          // Update the visit in the list
          setSessionVisits((prev) =>
            prev.map((v, i) =>
              i === 0 ? { ...v, address: address || 'Address unavailable' } : v
            )
          );
        })
        .catch(() => {
          setIsResolving(false);
          setSessionVisits((prev) =>
            prev.map((v, i) =>
              i === 0 ? { ...v, address: 'Address unavailable' } : v
            )
          );
        });
    } catch (err) {
      setLastUploadStatus('error');
      setPendingUploads((p) => Math.max(0, p - 1));
      toast.error(err instanceof Error ? err.message : 'Recording failed');
      console.error(err);
    }
  }, [activeSession, position, stopRecording]);

  const recordDisabled = !activeSession || !isAccurate || lastUploadStatus === 'uploading';

  return (
    <div className="flex min-h-screen flex-col px-4 pt-safe pb-safe">
      {/* Header */}
      <div className="pt-4 pb-2">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-center">
          Canvassing Companion
        </h1>
      </div>

      {/* Session Controls */}
      <div className="py-3">
        <SessionControls
          activeSession={activeSession}
          isLoading={isSessionLoading}
          onStart={handleStartSession}
          onEnd={handleEndSession}
        />
      </div>

      {/* GPS Status */}
      <div className="flex justify-center py-2">
        <GpsStatus
          accuracy={accuracy}
          isWatching={isWatching}
          isAccurate={isAccurate}
        />
      </div>

      {/* Record Button - centered hero element */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <RecordButton
          isRecording={isRecording}
          duration={duration}
          disabled={recordDisabled}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
        />

        {/* Address Display */}
        <AddressDisplay address={lastAddress} isResolving={isResolving} />

        {/* Upload Status */}
        <UploadStatus
          pendingUploads={pendingUploads}
          lastUploadStatus={lastUploadStatus}
        />
      </div>

      {/* Recent Visits List */}
      {sessionVisits.length > 0 && (
        <div className="pb-4">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Recent Visits
          </h2>
          <div className="space-y-2">
            {sessionVisits.map((visit, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm"
              >
                <p className="text-zinc-800 dark:text-zinc-200">
                  {visit.address || 'Resolving address...'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {Math.floor(visit.duration / 60)}:{(visit.duration % 60)
                    .toString()
                    .padStart(2, '0')}{' '}
                  &middot;{' '}
                  {new Date(visit.recordedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
