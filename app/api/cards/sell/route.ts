import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { SELL_RATE } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { userCardIds } = await request.json();

    if (!Array.isArray(userCardIds) || userCardIds.length === 0) {
      return NextResponse.json(
        { error: 'userCardIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user_cards with card data, verify ownership
    const { data: userCards, error: fetchError } = await supabase
      .from('user_cards')
      .select('*, card:cards(price)')
      .in('id', userCardIds)
      .eq('user_id', user.id);

    if (fetchError || !userCards) {
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    if (userCards.length !== userCardIds.length) {
      return NextResponse.json(
        { error: 'Some cards not found or do not belong to you' },
        { status: 403 }
      );
    }

    // Calculate total sell value in USD
    let totalSellValue = 0;
    for (const uc of userCards) {
      const price = uc.card?.price ?? 0;
      totalSellValue += parseFloat((price * SELL_RATE).toFixed(2));
    }
    totalSellValue = parseFloat(totalSellValue.toFixed(2));

    // Get current balance
    const { data: balance } = await supabase
      .from('user_balances')
      .select('balance_usd')
      .eq('user_id', user.id)
      .single();

    const currentBalance = balance?.balance_usd ?? 0;

    // Use admin client for mutations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete the sold cards
    const { error: deleteError } = await adminClient
      .from('user_cards')
      .delete()
      .in('id', userCardIds)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove cards' },
        { status: 500 }
      );
    }

    // Add USD to balance
    const newBalance = parseFloat((currentBalance + totalSellValue).toFixed(2));
    const { error: balanceError } = await adminClient
      .from('user_balances')
      .update({
        balance_usd: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (balanceError) {
      // Rollback: re-insert the deleted cards
      const rollbackRows = userCards.map((uc) => ({
        id: uc.id,
        user_id: uc.user_id,
        card_id: uc.card_id,
        is_reverse_holo: uc.is_reverse_holo,
        obtained_at: uc.obtained_at,
        pack_opened_from: uc.pack_opened_from,
      }));
      await adminClient.from('user_cards').insert(rollbackRows);

      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      amountReceived: totalSellValue,
      newBalance,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
