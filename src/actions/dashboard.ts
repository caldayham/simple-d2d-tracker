'use server';

import { createClient } from '@/lib/supabase/server';
import type { Session, Visit } from '@/lib/types';

export async function getDashboardData(): Promise<{
  sessions: Session[];
  visits: Visit[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const [sessionsResult, visitsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('visits')
      .select('*, sessions!inner(user_id)')
      .eq('sessions.user_id', user.id)
      .order('recorded_at', { ascending: false }),
  ]);

  if (sessionsResult.error)
    throw new Error(`Failed to fetch sessions: ${sessionsResult.error.message}`);
  if (visitsResult.error)
    throw new Error(`Failed to fetch visits: ${visitsResult.error.message}`);

  // Strip the joined sessions data from visits
  const visits = visitsResult.data.map(({ sessions, ...visit }) => visit) as Visit[];

  return {
    sessions: sessionsResult.data as Session[],
    visits,
  };
}
