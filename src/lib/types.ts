export type Session = {
  id: string;
  user_id: string;
  label: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  sort_order: number | null;
  started: boolean;
  color: string | null;
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
  contact_name: string | null;
  gender: string | null;
  age_range: string | null;
  occupancy: string | null;
  manually_added: boolean;
  sort_order: number | null;
  recorded_at: string | null;
  created_at: string;
};

// Planned knocks are visits with null audio_path and null recorded_at
export type PlannedKnock = Visit;

export type ResultTag = {
  name: string;
  color: string;
};

export type PracticeNode = {
  id: string;
  user_id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
};

export type PracticeConnection = {
  id: string;
  user_id: string;
  from_node_id: string;
  to_node_id: string;
  from_anchor: 'top' | 'right' | 'bottom' | 'left';
  to_anchor: 'top' | 'right' | 'bottom' | 'left';
  created_at: string;
};

export const DEFAULT_RESULT_TAGS: ResultTag[] = [
  { name: 'Interested', color: '#16a34a' },
  { name: 'Not Interested', color: '#71717a' },
  { name: 'Not Home', color: '#ca8a04' },
  { name: 'Booked Consult', color: '#2563eb' },
  { name: 'Come Back Later', color: '#f97316' },
];
