export type Session = {
  id: string;
  user_id: string;
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
  recorded_at: string;
  created_at: string;
};
