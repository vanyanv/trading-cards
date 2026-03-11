import { createClient } from '@/lib/supabase/client';
import type { Card, Pack } from '@/types';

function getClient() {
  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client unavailable');
  return supabase;
}

export async function fetchAvailablePacks(): Promise<Pack[]> {
  const { data, error } = await getClient()
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('set_name');

  if (error) throw error;
  return (data || []) as Pack[];
}

export async function fetchCardsBySet(setId: string): Promise<Card[]> {
  const { data, error } = await getClient()
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('tcg_id');

  if (error) throw error;
  return (data || []) as Card[];
}

export async function fetchCardDetail(cardId: string): Promise<Card> {
  const { data, error } = await getClient()
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (error) throw error;
  return data as Card;
}

export async function fetchPackDetail(packId: string): Promise<Pack> {
  const { data, error } = await getClient()
    .from('packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (error) throw error;
  return data as Pack;
}
