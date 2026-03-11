'use client';

import { motion } from 'framer-motion';
import {
  Check,
  DollarSign,
  Lock,
  Package,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Card } from '@/types';

type FeaturedCard = Pick<Card, 'id' | 'name' | 'image_url' | 'image_url_hires' | 'rarity'>;

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const OPTIONS = [
  {
    icon: DollarSign,
    title: 'Sell',
    description: 'Cash out instantly at market value',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
    color: '#22C55E',
  },
  {
    icon: Lock,
    title: 'Vault',
    description: 'Store safely in our secure vault',
    bg: 'rgba(200,151,46,0.1)',
    border: 'rgba(200,151,46,0.25)',
    color: '#C8972E',
  },
  {
    icon: Package,
    title: 'Ship',
    description: 'Deliver straight to your door',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.25)',
    color: '#3B82F6',
  },
] as const;

const TRUST_BADGES = [
  'Real Physical Cards',
  'Instant Cash Out',
  'Vault or Ship',
];

export function ValuePropStorytelling({ cards: _cards }: { cards: FeaturedCard[] }) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="py-16 text-center sm:py-20 lg:py-24"
    >
      <motion.span
        variants={fadeUp}
        className="mb-5 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent"
      >
        Early Access
      </motion.span>

      <motion.h2
        variants={fadeUp}
        className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
      >
        The Future of Collecting
        <br />
        <span className="text-accent">Starts Now</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
      >
        Get VIP early access to rip packs that represent real, physical cards.
        Sell them for instant cash, store them in our vault, or ship &rsquo;em
        straight to your door.
      </motion.p>

      <motion.div
        variants={fadeUp}
        className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
      >
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge}
            className="flex items-center gap-2 text-sm text-muted"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
              <Check className="h-3.5 w-3.5 text-accent" />
            </span>
            {badge}
          </div>
        ))}
      </motion.div>

      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
              className="rounded-2xl border border-border bg-surface p-6 transition-all hover:shadow-warm-md sm:p-8"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = opt.border;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '';
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: opt.bg }}
              >
                <Icon className="h-6 w-6" style={{ color: opt.color }} />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {opt.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {opt.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.6, ease }}
        className="mt-10"
      >
        <Link
          href="/browse"
          className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-warm-md transition-all hover:bg-accent-hover hover:shadow-warm-lg"
        >
          Start Opening
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.section>
  );
}
