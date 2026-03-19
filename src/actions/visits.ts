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
  notes?: string,
  demographics?: { contact_name?: string; gender?: string; age_range?: string; occupancy?: string }
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const update: Record<string, string | undefined> = { result };
  if (notes) update.notes = notes;
  if (demographics) {
    if (demographics.contact_name) update.contact_name = demographics.contact_name;
    if (demographics.gender) update.gender = demographics.gender;
    if (demographics.age_range) update.age_range = demographics.age_range;
    if (demographics.occupancy) update.occupancy = demographics.occupancy;
  }

  const { error } = await supabase
    .from('visits')
    .update(update)
    .eq('id', visitId);

  if (error) throw new Error(`Failed to update visit result: ${error.message}`);
}

export async function updateVisit(
  visitId: string,
  data: {
    address?: string | null;
    result?: string | null;
    notes?: string | null;
    latitude?: number;
    longitude?: number;
    contact_name?: string | null;
    gender?: string | null;
    age_range?: string | null;
    occupancy?: string | null;
  }
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('visits')
    .update(data)
    .eq('id', visitId);

  if (error) throw new Error(`Failed to update visit: ${error.message}`);
}

export async function deleteVisit(visitId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Delete audio from storage if it exists
  const { data: visit } = await supabase
    .from('visits')
    .select('audio_path')
    .eq('id', visitId)
    .single();

  if (visit?.audio_path) {
    await supabase.storage.from('audio').remove([visit.audio_path]);
  }

  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId);

  if (error) throw new Error(`Failed to delete visit: ${error.message}`);
}

export async function createManualVisit(data: {
  session_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  result?: string;
  notes?: string;
  contact_name?: string;
  gender?: string;
  age_range?: string;
  occupancy?: string;
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
      address: data.address || null,
      result: data.result || null,
      notes: data.notes || null,
      contact_name: data.contact_name || null,
      gender: data.gender || null,
      age_range: data.age_range || null,
      occupancy: data.occupancy || null,
      manually_added: true,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create visit: ${error.message}`);
  return visit as Visit;
}
