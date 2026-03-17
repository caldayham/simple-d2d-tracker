'use server';

import { createClient } from '@/lib/supabase/server';
import type { Session } from '@/lib/types';

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
    .insert({ user_id: user.id, label })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data as Session;
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
