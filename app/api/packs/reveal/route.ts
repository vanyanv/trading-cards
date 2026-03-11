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

    // Verify user is authenticated
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

    // Step 1: Verify ownership (non-destructive check first)
    const { data: packRow, error: packError } = await adminClient
      .from('unopened_packs')
      .select('*')
      .eq('id', unopenedPackId)
      .eq('user_id', user.id)
      .single();

    if (packError || !packRow) {
      return NextResponse.json(
        { error: 'Pack not found or already opened' },
        { status: 404 }
      );
    }

    // Step 2: Read card data BEFORE deleting (CASCADE would wipe these)
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

    // Step 3: Atomic claim — DELETE the pack row (CASCADE cleans up unopened_pack_cards)
    const { data: claimedPack, error: claimError } = await adminClient
      .from('unopened_packs')
      .delete()
      .eq('id', unopenedPackId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (claimError || !claimedPack) {
      // Another request claimed it between our SELECT and DELETE (race condition)
      return NextResponse.json(
        { error: 'Pack not found or already opened' },
        { status: 404 }
      );
    }

    // Step 4: Insert cards into user_cards
    const userCardRows = packCards.map((pc) => ({
      user_id: user.id,
      card_id: pc.card_id,
      is_reverse_holo: pc.is_reverse_holo,
      edition: pc.edition || null,
      pack_opened_from: claimedPack.pack_id,
    }));

    const { error: insertError } = await adminClient
      .from('user_cards')
      .insert(userCardRows);

    if (insertError) {
      // Rollback: re-insert the unopened pack + cards (CASCADE already deleted pack_cards)
      await adminClient.from('unopened_packs').insert({
        id: claimedPack.id,
        user_id: claimedPack.user_id,
        pack_id: claimedPack.pack_id,
        purchased_at: claimedPack.purchased_at,
      });
      await adminClient.from('unopened_pack_cards').insert(
        packCards.map((pc) => ({
          unopened_pack_id: claimedPack.id,
          card_id: pc.card_id,
          is_reverse_holo: pc.is_reverse_holo,
          edition: pc.edition,
          slot_number: pc.slot_number,
        }))
      );

      return NextResponse.json(
        { error: 'Failed to save cards to collection' },
        { status: 500 }
      );
    }

    // Build PulledCard[] response with full card details
    const cards = packCards.map((pc) => {
      const card = pc.card as unknown as Record<string, unknown>;
      return {
        ...card,
        is_reverse_holo: pc.is_reverse_holo,
        edition: pc.edition || null,
        slot_number: pc.slot_number,
      };
    });

    return NextResponse.json({ cards, packId: claimedPack.pack_id });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
