import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openPack } from '@/lib/pack-opening';
import { getEffectiveRates } from '@/lib/pull-rate-engine';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'Pack ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the pack
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    if (!pack.available) {
      return NextResponse.json(
        { error: 'Pack not available' },
        { status: 400 }
      );
    }

    // Check user balance
    const { data: balance } = await supabase
      .from('user_balances')
      .select('balance_usd')
      .eq('user_id', user.id)
      .single();

    const packPrice = pack.price_usd ?? 4.49;
    if (!balance || balance.balance_usd < packPrice) {
      return NextResponse.json(
        { error: 'Not enough balance' },
        { status: 400 }
      );
    }

    // Use admin client for mutations to bypass RLS for the transaction
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Deduct balance
    const newBalance = parseFloat((balance.balance_usd - packPrice).toFixed(2));
    const { error: deductError } = await adminClient
      .from('user_balances')
      .update({
        balance_usd: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (deductError) {
      return NextResponse.json(
        { error: 'Failed to deduct balance' },
        { status: 500 }
      );
    }

    // Get Bayesian-adjusted pull rates for this set
    const isTCGP = pack.cards_per_pack === 5;
    const slotType = isTCGP ? 'tcgp_hit_slot' : 'hit_slot';
    const effectiveRates = await getEffectiveRates(adminClient, pack.set_id, slotType as 'hit_slot' | 'tcgp_hit_slot');

    // Open pack (roll cards)
    const pulledCards = await openPack(adminClient, pack.set_id, pack.booster_id, pack.cards_per_pack, pack.edition, effectiveRates);

    // Insert into unopened_packs (metadata)
    const { data: unopenedPack, error: packInsertError } = await adminClient
      .from('unopened_packs')
      .insert({
        user_id: user.id,
        pack_id: packId,
      })
      .select('id')
      .single();

    if (packInsertError || !unopenedPack) {
      // Refund on failure
      await adminClient
        .from('user_balances')
        .update({
          balance_usd: balance.balance_usd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to save pack' },
        { status: 500 }
      );
    }

    // Insert card data into unopened_pack_cards (server-only, never sent to client)
    const cardRows = pulledCards.map((card) => ({
      unopened_pack_id: unopenedPack.id,
      card_id: card.id,
      is_reverse_holo: card.is_reverse_holo,
      edition: pack.edition || null,
      slot_number: card.slot_number,
    }));

    const { error: cardsInsertError } = await adminClient
      .from('unopened_pack_cards')
      .insert(cardRows);

    if (cardsInsertError) {
      // Clean up the unopened pack and refund
      await adminClient.from('unopened_packs').delete().eq('id', unopenedPack.id);
      await adminClient
        .from('user_balances')
        .update({
          balance_usd: balance.balance_usd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to save cards' },
        { status: 500 }
      );
    }

    // Increment open count for trending (fire-and-forget)
    adminClient.rpc('increment_open_count', { pack_id: packId }).then();

    // Record hit slot pull for Bayesian rate tracking (fire-and-forget)
    const hitSlotCard = pulledCards[pulledCards.length - 1]; // last card is always the hit slot
    if (hitSlotCard) {
      adminClient
        .rpc('record_pull_stats', {
          p_set_id: pack.set_id,
          p_rarity: hitSlotCard.rarity,
          p_slot_type: slotType,
        })
        .then();
    }

    // Return pack ID only — no card data sent to client
    return NextResponse.json({
      unopenedPackId: unopenedPack.id,
      newBalance,
      packCost: packPrice,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
