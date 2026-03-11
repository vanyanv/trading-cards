import { Rarity } from '@/types';
import { getPriorRatesForSet, TCGP_HIT_SLOT_RATES, type RateEntry } from './constants';

/**
 * Dirichlet-Multinomial Bayesian pull rate engine.
 *
 * Starts from community-estimated priors and converges toward observed data:
 *   posterior_rate(r) = (prior_count(r) + observed_count(r)) / (PRIOR_STRENGTH + total_opens)
 *
 * At 0 opens: 100% prior. At PRIOR_STRENGTH opens: 50/50. At 4x: ~80% observed.
 */

/** How many pseudo-observations the prior is worth. */
const PRIOR_STRENGTH = 500;

/** Cache TTL in milliseconds (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

type SlotType = 'hit_slot' | 'reverse_holo' | 'tcgp_hit_slot';

interface PullStatRow {
  rarity: string;
  pull_count: number;
  total_opens: number;
}

interface CacheEntry {
  rates: RateEntry[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(setId: string, slotType: SlotType): string {
  return `${setId}:${slotType}`;
}

/**
 * Compute Bayesian posterior rates by blending prior with observed pull data.
 */
function computePosterior(
  priorRates: RateEntry[],
  observed: PullStatRow[],
): RateEntry[] {
  // Use the max total_opens across rows (they should all be in sync, but be safe)
  const totalOpens = observed.reduce((max, row) => Math.max(max, row.total_opens), 0);

  if (totalOpens === 0) {
    return priorRates;
  }

  const totalPriorWeight = priorRates.reduce((sum, r) => sum + r.weight, 0);

  return priorRates.map((prior) => {
    const priorCount = (prior.weight / totalPriorWeight) * PRIOR_STRENGTH;
    const obs = observed.find((o) => o.rarity === prior.rarity);
    const observedCount = obs?.pull_count ?? 0;

    const posteriorWeight =
      ((priorCount + observedCount) / (PRIOR_STRENGTH + totalOpens)) * 100;

    return { rarity: prior.rarity, weight: posteriorWeight };
  });
}

/**
 * Get effective pull rates for a set+slot, blending prior with tracked observations.
 * Results are cached for 5 minutes per set+slot.
 */
export async function getEffectiveRates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  setId: string,
  slotType: SlotType,
): Promise<RateEntry[]> {
  const key = cacheKey(setId, slotType);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.rates;
  }

  // Determine prior based on era or slot type
  const priorRates =
    slotType === 'tcgp_hit_slot'
      ? TCGP_HIT_SLOT_RATES
      : getPriorRatesForSet(setId);

  // Fetch observed stats from pull_stats table
  const { data: stats } = await supabase
    .from('pull_stats')
    .select('rarity, pull_count, total_opens')
    .eq('set_id', setId)
    .eq('slot_type', slotType);

  const observed: PullStatRow[] = stats ?? [];
  const rates = computePosterior(priorRates, observed);

  cache.set(key, { rates, timestamp: Date.now() });

  return rates;
}
