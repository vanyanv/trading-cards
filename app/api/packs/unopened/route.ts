import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: unopenedPacks, error } = await supabase
      .from('unopened_packs')
      .select('id, pack_id, purchased_at, pack:packs(name, image_url, cards_per_pack, edition, set_name)')
      .order('purchased_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch unopened packs' }, { status: 500 });
    }

    return NextResponse.json({ unopenedPacks: unopenedPacks || [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
