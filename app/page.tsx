'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Zap, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto max-w-2xl text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
          <Sparkles className="h-3.5 w-3.5 text-rarity-rare" />
          Real Pokemon TCG pull rates
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
          Open packs.
          <br />
          <span className="bg-gradient-to-r from-rarity-rare via-rarity-ultra to-rarity-special bg-clip-text text-transparent">
            Chase rares.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-lg text-muted">
          Experience the thrill of opening real Pokemon card packs. Authentic
          pull rates, stunning animations, and a growing collection.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97]"
          >
            Get started free
          </Link>
          <Link
            href="/store"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted transition-all hover:border-white/20 hover:text-foreground active:scale-[0.97]"
          >
            Browse packs
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="mx-auto mt-20 grid max-w-3xl gap-4 px-4 sm:grid-cols-3"
      >
        {[
          {
            icon: Zap,
            title: 'Real pull rates',
            desc: 'Odds match actual Pokemon TCG Scarlet & Violet packs',
          },
          {
            icon: Sparkles,
            title: 'Pack animations',
            desc: 'Smooth card reveals with rarity-based effects',
          },
          {
            icon: Layers,
            title: 'Your collection',
            desc: 'Track every card you pull across all sets',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + i * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="rounded-xl border border-border bg-surface/50 p-5"
          >
            <feature.icon className="mb-3 h-5 w-5 text-muted" />
            <h3 className="text-sm font-semibold">{feature.title}</h3>
            <p className="mt-1 text-sm text-muted-dim">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
