'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { Pack } from '@/types';
import Link from 'next/link';

export function PackCard({ pack, index }: { pack: Pack; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={`/pack-opening/${pack.id}`}>
        <div className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-white/10">
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-elevated">
            <img
              src={pack.image_url}
              alt={pack.name}
              className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          </div>

          <div className="p-4">
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight">
              {pack.name}
            </h3>
            <p className="mt-1 text-xs text-muted-dim">
              {pack.cards_per_pack} cards per pack
            </p>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Coins className="h-4 w-4 text-rarity-rare" />
                <span>{pack.price_coins}</span>
              </div>

              <span className="rounded-lg bg-white/5 px-3 py-1 text-xs font-medium text-muted transition-colors group-hover:bg-white group-hover:text-black">
                Open
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
