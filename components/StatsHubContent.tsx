'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Package, Users, Layers, ChevronDown, ChevronRight,
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
    setName: string;
    totalOpens: number;
    stats: { rarity: string; pull_count: number; total_opens: number }[];
    packs: { packId: string; packName: string; packImageUrl: string }[];
  }[];
  recentPulls: {
    card_name: string;
    card_image_url: string;
    card_rarity: string;
    set_name: string;
    display_name: string;
    obtained_at: string;
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
  setName,
  totalOpens,
  stats,
  packs,
}: {
  setName: string;
  totalOpens: number;
  stats: { rarity: string; pull_count: number; total_opens: number }[];
  packs: { packId: string; packName: string; packImageUrl: string }[];
}) {
  const [open, setOpen] = useState(false);
  const maxPulls = Math.max(...stats.map((s) => s.pull_count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {packs.length > 0 && (
            <div className="flex -space-x-2">
              {packs.slice(0, 3).map((pack) => (
                <img
                  key={pack.packId}
                  src={pack.packImageUrl}
                  alt={pack.packName}
                  className="h-10 w-7 rounded-md object-contain border border-border bg-surface-elevated shadow-warm-sm"
                />
              ))}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground block truncate">
              {setName}
            </span>
            <span className="text-[11px] text-muted">
              {totalOpens.toLocaleString()} opens
            </span>
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2.5">
          {packs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
              {packs.map((pack) => (
                <Link
                  key={pack.packId}
                  href={`/pack/${pack.packId}`}
                  className="flex shrink-0 flex-col items-center rounded-lg border border-border bg-surface-elevated p-1.5 transition-colors hover:border-accent/30"
                >
                  <img
                    src={pack.packImageUrl}
                    alt={pack.packName}
                    className="h-16 w-11 rounded object-contain"
                  />
                  <span className="mt-1 w-16 truncate text-center text-[9px] text-muted">
                    {pack.packName}
                  </span>
                </Link>
              ))}
            </div>
          )}
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
          Community pull data across all sets
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
                setName={set.setName}
                totalOpens={set.totalOpens}
                stats={set.stats}
                packs={set.packs}
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
