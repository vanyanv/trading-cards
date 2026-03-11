'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Gem, Crown, TrendingUp, TrendingDown } from 'lucide-react';
import { RARITY_CONFIG } from '@/lib/constants';
import type { Rarity } from '@/types';

export interface RarityBreakdown {
  rarity: string;
  count: number;
  totalValue: number;
}

export interface CollectionStats {
  totalValue: number;
  totalCards: number;
  uniqueCards: number;
  averageValue: number;
  mostValuableCard: { name: string; price: number } | null;
  rarityBreakdown: RarityBreakdown[];
  trendUp: number;
  trendDown: number;
}

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function CollectionValueHeader({ stats }: { stats: CollectionStats }) {
  const netTrend = stats.trendUp - stats.trendDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-warm-sm"
    >
      {/* Top section: Title + Total value */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Wallet className="h-4 w-4 text-accent" />
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight">Your Vault</h1>
          </div>
          <p className="text-sm text-muted mt-0.5">Portfolio value based on current market prices</p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">Total Value</p>
          <p className="font-heading text-3xl font-extrabold tracking-tight text-accent sm:text-4xl">
            <AnimatedCounter value={stats.totalValue} prefix="$" />
          </p>
          {netTrend !== 0 && (
            <div className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium ${netTrend > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {netTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(netTrend)} card{Math.abs(netTrend) !== 1 ? 's' : ''} trending {netTrend > 0 ? 'up' : 'down'}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-elevated px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Total Cards</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{stats.totalCards}</p>
        </div>
        <div className="rounded-xl bg-surface-elevated px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Unique</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{stats.uniqueCards}</p>
        </div>
        <div className="rounded-xl bg-surface-elevated px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Avg Value</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">${stats.averageValue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-surface-elevated px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Top Card</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-accent" />
            <p className="truncate text-sm font-bold">
              {stats.mostValuableCard ? stats.mostValuableCard.name : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Rarity breakdown */}
      {stats.rarityBreakdown.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.rarityBreakdown.map((rb, i) => {
            const config = RARITY_CONFIG[rb.rarity as Rarity];
            if (!config) return null;
            return (
              <motion.div
                key={rb.rarity}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-1.5 rounded-lg bg-surface-elevated px-2.5 py-1.5"
              >
                <Gem className="h-3 w-3" style={{ color: config.color }} />
                <span className="text-xs font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-[10px] tabular-nums text-muted">
                  {rb.count} &middot; ${rb.totalValue.toFixed(0)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
