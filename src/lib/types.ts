export type Session = {
  id: string;
  user_id: string;
  label: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
};

export type Visit = {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  audio_path: string | null;
  audio_mime_type: string | null;
  audio_duration_seconds: number | null;
  transcript: string | null;
  notes: string | null;
  result: string | null;
  recorded_at: string;
  created_at: string;
};

export const VISIT_RESULTS = [
  'Interested',
  'Not Interested',
  'Not Home',
  'Booked Consult',
  'Come Back Later',
] as const;

export type VisitResult = (typeof VISIT_RESULTS)[number];
