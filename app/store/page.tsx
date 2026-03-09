import { createClient } from '@/lib/supabase/server';
import { PackCard } from '@/components/PackCard';
import type { Pack } from '@/types';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const supabase = await createClient();

  const { data: packs } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Pack Store
        </h1>
        <p className="mt-2 text-sm text-muted">
          Choose a booster pack to open. Each pack contains 10 cards with real
          Pokemon TCG pull rates.
        </p>
      </div>

      {packs && packs.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(packs as Pack[]).map((pack, i) => (
            <PackCard key={pack.id} pack={pack} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-surface p-4">
            <svg
              className="h-8 w-8 text-muted-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-sm text-muted">
            No packs available yet. Run the sync script to load cards.
          </p>
          <code className="mt-2 rounded-lg bg-surface px-3 py-1.5 text-xs text-muted-dim">
            npx tsx scripts/sync-cards.ts
          </code>
        </div>
      )}
    </div>
  );
}
