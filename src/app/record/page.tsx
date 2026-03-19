'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createSession, endSession } from '@/actions/sessions';
import { createSignedUploadUrl } from '@/actions/storage';
import { createVisit, resolveAndUpdateAddress, updateVisitResult } from '@/actions/visits';
import { createClient } from '@/lib/supabase/client';
import { getFileExtension } from '@/lib/audio';
import { getResultTags } from '@/actions/settings';
import type { Session, ResultTag } from '@/lib/types';
import { DEFAULT_RESULT_TAGS } from '@/lib/types';
import RecordButton from '@/components/recording/RecordButton';
import SessionControls from '@/components/recording/SessionControls';
import GpsStatus from '@/components/recording/GpsStatus';
import UploadStatus from '@/components/recording/UploadStatus';
import ResultPicker from '@/components/recording/ResultPicker';
import type { Demographics } from '@/components/recording/ResultPicker';
import AddressEditor from '@/components/recording/AddressEditor';

const LocationMap = dynamic(() => import('@/components/recording/LocationMap'), {
  ssr: false,
});

type SessionVisit = {
  id: string;
  address: string | null;
  duration: number;
  recordedAt: string;
  result: string | null;
};

export default function RecordPage() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [lastUploadStatus, setLastUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [sessionVisits, setSessionVisits] = useState<SessionVisit[]>([]);
  const [pendingResultVisitId, setPendingResultVisitId] = useState<string | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [resultTags, setResultTags] = useState<ResultTag[]>([]);
  const pendingResultRef = useRef<{ tempId: string; result: string; notes?: string; demographics?: Demographics } | null>(null);

  useEffect(() => {
    getResultTags().then(setResultTags).catch(() => {
      setResultTags(DEFAULT_RESULT_TAGS);
    });
  }, []);

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

  const handleUpdateAddress = useCallback(async () => {
    if (!position) return;
    setIsFetchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.latitude}&lon=${position.longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
          },
        }
      );
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      const addr = data.address || {};
      let short = '';
      if (addr.house_number && addr.road) {
        short = `${addr.house_number} ${addr.road}`;
      } else if (addr.road) {
        short = addr.road;
      } else {
        short = data.display_name || `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`;
      }
      setCurrentAddress(short);
    } catch {
      toast.error('Could not resolve address');
    } finally {
      setIsFetchingAddress(false);
    }
  }, [position]);

  const handleStartSession = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const session = await createSession(
        position?.latitude,
        position?.longitude
      );
      setActiveSession(session);
      startWatching();
      setSessionVisits([]);
      setLastAddress(null);
      setCurrentAddress(null);
      setLastUploadStatus('idle');
    } catch (err) {
      toast.error('Failed to start session');
      console.error(err);
    } finally {
      setIsSessionLoading(false);
    }
  }, [startWatching, position]);

  const handleEndSession = useCallback(async () => {
    if (!activeSession || isRecording) return;
    setIsSessionLoading(true);
    try {
      await endSession(activeSession.id);
      stopWatching();
      setActiveSession(null);
      setSessionVisits([]);
      setLastAddress(null);
      setCurrentAddress(null);
      setLastUploadStatus('idle');
      setPendingUploads(0);
      setPendingResultVisitId(null);
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
      const { latitude, longitude } = position;
      const recordingDuration = result.durationSeconds;

      // Create a temporary visit ID for immediate UI feedback
      const tempId = `temp-${Date.now()}`;
      const newVisit: SessionVisit = {
        id: tempId,
        address: currentAddress,
        duration: recordingDuration,
        recordedAt: new Date().toISOString(),
        result: null,
      };
      setSessionVisits((prev) => [newVisit, ...prev]);
      setLastAddress(currentAddress);

      // Show result picker immediately
      setPendingResultVisitId(tempId);

      // Queue upload + visit creation in background
      setPendingUploads((p) => p + 1);
      setLastUploadStatus('uploading');

      const uploadAndCreate = async () => {
        const ext = getFileExtension(result.mimeType);
        const filePath = `recordings/${activeSession.id}/${Date.now()}.${ext}`;

        const { path, token } = await createSignedUploadUrl(filePath);

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .uploadToSignedUrl(path, token, result.blob, {
            contentType: result.mimeType,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const visit = await createVisit({
          session_id: activeSession.id,
          latitude,
          longitude,
          audio_path: filePath,
          audio_mime_type: result.mimeType,
          audio_duration_seconds: recordingDuration,
        });

        // Swap temp ID for real visit ID
        setSessionVisits((prev) =>
          prev.map((v) => (v.id === tempId ? { ...v, id: visit.id } : v))
        );
        setPendingResultVisitId((prev) => (prev === tempId ? visit.id : prev));

        setLastUploadStatus('success');
        setPendingUploads((p) => Math.max(0, p - 1));

        // Apply any result/notes that were selected while upload was in progress
        if (pendingResultRef.current?.tempId === tempId) {
          const { result: pendingResult, notes: pendingNotes, demographics: pendingDemographics } = pendingResultRef.current;
          pendingResultRef.current = null;
          updateVisitResult(visit.id, pendingResult, pendingNotes, pendingDemographics).catch((err) => {
            toast.error('Failed to save result');
            console.error(err);
          });
        }

        // Resolve address server-side
        setIsResolving(true);
        resolveAndUpdateAddress(visit.id, latitude, longitude)
          .then((address) => {
            if (address) {
              setLastAddress(address);
              setSessionVisits((prev) =>
                prev.map((v) =>
                  v.id === visit.id ? { ...v, address } : v
                )
              );
            }
            setIsResolving(false);
          })
          .catch(() => setIsResolving(false));
      };

      uploadAndCreate().catch((err) => {
        setLastUploadStatus('error');
        setPendingUploads((p) => Math.max(0, p - 1));
        toast.error(err instanceof Error ? err.message : 'Upload failed');
        console.error(err);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Recording failed');
      console.error(err);
    }
  }, [activeSession, position, stopRecording, currentAddress]);

  const handleResultSelect = useCallback(async (result: string, notes?: string, demographics?: Demographics) => {
    if (!pendingResultVisitId) return;
    setIsSubmittingResult(true);

    // Update UI immediately
    setSessionVisits((prev) =>
      prev.map((v) =>
        v.id === pendingResultVisitId ? { ...v, result } : v
      )
    );

    const visitId = pendingResultVisitId;
    setPendingResultVisitId(null);
    setCurrentAddress(null); // Reset for next house

    if (visitId.startsWith('temp-')) {
      // Upload still in progress — stash result to apply when real ID arrives
      pendingResultRef.current = { tempId: visitId, result, notes, demographics };
      setIsSubmittingResult(false);
    } else {
      try {
        await updateVisitResult(visitId, result, notes, demographics);
      } catch (err) {
        toast.error('Failed to save result');
        console.error(err);
      } finally {
        setIsSubmittingResult(false);
      }
    }
  }, [pendingResultVisitId]);

  const recordDisabled = !activeSession || !isAccurate || !!pendingResultVisitId;

  return (
    <div className="relative min-h-screen">
      {/* Background Map */}
      <LocationMap
        latitude={position?.latitude ?? null}
        longitude={position?.longitude ?? null}
        accuracy={accuracy}
      />

      {/* Overlay UI */}
      <div className="relative z-10 flex min-h-screen flex-col px-4 pt-safe pb-safe pointer-events-none">
        {/* Header */}
        <div className="pt-4 pb-2 pointer-events-auto">
          <h1 className="text-lg font-semibold text-white text-center drop-shadow-md">
            Canvassing Companion
          </h1>
        </div>

        {/* Session Controls */}
        <div className="py-3 pointer-events-auto">
          <SessionControls
            activeSession={activeSession}
            isLoading={isSessionLoading}
            onStart={handleStartSession}
            onEnd={handleEndSession}
          />
        </div>

        {/* GPS Status */}
        <div className="flex justify-center py-2 pointer-events-auto">
          <GpsStatus
            accuracy={accuracy}
            isWatching={isWatching}
            isAccurate={isAccurate}
          />
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pointer-events-auto">
          {pendingResultVisitId ? (
            <>
              <div className="rounded-lg bg-black/50 backdrop-blur-sm px-4 py-2">
                <p className="text-white text-sm font-medium">
                  {lastAddress || 'Resolving address...'}
                </p>
              </div>
              <ResultPicker
                tags={resultTags}
                onSelect={handleResultSelect}
                isSubmitting={isSubmittingResult}
              />
            </>
          ) : (
            <>
              <RecordButton
                isRecording={isRecording}
                duration={duration}
                disabled={recordDisabled}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
              />

              {/* Address editor with manual override + nearby search */}
              <AddressEditor
                currentAddress={currentAddress}
                position={position}
                isFetching={isFetchingAddress}
                onUpdateAddress={handleUpdateAddress}
                onSetAddress={setCurrentAddress}
              />

              {/* Upload Status */}
              <UploadStatus
                pendingUploads={pendingUploads}
                lastUploadStatus={lastUploadStatus}
              />
            </>
          )}
        </div>

        {/* Recent Visits List */}
        {sessionVisits.length > 0 && (
          <div className="pb-4 pointer-events-auto">
            <h2 className="text-sm font-medium text-white/70 mb-2">
              Recent Visits
            </h2>
            <div className="space-y-2">
              {sessionVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white">
                      {visit.address || 'Resolving address...'}
                    </p>
                    {visit.result && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        visit.result === 'Interested' ? 'bg-green-600/80 text-white' :
                        visit.result === 'Booked Consult' ? 'bg-blue-600/80 text-white' :
                        visit.result === 'Not Home' ? 'bg-yellow-600/80 text-white' :
                        visit.result === 'Come Back Later' ? 'bg-orange-500/80 text-white' :
                        'bg-zinc-500/80 text-white'
                      }`}>
                        {visit.result}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-1">
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
    </div>
  );
}
