'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Flame } from 'lucide-react';
import type { Pack, Edition } from '@/types';
import { EDITION_CONFIG } from '@/lib/constants';
import Link from 'next/link';

function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
}

export function PackCard({
  pack,
  index,
  showTrending,
}: {
  pack: Pack;
  index: number;
  showTrending?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }

  const packIsNew = isNew(pack.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/pack/${pack.id}`}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="pack-card-glow group overflow-hidden rounded-2xl border border-border bg-surface shadow-warm-sm transition-transform duration-300 ease-out"
          style={{
            transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? -4 : 0}px)`,
          }}
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-elevated">
            {(pack.featured_card_image || pack.image_url) && (
              <img
                src={pack.featured_card_image || pack.image_url}
                alt={pack.name}
                className={`h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.07] ${pack.featured_card_image ? 'object-cover' : 'object-contain p-5'}`}
              />
            )}
            {showTrending && pack.open_count > 0 && (
              <div className="shimmer-badge absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                <Flame className="h-3 w-3" />
                {pack.open_count.toLocaleString()}
              </div>
            )}
            {packIsNew && !showTrending && (
              <div className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                New
              </div>
            )}
            {pack.edition && (
              <div
                className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${EDITION_CONFIG[pack.edition as Edition].badgeClass}`}
              >
                {EDITION_CONFIG[pack.edition as Edition].shortLabel}
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-dim">
              {pack.set_name}
            </p>
            <h3 className="mt-1.5 font-heading text-sm font-bold leading-tight text-foreground">
              {pack.name}
            </h3>

            <div className="mt-3.5 flex items-center justify-between border-t border-border-subtle pt-3">
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                <span>{pack.price_usd?.toFixed(2) ?? '—'}</span>
              </div>

              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-dim transition-colors group-hover:text-accent">
                View
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>

          {/* Radial glow beneath on hover */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-12 w-3/4 rounded-full opacity-40 blur-xl"
              style={{ background: 'var(--color-accent-glow)' }}
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
}
