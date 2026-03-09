import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase
      .from('user_balances')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ coins: data?.coins ?? 0 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add 500 coins (mock top-up)
export async function POST() {
  try {
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

    const { data: balance } = await adminClient
      .from('user_balances')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    const currentCoins = balance?.coins ?? 0;

    const { error } = await adminClient
      .from('user_balances')
      .update({
        coins: currentCoins + 500,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add coins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ coins: currentCoins + 500 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
