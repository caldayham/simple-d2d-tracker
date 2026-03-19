'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_RESULT_TAGS } from '@/lib/types';
import type { ResultTag } from '@/lib/types';

export async function getResultTags(): Promise<ResultTag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data } = await supabase
    .from('user_settings')
    .select('result_tags')
    .eq('user_id', user.id)
    .single();

  return (data?.result_tags as ResultTag[] | null) ?? DEFAULT_RESULT_TAGS;
}

export async function saveResultTags(tags: ResultTag[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: user.id,
        result_tags: tags,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(`Failed to save settings: ${error.message}`);
}
