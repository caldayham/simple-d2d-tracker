'use server';

import { createClient } from '@/lib/supabase/server';
import type { Session } from '@/lib/types';
import { sortKnocksWalkingOrder } from '@/lib/route-sort';

export async function createSession(lat?: number, lng?: number): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const date = new Date().toISOString().slice(0, 10);
  const coordStr = lat && lng ? `-${lat.toFixed(2)},${lng.toFixed(2)}` : '';
  const label = `${date}${coordStr}`;

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, label, started: true })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data as Session;
}

export async function getActiveSession(): Promise<{ session: Session; visits: { id: string; address: string | null; audio_duration_seconds: number | null; recorded_at: string | null; result: string | null }[] } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('started', true)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) return null;

  const { data: visits } = await supabase
    .from('visits')
    .select('id, address, audio_duration_seconds, recorded_at, result')
    .eq('session_id', session.id)
    .order('recorded_at', { ascending: false });

  return { session: session as Session, visits: visits ?? [] };
}

export async function endSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to end session: ${error.message}`);
}

export async function updateSession(
  sessionId: string,
  data: { label?: string; notes?: string | null; color?: string | null }
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('sessions')
    .update(data)
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Visits cascade-delete via FK, but we need to clean up audio files first
  const { data: sessionVisits } = await supabase
    .from('visits')
    .select('audio_path')
    .eq('session_id', sessionId);

  if (sessionVisits) {
    const paths = sessionVisits
      .map((v) => v.audio_path)
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from('audio').remove(paths);
    }
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to delete session: ${error.message}`);
}

export async function reorderSessions(
  orderedIds: string[]
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Update sort_order for each session based on position in array
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('sessions')
      .update({ sort_order: index })
      .eq('id', id)
  );

  await Promise.all(updates);
}

export async function createPlannedRoute(label: string): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, label, started: false })
    .select()
    .single();

  if (error) throw new Error(`Failed to create planned route: ${error.message}`);
  return data as Session;
}

export async function addPlannedKnocks(
  sessionId: string,
  knocks: Array<{ latitude: number; longitude: number; address: string | null; notes?: string }>
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Verify session exists and belongs to user
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found or access denied');
  }

  // Sort knocks into walking order before inserting
  const sortedKnocks = sortKnocksWalkingOrder(knocks);

  // Batch insert planned knocks as visit records with null audio/recorded_at
  const visits = sortedKnocks.map((knock, index) => ({
    session_id: sessionId,
    latitude: knock.latitude,
    longitude: knock.longitude,
    address: knock.address,
    notes: knock.notes || null,
    audio_path: null,
    audio_mime_type: null,
    audio_duration_seconds: null,
    recorded_at: null,
    manually_added: false,
    sort_order: index,
  }));

  const { error } = await supabase.from('visits').insert(visits);

  if (error) throw new Error(`Failed to add planned knocks: ${error.message}`);
}
