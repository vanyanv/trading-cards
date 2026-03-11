'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Package, Users, Layers, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, BarChart3,
} from 'lucide-react';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Rarity } from '@/types';

interface StatsHubProps {
  globalSummary: {
    total_packs_opened: number;
    total_cards_pulled: number;
    total_users: number;
  };
  topSets: {
    setId: string;
    totalOpens: number;
    stats: { rarity: string; pull_count: number; total_opens: number }[];
  }[];
  recentPulls: {
    card_name: string;
    card_image_url: string;
    card_rarity: string;
    set_name: string;
    display_name: string;
    obtained_at: string;
  }[];
  userLuckStats?: {
    rarity: string;
    user_count: number;
    user_total: number;
    community_rate: number;
  }[];
  userPackBreakdown?: {
    pack_id: string;
    pack_name: string;
    pack_image_url: string;
    set_name: string;
    times_opened: number;
  }[];
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

function SetPullRates({
  setId,
  totalOpens,
  stats,
}: {
  setId: string;
  totalOpens: number;
  stats: { rarity: string; pull_count: number; total_opens: number }[];
}) {
  const [open, setOpen] = useState(false);
  const maxPulls = Math.max(...stats.map((s) => s.pull_count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{setId}</span>
          <span className="text-xs text-muted">
            {totalOpens.toLocaleString()} opens
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2.5">
          {[...stats]
            .sort((a, b) => b.pull_count - a.pull_count)
            .map((stat) => {
              const config = RARITY_CONFIG[stat.rarity as Rarity];
              const pct = (stat.pull_count / maxPulls) * 100;
              const oneInX = stat.total_opens > 0 && stat.pull_count > 0
                ? Math.round(stat.total_opens / stat.pull_count)
                : null;
              const ratePct = stat.total_opens > 0
                ? ((stat.pull_count / stat.total_opens) * 100).toFixed(1)
                : '0';

              return (
                <div key={stat.rarity} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <RarityBadge rarity={stat.rarity as Rarity} />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: config?.color ?? '#9CA3AF',
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="w-12 shrink-0 text-right text-xs font-bold tabular-nums"
                    style={{ color: config?.color ?? '#9CA3AF' }}
                  >
                    {ratePct}%
                  </span>
                  {oneInX && (
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted">
                      1 in {oneInX}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function StatsHubContent({
  globalSummary,
  topSets,
  recentPulls,
  userLuckStats,
  userPackBreakdown,
}: StatsHubProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10"
    >
      {/* Page header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Pull Rate Stats
        </h1>
        <p className="mt-1 text-sm text-muted">
          Community pull data and personal tracking
        </p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Package}
          label="Total Packs Opened"
          value={globalSummary.total_packs_opened.toLocaleString()}
        />
        <StatCard
          icon={Layers}
          label="Total Cards Pulled"
          value={globalSummary.total_cards_pulled.toLocaleString()}
        />
        <StatCard
          icon={Users}
          label="Active Collectors"
          value={globalSummary.total_users.toLocaleString()}
        />
      </div>

      {/* Personal stats (authenticated only) */}
      {userLuckStats && userLuckStats.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Your Luck</h2>
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
            {userLuckStats.map((stat) => {
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

      {/* Personal pack breakdown */}
      {userPackBreakdown && userPackBreakdown.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Your Packs Opened</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {userPackBreakdown.map((pack) => (
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

      {/* Community pull rates by set */}
      {topSets.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Community Pull Rates by Set
          </h2>
          <div className="space-y-2">
            {topSets.map((set) => (
              <SetPullRates
                key={set.setId}
                setId={set.setId}
                totalOpens={set.totalOpens}
                stats={set.stats}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent community pulls */}
      {recentPulls.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Recent Community Pulls
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recentPulls.map((pull, i) => {
              const rarityConfig = RARITY_CONFIG[pull.card_rarity as Rarity];
              return (
                <motion.div
                  key={`${pull.card_name}-${pull.obtained_at}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
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
                  <p className="text-[9px] text-muted">
                    {pull.display_name} · {timeAgo(pull.obtained_at)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
}
