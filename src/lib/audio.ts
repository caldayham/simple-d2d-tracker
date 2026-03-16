export function getBestAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/mp4;codecs=aac',
    'audio/mp4',
    'audio/webm',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function getFileExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'bin';
}
