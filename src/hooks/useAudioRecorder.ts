'use client';

import { useState, useRef, useCallback } from 'react';
import { getBestAudioMimeType } from '@/lib/audio';

export type RecordingResult = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
};

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mimeType, setMimeType] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const resolveStopRef = useRef<((result: RecordingResult) => void) | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const stoppingRef = useRef(false);

  const cleanup = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Release wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Remove visibility handler
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }

    mediaRecorderRef.current = null;
    stoppingRef.current = false;
  }, []);

  const stopRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise<RecordingResult>((resolve, reject) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        // Already stopped (e.g., visibilitychange beat us)
        const detectedMime = mimeType || '';
        const blob = new Blob(chunksRef.current, { type: detectedMime });
        const result: RecordingResult = {
          blob,
          mimeType: detectedMime,
          durationSeconds: durationRef.current,
        };
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        durationRef.current = 0;
        chunksRef.current = [];
        resolve(result);
        return;
      }

      if (stoppingRef.current) {
        // Already stopping, wait for the existing promise
        reject(new Error('Already stopping'));
        return;
      }

      stoppingRef.current = true;
      resolveStopRef.current = resolve;

      recorder.onstop = () => {
        const detectedMime = mimeType || recorder.mimeType || '';
        const blob = new Blob(chunksRef.current, { type: detectedMime });
        const result: RecordingResult = {
          blob,
          mimeType: detectedMime,
          durationSeconds: durationRef.current,
        };

        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        durationRef.current = 0;
        chunksRef.current = [];

        if (resolveStopRef.current) {
          resolveStopRef.current(result);
          resolveStopRef.current = null;
        }
      };

      recorder.stop();
    });
  }, [mimeType, cleanup]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      durationRef.current = 0;
      setDuration(0);

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Detect best MIME type
      const detectedMime = getBestAudioMimeType();
      setMimeType(detectedMime);

      // Create MediaRecorder
      const recorder = detectedMime
        ? new MediaRecorder(stream, { mimeType: detectedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      // Handle data chunks
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Acquire Wake Lock
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock not available:', err);
      }

      // Start chunked recording with 10-second timeslice
      recorder.start(10000);
      setIsRecording(true);
      setIsPaused(false);

      // Start duration timer
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);

      // Register visibilitychange listener
      const handleVisibility = () => {
        if (
          document.visibilityState === 'hidden' &&
          mediaRecorderRef.current?.state === 'recording'
        ) {
          stopRecording().catch(() => {});
        }
      };
      visibilityHandlerRef.current = handleVisibility;
      document.addEventListener('visibilitychange', handleVisibility);
    } catch (err) {
      cleanup();
      setIsRecording(false);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone permission denied');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found');
      } else {
        setError('Failed to start recording');
      }
      throw err;
    }
  }, [cleanup, stopRecording]);

  return {
    isRecording,
    isPaused,
    duration,
    mimeType,
    startRecording,
    stopRecording,
    error,
  };
}
