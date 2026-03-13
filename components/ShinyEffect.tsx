'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { isShinyRarity } from '@/lib/constants';
import { Rarity } from '@/types';

// Simple string hash for deterministic sparkle positioning
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random (mulberry32)
function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ShinyEffectProps {
  rarity: Rarity;
  children?: React.ReactNode;
  className?: string;
  /** Stable string for deterministic sparkle positioning. */
  seed?: string;
  /** When true, renders only overlay layers (no wrapper div around children). */
  asOverlay?: boolean;
}

type ShinyConfig = {
  particleCountDesktop: number;
  particleCountMobile: number;
  maxSize: number;
  particleColor: string;
  particleShadowColor: string;
};

// Subtle tier — Rare, ThreeDiamond
const SUBTLE: ShinyConfig = {
  particleCountDesktop: 3,
  particleCountMobile: 2,
  maxSize: 4,
  particleColor: 'rgba(255, 255, 255, 0.7)',
  particleShadowColor: 'rgba(255, 255, 255, 0.4)',
};

// Mild tier — DoubleRare, FourDiamond
const MILD: ShinyConfig = {
  particleCountDesktop: 5,
  particleCountMobile: 3,
  maxSize: 5,
  particleColor: 'rgba(255, 255, 255, 0.8)',
  particleShadowColor: 'rgba(255, 255, 255, 0.5)',
};

// Medium tier — IllustrationRare, OneStar, OneShiny
const MEDIUM: ShinyConfig = {
  particleCountDesktop: 5,
  particleCountMobile: 3,
  maxSize: 6,
  particleColor: 'rgba(255, 255, 255, 0.85)',
  particleShadowColor: 'rgba(255, 255, 255, 0.6)',
};

// Strong tier — UltraRare, TwoStar, TwoShiny
const STRONG: ShinyConfig = {
  particleCountDesktop: 10,
  particleCountMobile: 6,
  maxSize: 10,
  particleColor: 'rgba(255, 248, 220, 0.95)',
  particleShadowColor: 'rgba(255, 215, 0, 0.7)',
};

// Intense tier — SpecialIllustrationRare, ThreeStar
const INTENSE: ShinyConfig = {
  particleCountDesktop: 12,
  particleCountMobile: 7,
  maxSize: 12,
  particleColor: 'rgba(255, 248, 220, 0.95)',
  particleShadowColor: 'rgba(255, 215, 0, 0.8)',
};

// Maximum tier — HyperRare, Crown
const MAXIMUM: ShinyConfig = {
  particleCountDesktop: 15,
  particleCountMobile: 8,
  maxSize: 14,
  particleColor: 'rgba(255, 248, 220, 1)',
  particleShadowColor: 'rgba(255, 215, 0, 0.9)',
};

const SHINY_CONFIG: Partial<Record<Rarity, ShinyConfig>> = {
  // Standard TCG rarities
  [Rarity.Rare]: SUBTLE,
  [Rarity.DoubleRare]: MILD,
  [Rarity.IllustrationRare]: MEDIUM,
  [Rarity.UltraRare]: STRONG,
  [Rarity.SpecialIllustrationRare]: INTENSE,
  [Rarity.HyperRare]: MAXIMUM,
  // TCG Pocket diamond/star rarities
  [Rarity.ThreeDiamond]: SUBTLE,
  [Rarity.FourDiamond]: MILD,
  [Rarity.OneStar]: MEDIUM,
  [Rarity.TwoStar]: STRONG,
  [Rarity.ThreeStar]: INTENSE,
  [Rarity.Crown]: MAXIMUM,
  // TCG Pocket shiny rarities
  [Rarity.OneShiny]: MEDIUM,
  [Rarity.TwoShiny]: STRONG,
};

export function ShinyEffect({
  rarity,
  children,
  className,
  seed,
  asOverlay = false,
}: ShinyEffectProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  // Early return for non-shiny or reduced motion
  if (!isShinyRarity(rarity) || prefersReducedMotion) {
    return asOverlay ? null : <>{children}</>;
  }

  const config = SHINY_CONFIG[rarity];
  if (!config) {
    return asOverlay ? null : <>{children}</>;
  }

  const sparkles = <SparkleParticles config={config} seed={seed} />;

  if (asOverlay) {
    return sparkles;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      {sparkles}
    </div>
  );
}

function SparkleParticles({
  config,
  seed,
}: {
  config: ShinyConfig;
  seed?: string;
}) {
  const particles = useMemo(() => {
    const hash = hashSeed(seed || 'default');
    const rng = seededRandom(hash);
    const totalDesktop = config.particleCountDesktop;
    const totalMobile = config.particleCountMobile;

    return Array.from({ length: totalDesktop }, (_, i) => ({
      x: rng() * 90 + 5,
      y: rng() * 90 + 5,
      size: 2 + rng() * (config.maxSize - 2),
      delay: rng() * 2.5,
      duration: 1.5 + rng() * 1.5,
      desktopOnly: i >= totalMobile,
    }));
  }, [seed, config.particleCountDesktop, config.particleCountMobile, config.maxSize]);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ borderRadius: 'inherit' }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className={cn(
            'shiny-sparkle absolute',
            p.desktopOnly && 'shiny-sparkle-desktop-only',
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: config.particleColor,
            boxShadow: `0 0 ${p.size * 2}px ${config.particleShadowColor}`,
            clipPath: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
            animation: `shiny-sparkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
