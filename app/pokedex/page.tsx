import { createClient } from '@/lib/supabase/server';
import { PokedexContent } from '@/components/PokedexContent';
import { PokedexIcon } from '@/components/PokedexIcon';
import type { SetCompletion } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PokedexPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted">Please sign in to view your Pokédex.</p>
      </div>
    );
  }

  const [{ data: completionData }, { data: packsData }] = await Promise.all([
    supabase.rpc('get_user_set_completion', { p_user_id: user.id }),
    supabase.from('packs').select('set_id, image_url'),
  ]);

  // Build set_id → image_url map from packs
  const setImages: Record<string, string> = {};
  for (const p of packsData ?? []) {
    if (p.set_id && p.image_url && !setImages[p.set_id]) {
      setImages[p.set_id] = p.image_url;
    }
  }

  const sets: SetCompletion[] = (completionData ?? []).map((s: Record<string, unknown>) => ({
    set_id: s.set_id as string,
    set_name: s.set_name as string,
    owned_count: Number(s.owned_count),
    total_count: Number(s.total_count),
    set_image_url: setImages[s.set_id as string] ?? undefined,
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <PokedexIcon className="h-9 w-9 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pokédex</h1>
          <p className="mt-0.5 text-sm text-muted">
            Track your collection progress across every set
          </p>
        </div>
      </div>
      <PokedexContent sets={sets} />
    </div>
  );
}
