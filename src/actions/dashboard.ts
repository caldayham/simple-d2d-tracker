'use server';

import { createClient } from '@/lib/supabase/server';
import type { Session, Visit } from '@/lib/types';

export async function getDashboardData(options?: {
  started?: boolean;
}): Promise<{
  sessions: Session[];
  visits: Visit[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  let sessionsQuery = supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id);

  if (options?.started !== undefined) {
    sessionsQuery = sessionsQuery.eq('started', options.started);
  }

  sessionsQuery = sessionsQuery
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('started_at', { ascending: true });

  let visitsQuery = supabase
    .from('visits')
    .select('*, sessions!inner(user_id, started)')
    .eq('sessions.user_id', user.id);

  if (options?.started !== undefined) {
    visitsQuery = visitsQuery.eq('sessions.started', options.started);
  }

  visitsQuery = visitsQuery
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });

  const [sessionsResult, visitsResult] = await Promise.all([
    sessionsQuery,
    visitsQuery,
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
