'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Gem, Package, Layers, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { getAvatar } from '@/lib/avatars';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityDistributionBar } from '@/components/RarityDistributionBar';
import { SetProgressBar } from '@/components/SetProgressBar';
import type { SetCompletion, UserProfileStats, Rarity } from '@/types';

interface ProfileProps {
  profile: { display_name: string | null; avatar_id: string | null };
  stats: UserProfileStats;
  sets: SetCompletion[];
  rarityBreakdown: { rarity: string; count: number }[];
  recentPulls: {
    card_name: string;
    card_image_url: string;
    card_rarity: string;
    set_name: string;
    obtained_at: string;
  }[];
  topCards: {
    card_id: string;
    card_name: string;
    card_image_url: string;
    card_rarity: string;
    card_price: number;
  }[];
  packBreakdown?: {
    pack_id: string;
    pack_name: string;
    pack_image_url: string;
    set_name: string;
    times_opened: number;
  }[];
  luckStats?: {
    rarity: string;
    user_count: number;
    user_total: number;
    community_rate: number;
  }[];
  isOwnProfile: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function PublicProfile({
  profile,
  stats,
  sets,
  rarityBreakdown,
  recentPulls,
  topCards,
  packBreakdown = [],
  luckStats = [],
  isOwnProfile,
}: ProfileProps) {
  const avatar = getAvatar(profile.avatar_id);
  const memberDate = stats.member_since
    ? new Date(stats.member_since).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const isEmpty = stats.total_cards === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${avatar.bg}`}>
          {avatar.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {profile.display_name || 'Trainer'}
          </h1>
          {memberDate && (
            <p className="text-sm text-muted">Member since {memberDate}</p>
          )}
        </div>
        {isOwnProfile && (
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
            Edit Profile
          </Link>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16">
          <Gem className="mb-3 h-10 w-10 text-muted" />
          <p className="text-sm font-medium text-foreground">
            This trainer hasn&apos;t started collecting yet
          </p>
          <p className="mt-1 text-xs text-muted">Check back later!</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Collection Value"
              value={`$${Number(stats.total_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <StatCard icon={Gem} label="Unique Cards" value={stats.unique_cards} />
            <StatCard icon={Package} label="Packs Opened" value={stats.packs_opened} />
            <StatCard icon={Layers} label="Sets Started" value={stats.sets_started} />
          </div>

          {/* Rarity distribution */}
          {rarityBreakdown.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Rarity Distribution</h2>
              <RarityDistributionBar data={rarityBreakdown} />
            </section>
          )}

          {/* Luck stats (own profile only) */}
          {isOwnProfile && luckStats.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Your Luck</h2>
              <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
                {luckStats.map((stat) => {
                  const rarityConfig = RARITY_CONFIG[stat.rarity as Rarity];
                  const userRate = stat.user_total > 0 ? stat.user_count / stat.user_total : 0;
                  const communityRate = Number(stat.community_rate) || 0;
                  const luckFactor = communityRate > 0 ? userRate / communityRate : null;
                  const luckPct = luckFactor ? Math.round((luckFactor - 1) * 100) : null;

                  return (
                    <div key={stat.rarity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: rarityConfig?.color ?? '#9CA3AF' }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {rarityConfig?.label ?? stat.rarity}
                        </span>
                        <span className="text-xs tabular-nums text-muted">
                          ({stat.user_count}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {luckPct !== null ? (
                          <>
                            {luckPct >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span
                              className={`text-xs font-bold tabular-nums ${
                                luckPct >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {luckPct >= 0 ? '+' : ''}{luckPct}% vs avg
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted">Not enough data</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Packs opened breakdown */}
          {packBreakdown.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Packs Opened</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {packBreakdown.map((pack) => (
                  <Link
                    key={pack.pack_id}
                    href={`/pack/${pack.pack_id}`}
                    className="flex w-28 shrink-0 flex-col items-center rounded-xl border border-border bg-surface p-2 transition-colors hover:border-accent/30"
                  >
                    <img
                      src={pack.pack_image_url}
                      alt={pack.pack_name}
                      className="mb-2 h-28 w-20 rounded-lg object-contain"
                    />
                    <p className="w-full truncate text-center text-[10px] font-medium text-foreground">
                      {pack.pack_name}
                    </p>
                    <p className="text-xs font-bold tabular-nums text-accent">
                      x{pack.times_opened}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Set completion */}
          {sets.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Set Completion</h2>
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                {sets.map((set) => (
                  <SetProgressBar
                    key={set.set_id}
                    setName={set.set_name}
                    ownedCount={set.owned_count}
                    totalCount={set.total_count}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          {/* Top cards */}
          {topCards.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Most Valuable Cards</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {topCards.map((card, index) => {
                  const rarityConfig = RARITY_CONFIG[card.card_rarity as Rarity];
                  return (
                    <div
                      key={`${card.card_id}-${index}`}
                      className="flex w-28 shrink-0 flex-col items-center rounded-xl border border-border bg-surface p-2"
                    >
                      <img
                        src={card.card_image_url}
                        alt={card.card_name}
                        className="mb-2 h-36 w-24 rounded-lg object-cover shadow-warm-sm"
                      />
                      <p className="w-full truncate text-center text-[11px] font-medium text-foreground">
                        {card.card_name}
                      </p>
                      <p
                        className="text-[10px] font-semibold"
                        style={{ color: rarityConfig?.color }}
                      >
                        {rarityConfig?.label ?? card.card_rarity}
                      </p>
                      <p className="text-xs font-bold text-accent">
                        ${Number(card.card_price).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent pulls */}
          {recentPulls.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Rare Pulls</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {recentPulls.map((pull, i) => {
                  const rarityConfig = RARITY_CONFIG[pull.card_rarity as Rarity];
                  return (
                    <motion.div
                      key={`${pull.card_name}-${pull.obtained_at}-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center rounded-xl border border-border bg-surface p-2"
                    >
                      <img
                        src={pull.card_image_url}
                        alt={pull.card_name}
                        className="mb-1.5 h-28 w-20 rounded-lg object-cover shadow-warm-sm"
                      />
                      <p className="w-full truncate text-center text-[10px] font-medium text-foreground">
                        {pull.card_name}
                      </p>
                      <p
                        className="text-[9px] font-semibold"
                        style={{ color: rarityConfig?.color }}
                      >
                        {rarityConfig?.label ?? pull.card_rarity}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}
