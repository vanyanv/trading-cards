import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { unopenedPackId } = await request.json();
    if (!unopenedPackId) {
      return NextResponse.json({ error: 'Unopened pack ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership
    const { data: packRow, error: packError } = await adminClient
      .from('unopened_packs')
      .select('pack_id')
      .eq('id', unopenedPackId)
      .eq('user_id', user.id)
      .single();

    if (packError || !packRow) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // Read card data — no mutations, pack stays in unopened_packs
    const { data: packCards, error: cardsError } = await adminClient
      .from('unopened_pack_cards')
      .select('card_id, is_reverse_holo, edition, slot_number, card:cards(*)')
      .eq('unopened_pack_id', unopenedPackId)
      .order('slot_number', { ascending: true });

    if (cardsError || !packCards || packCards.length === 0) {
      return NextResponse.json(
        { error: 'Failed to read card data' },
        { status: 500 }
      );
    }

    const cards = packCards.map((pc) => {
      const card = pc.card as unknown as Record<string, unknown>;
      return {
        ...card,
        is_reverse_holo: pc.is_reverse_holo,
        edition: pc.edition || null,
        slot_number: pc.slot_number,
      };
    });

    return NextResponse.json({ cards, packId: packRow.pack_id });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
