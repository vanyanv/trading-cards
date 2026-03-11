'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, ChevronDown } from 'lucide-react';
import type { UnopenedPack } from '@/types';

export function UnopenedPacksSection({ packs }: { packs: UnopenedPack[] }) {
  const [collapsed, setCollapsed] = useState(true);

  if (packs.length === 0) return null;

  return (
    <div
      className={`mb-8 rounded-2xl border p-5 transition-shadow duration-700 ${collapsed ? 'animate-[unopened-glow_2.5s_ease-in-out_3]' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.06), rgba(124,58,237,0.06))',
        borderColor: 'rgba(234,179,8,0.2)',
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <Package className="h-5 w-5 text-yellow-500" />
        <h2 className="text-base font-bold text-foreground">Unopened Packs</h2>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: 'rgba(234,179,8,0.15)',
            color: '#eab308',
          }}
        >
          {packs.length} {packs.length === 1 ? 'pack' : 'packs'}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-muted transition-transform ${collapsed ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsed && <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
        {packs.map((pack) => (
          <Link
            key={pack.id}
            href={`/pack-opening/${pack.pack_id}?unopenedId=${pack.id}`}
            className="group flex-shrink-0"
          >
            <div className="w-36 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center transition-all group-hover:border-yellow-500/30 group-hover:bg-white/[0.06]">
              {/* Pack image */}
              <div className="relative mx-auto mb-3 h-28 w-20 overflow-hidden rounded-lg shadow-lg">
                {pack.pack?.image_url ? (
                  <img
                    src={pack.pack.image_url}
                    alt={pack.pack?.name || 'Pack'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-purple-800 to-purple-950">
                    <Package className="h-8 w-8 text-purple-300" />
                  </div>
                )}
              </div>

              {/* Pack info */}
              <p className="truncate text-xs font-semibold text-foreground">
                {pack.pack?.name || 'Pack'}
              </p>
              {pack.pack?.edition && (
                <p className="mt-0.5 text-[10px] text-muted">
                  {pack.pack.edition.replace('-', ' ')}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-muted">
                {pack.pack?.cards_per_pack || 10} cards
              </p>

              {/* Open button */}
              <div className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity group-hover:opacity-90">
                Open
              </div>
            </div>
          </Link>
        ))}
      </div>}
    </div>
  );
}
