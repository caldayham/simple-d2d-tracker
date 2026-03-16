'use client';

import { Check, AlertCircle, Upload } from 'lucide-react';

interface UploadStatusProps {
  pendingUploads: number;
  lastUploadStatus: 'idle' | 'uploading' | 'success' | 'error';
}

export default function UploadStatus({
  pendingUploads,
  lastUploadStatus,
}: UploadStatusProps) {
  if (lastUploadStatus === 'idle' && pendingUploads === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      {lastUploadStatus === 'uploading' && (
        <>
          <Upload className="w-4 h-4 text-blue-500 animate-bounce" />
          <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
        </>
      )}
      {lastUploadStatus === 'success' && (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Uploaded</span>
        </>
      )}
      {lastUploadStatus === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Upload failed</span>
        </>
      )}
      {pendingUploads > 0 && (
        <span className="text-zinc-500 dark:text-zinc-400">
          ({pendingUploads} pending)
        </span>
      )}
    </div>
  );
}
