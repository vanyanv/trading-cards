'use client';

import { motion } from 'framer-motion';
import { RARITY_CONFIG } from '@/lib/constants';
import type { Rarity } from '@/types';

interface RarityCount {
  rarity: string;
  count: number;
}

export function RarityDistributionBar({ data }: { data: RarityCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-6 w-full overflow-hidden rounded-full bg-surface-elevated">
        {data.map((d, i) => {
          const config = RARITY_CONFIG[d.rarity as Rarity];
          const pct = (d.count / total) * 100;
          if (pct === 0) return null;

          return (
            <motion.div
              key={d.rarity}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
              className="group relative h-full cursor-default"
              style={{ backgroundColor: config?.color ?? '#9CA3AF' }}
              title={`${config?.label ?? d.rarity}: ${d.count} (${pct.toFixed(1)}%)`}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-warm-sm transition-opacity group-hover:opacity-100">
                {config?.label ?? d.rarity}: {d.count}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d) => {
          const config = RARITY_CONFIG[d.rarity as Rarity];
          return (
            <div key={d.rarity} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: config?.color ?? '#9CA3AF' }}
              />
              {config?.label ?? d.rarity}
              <span className="font-medium text-foreground">{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
