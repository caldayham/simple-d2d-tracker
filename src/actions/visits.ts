'use server';

import { createClient } from '@/lib/supabase/server';
import { reverseGeocode } from '@/lib/geocoding';
import type { Visit } from '@/lib/types';

export async function createVisit(data: {
  session_id: string;
  latitude: number;
  longitude: number;
  audio_path: string;
  audio_mime_type: string;
  audio_duration_seconds: number;
}): Promise<Visit> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: visit, error } = await supabase
    .from('visits')
    .insert({
      session_id: data.session_id,
      latitude: data.latitude,
      longitude: data.longitude,
      audio_path: data.audio_path,
      audio_mime_type: data.audio_mime_type,
      audio_duration_seconds: data.audio_duration_seconds,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create visit: ${error.message}`);
  return visit as Visit;
}

export async function resolveAndUpdateAddress(
  visitId: string,
  lat: number,
  lng: number
): Promise<string | null> {
  const result = await reverseGeocode(lat, lng);

  if (!result) return null;

  const supabase = await createClient();
  await supabase
    .from('visits')
    .update({ address: result.short_address })
    .eq('id', visitId);

  return result.short_address;
}

export async function updateVisitResult(
  visitId: string,
  result: string,
  notes?: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const update: Record<string, string> = { result };
  if (notes) update.notes = notes;

  const { error } = await supabase
    .from('visits')
    .update(update)
    .eq('id', visitId);

  if (error) throw new Error(`Failed to update visit result: ${error.message}`);
}
