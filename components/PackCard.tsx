'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { Pack } from '@/types';
import Link from 'next/link';

export function PackCard({ pack, index }: { pack: Pack; index: number }) {
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
      <Link href={`/pack-opening/${pack.id}`}>
        <div className="group overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:shadow-md hover:border-muted-dim">
          <div className="aspect-[3/4] overflow-hidden bg-surface-elevated">
            <img
              src={pack.image_url}
              alt={pack.name}
              className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>

          <div className="p-4">
            <h3 className="text-sm font-semibold leading-tight">
              {pack.name}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {pack.cards_per_pack} cards per pack
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Coins className="h-3.5 w-3.5 text-muted" />
                <span>{pack.price_coins}</span>
              </div>

              <span className="rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity group-hover:opacity-80">
                Open
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
