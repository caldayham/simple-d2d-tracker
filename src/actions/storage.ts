'use server';

import { createClient } from '@/lib/supabase/server';

export async function createSignedUploadUrl(filePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUploadUrl(filePath);

  if (error) throw new Error(`Failed to create upload URL: ${error.message}`);

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  };
}

export async function createSignedDownloadUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(filePath, 3600);

  if (error) throw new Error(`Failed to create download URL: ${error.message}`);

  return data.signedUrl;
}
