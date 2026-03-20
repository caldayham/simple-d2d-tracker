'use server';

import { createClient } from '@/lib/supabase/server';
import type { PracticeNode, PracticeConnection } from '@/lib/types';

export async function getPracticeData(): Promise<{
  nodes: PracticeNode[];
  connections: PracticeConnection[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const [nodesResult, connectionsResult] = await Promise.all([
    supabase
      .from('practice_nodes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('practice_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ]);

  if (nodesResult.error) throw new Error(`Failed to fetch practice nodes: ${nodesResult.error.message}`);
  if (connectionsResult.error) throw new Error(`Failed to fetch practice connections: ${connectionsResult.error.message}`);

  return {
    nodes: nodesResult.data as PracticeNode[],
    connections: connectionsResult.data as PracticeConnection[],
  };
}

export async function upsertNode(node: {
  id?: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<PracticeNode> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (node.id) {
    const { data, error } = await supabase
      .from('practice_nodes')
      .update({
        content: node.content,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        updated_at: new Date().toISOString(),
      })
      .eq('id', node.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update node: ${error.message}`);
    return data as PracticeNode;
  }

  const { data, error } = await supabase
    .from('practice_nodes')
    .insert({
      user_id: user.id,
      content: node.content,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create node: ${error.message}`);
  return data as PracticeNode;
}

export async function deleteNode(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('practice_nodes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to delete node: ${error.message}`);
}

export async function createConnection(data: {
  from_node_id: string;
  to_node_id: string;
  from_anchor: string;
  to_anchor: string;
}): Promise<PracticeConnection> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: connection, error } = await supabase
    .from('practice_connections')
    .insert({
      user_id: user.id,
      from_node_id: data.from_node_id,
      to_node_id: data.to_node_id,
      from_anchor: data.from_anchor,
      to_anchor: data.to_anchor,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create connection: ${error.message}`);
  return connection as PracticeConnection;
}

export async function deleteConnection(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('practice_connections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to delete connection: ${error.message}`);
}
