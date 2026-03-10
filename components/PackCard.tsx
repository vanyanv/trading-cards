'use client';

import { motion } from 'framer-motion';
import { Coins, ArrowRight, Flame } from 'lucide-react';
import type { Pack } from '@/types';
import Link from 'next/link';

export function PackCard({
  pack,
  index,
  showTrending,
}: {
  pack: Pack;
  index: number;
  showTrending?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/pack/${pack.id}`}>
        <div className="group overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:shadow-lg hover:border-muted-dim">
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-elevated">
            <img
              src={pack.image_url}
              alt={pack.name}
              className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            />
            {showTrending && pack.open_count > 0 && (
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-background backdrop-blur-sm">
                <Flame className="h-3 w-3 text-orange-400" />
                {pack.open_count.toLocaleString()}
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-dim">
              {pack.set_name}
            </p>
            <h3 className="mt-1 text-sm font-semibold leading-tight">
              {pack.name}
            </h3>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Coins className="h-3.5 w-3.5 text-muted" />
                <span>{pack.price_coins}</span>
              </div>

              <span className="flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-foreground">
                View
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
