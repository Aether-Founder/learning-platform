import { createServerClient as createClient } from './supabase/server';
import type { WorkspaceItem } from '@/store/useWorkspaceStore';

export async function fetchWorkspaceItems(): Promise<WorkspaceItem[]> {
  const supabase = (await createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('workspace_items')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch workspace items:', error);
    return [];
  }

  return data || [];
}

export async function createWorkspaceItem(itemData: {
  name: string;
  type: 'map' | 'page';
  parent_id?: string | null;
  content?: any;
}) {
  const supabase = (await createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Get the next order_index for this parent
  const { data: siblings } = await supabase
    .from('workspace_items')
    .select('order_index')
    .eq('user_id', user.id)
    .eq('parent_id', itemData.parent_id ?? null);

  const order_index = siblings ? Math.max(-1, ...siblings.map((s: any) => s.order_index)) + 1 : 0;

  const { data, error } = await supabase
    .from('workspace_items')
    .insert({
      user_id: user.id,
      name: itemData.name,
      type: itemData.type,
      parent_id: itemData.parent_id ?? null,
      order_index,
      content: itemData.content ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkspaceItem(
  id: string,
  updates: Partial<{ name: string; content: any; parent_id: string | null; order_index: number }>
) {
  const supabase = (await createClient()) as any;
  
  const { data, error } = await supabase
    .from('workspace_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkspaceItem(id: string) {
  const supabase = (await createClient()) as any;
  
  const { error } = await supabase.from('workspace_items').delete().eq('id', id);
  
  if (error) throw error;
}

export async function moveWorkspaceItem(
  id: string,
  newParentId: string | null,
  newIndex: number
) {
  const supabase = (await createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Update the moved item
  const { error } = await supabase
    .from('workspace_items')
    .update({
      parent_id: newParentId,
      order_index: newIndex,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
