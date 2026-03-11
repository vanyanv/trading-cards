'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG, RARITY_ANIMATION_CONFIG } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import type { PulledCard, Rarity, Edition } from '@/types';
import { EDITION_CONFIG } from '@/lib/constants';
import type { ParticleType } from '@/lib/constants';
import { ImmersiveCard } from './ImmersiveCard';
import { TypeRevealEffect } from './TypeRevealEffect';
import { RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';

type Phase = 'sealed' | 'shaking' | 'opening' | 'card-reveal' | 'complete';

interface ActiveParticle {
  id: string;
  type: ParticleType;
  color: string;
}

// --------------- Particle Burst ---------------
function ParticleBurst({ type, color }: { type: ParticleType; color: string }) {
  const counts: Record<string, number> = { sparkle: 8, burst: 16, explosion: 30, shower: 50 };
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = Math.floor((counts[type] || 0) * (isMobile ? 0.5 : 1));

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i + (Math.random() * 20 - 10);
        const distance = type === 'shower' ? 200 + Math.random() * 150 : 60 + Math.random() * 100;
        const size = type === 'shower' ? 3 + Math.random() * 5 : 2 + Math.random() * 4;
        const duration = type === 'shower' ? 1.2 + Math.random() * 0.8 : 0.5 + Math.random() * 0.4;
        return { angle, distance, size, duration, delay: Math.random() * 0.15 };
      }),
    [count, type]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 3}px ${color}`,
            willChange: 'transform, opacity',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// --------------- Golden Shower (viewport-level) ---------------
function GoldenShower({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        x: Math.random() * 100,
        size: 3 + Math.random() * 6,
        duration: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 60,
        opacity: 0.4 + Math.random() * 0.6,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            willChange: 'transform, opacity',
          }}
          initial={{ y: 0, x: 0, opacity: p.opacity }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 40 : 900,
            x: p.drift,
            opacity: 0,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// --------------- Holographic Card Wrapper ---------------
function HoloCard({
  children,
  isActive,
  className,
}: {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [holoStyle, setHoloStyle] = useState<React.CSSProperties>({});

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isActive || !cardRef.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = cardRef.current!.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
        const rotateX = (y - 0.5) * -12;
        const rotateY = (x - 0.5) * 12;
        setHoloStyle({
          transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          '--holo-angle': `${angle}deg`,
          '--holo-x': `${x * 100}%`,
        } as React.CSSProperties);
      });
    },
    [isActive]
  );

  const handleLeave = useCallback(() => {
    setHoloStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.4s ease-out',
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn('relative', className)}
      style={{
        ...holoStyle,
        willChange: isActive ? 'transform' : undefined,
        transition: holoStyle.transition || 'transform 0.1s ease-out',
      }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        handleMove(t.clientX, t.clientY);
      }}
      onMouseLeave={handleLeave}
    >
      {children}
      <div
        className={cn('holo-overlay', isActive && 'active')}
        style={holoStyle}
      />
    </div>
  );
}

// --------------- Pre-Reveal Crack Effect ---------------
function CrackEffect({ color }: { color: string }) {
  const angles = [25, -40, 75];
  return (
    <>
      <motion.div
        className="absolute inset-0 z-10 rounded-xl"
        style={{
          background: `radial-gradient(circle, ${color}40 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.4, 0.9] }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      {angles.map((angle, j) => (
        <motion.div
          key={j}
          className="absolute left-1/2 top-1/2 z-20 h-[2px] w-3/4 origin-center"
          style={{
            backgroundColor: color,
            rotate: `${angle}deg`,
            translateX: '-50%',
            translateY: '-50%',
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}40`,
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 1, 0.7] }}
          transition={{ duration: 0.6, delay: j * 0.15, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// --------------- Booster Pack Visual ---------------
const BOOSTER_THEMES: Record<string, { gradient: string; accent: string }> = {
  mewtwo: { gradient: 'from-purple-900 via-purple-700 to-indigo-900', accent: '#A78BFA' },
  charizard: { gradient: 'from-orange-900 via-red-700 to-amber-900', accent: '#FB923C' },
  pikachu: { gradient: 'from-yellow-700 via-amber-500 to-yellow-900', accent: '#FACC15' },
  mew: { gradient: 'from-pink-800 via-pink-600 to-rose-900', accent: '#F472B6' },
  dialga: { gradient: 'from-blue-900 via-blue-700 to-cyan-900', accent: '#60A5FA' },
  palkia: { gradient: 'from-fuchsia-900 via-purple-700 to-pink-900', accent: '#E879F9' },
  arceus: { gradient: 'from-amber-800 via-yellow-600 to-amber-900', accent: '#FCD34D' },
  celebi: { gradient: 'from-emerald-900 via-green-700 to-teal-900', accent: '#34D399' },
  lugia: { gradient: 'from-sky-900 via-slate-600 to-blue-900', accent: '#7DD3FC' },
  buzzwole: { gradient: 'from-red-900 via-rose-700 to-orange-900', accent: '#FB7185' },
  default: { gradient: 'from-slate-900 via-slate-700 to-slate-900', accent: '#94A3B8' },
};

function getBoosterTheme(packName: string) {
  const lower = packName.toLowerCase();
  for (const [key, theme] of Object.entries(BOOSTER_THEMES)) {
    if (key !== 'default' && lower.includes(key)) return theme;
  }
  return BOOSTER_THEMES.default;
}

function BoosterPackVisual({ packName, packImage, edition }: { packName: string; packImage: string; edition?: Edition | null }) {
  const theme = getBoosterTheme(packName);
  const boosterName = packName.includes(' - ') ? packName.split(' - ').pop() : packName;
  const setName = packName.includes(' - ') ? packName.split(' - ')[0] : '';

  return (
    <div
      className="spotlight-border"
      style={{ '--rarity-color': theme.accent } as React.CSSProperties}
    >
      <div className={`relative h-96 w-64 overflow-hidden rounded-[13px] bg-gradient-to-b ${theme.gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={packImage}
            alt={packName}
            className="h-[80%] w-auto drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
            loading="eager"
          />
        </div>
        {setName && (
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
              {setName}
            </span>
          </div>
        )}
        {edition && (
          <div className="absolute top-4 right-3 z-10">
            <span
              className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider shadow-lg ${EDITION_CONFIG[edition].badgeClass}`}
            >
              {EDITION_CONFIG[edition].label}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
          <p
            className="text-center font-heading text-xl font-extrabold tracking-wide text-white"
            style={{ textShadow: `0 0 20px ${theme.accent}80` }}
          >
            {boosterName}
          </p>
          <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Booster Pack
          </p>
        </div>
      </div>
    </div>
  );
}

// =============== MAIN COMPONENT ===============
export function PackOpeningAnimation({
  cards,
  packName,
  packImage,
  packCost,
  onOpenAnother,
  edition,
}: {
  cards: PulledCard[];
  packName: string;
  packImage: string;
  packCost?: number;
  onOpenAnother: () => void;
  edition?: Edition | null;
}) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showPreRevealGlow, setShowPreRevealGlow] = useState(false);
  const [activeParticles, setActiveParticles] = useState<ActiveParticle[]>([]);
  const [screenShaking, setScreenShaking] = useState(false);
  const [screenFlashColor, setScreenFlashColor] = useState<string | null>(null);
  const [showShower, setShowShower] = useState(false);
  const [immersiveCard, setImmersiveCard] = useState<PulledCard | null>(null);
  const [typeRevealing, setTypeRevealing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Preload all card images to prevent blank flashes during reveal
  useEffect(() => {
    const urls = cards.map(c => c.image_url_hires || c.image_url);
    const uniqueUrls = [...new Set(urls)];
    uniqueUrls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, [cards]);

  // Order cards by slot_number (like a real pack)
  const orderedCards = useMemo(
    () => [...cards].sort((a, b) => a.slot_number - b.slot_number),
    [cards]
  );

  // Best pull for summary + pack glow color
  const bestPull = useMemo(
    () => [...cards].sort((a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity)).pop()!,
    [cards]
  );
  const bestConfig = RARITY_CONFIG[bestPull.rarity as Rarity];
  const bestAnimConfig = RARITY_ANIMATION_CONFIG[bestPull.rarity as Rarity];

  // Current card during reveal
  const currentCard = orderedCards[currentCardIndex];
  const currentConfig = currentCard ? RARITY_CONFIG[currentCard.rarity as Rarity] : null;
  const currentAnimConfig = currentCard ? RARITY_ANIMATION_CONFIG[currentCard.rarity as Rarity] : null;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // Pre-reveal glow: starts when a new card appears (for non-common)
  useEffect(() => {
    if (phase !== 'card-reveal' || cardFlipped) return;
    if (!currentAnimConfig || currentAnimConfig.tier === 'common') {
      setShowPreRevealGlow(false);
      return;
    }

    setShowPreRevealGlow(false);
    const id = setTimeout(() => {
      setShowPreRevealGlow(true);
    }, currentAnimConfig.preRevealDelay);

    return () => clearTimeout(id);
  }, [phase, currentCardIndex, cardFlipped, currentAnimConfig]);

  const startOpening = useCallback(() => {
    setPhase('shaking');
    addTimer(() => setPhase('opening'), 1200);
    addTimer(() => {
      setPhase('card-reveal');
      setCurrentCardIndex(0);
      setCardFlipped(false);
    }, 2000);
  }, [addTimer]);

  const flipCurrentCard = useCallback(() => {
    if (cardFlipped || !currentCard || !currentConfig || !currentAnimConfig) return;

    setCardFlipped(true);
    setShowPreRevealGlow(false);

    // Type reveal effect for rare+ cards
    if (rarityOrder(currentCard.rarity) >= 3) {
      setTypeRevealing(true);
      addTimer(() => setTypeRevealing(false), 1200);
    }

    // Screen shake
    if (currentAnimConfig.screenShake) {
      setScreenShaking(true);
      addTimer(() => setScreenShaking(false), 500);
    }

    // Screen flash
    if (currentAnimConfig.screenFlash) {
      setScreenFlashColor(currentConfig.color);
      addTimer(() => setScreenFlashColor(null), 600);
    }

    // Particles
    if (currentAnimConfig.particles !== 'none') {
      const particleId = `p-${currentCardIndex}-${Date.now()}`;
      setActiveParticles([{
        id: particleId,
        type: currentAnimConfig.particles,
        color: currentConfig.color,
      }]);
      addTimer(() => setActiveParticles([]), 2000);
    }

    // Golden shower for hyper rare
    if (currentAnimConfig.particles === 'shower') {
      setShowShower(true);
      addTimer(() => setShowShower(false), 3000);
    }

    // Auto-trigger immersive view for ultra-tier cards
    if (currentAnimConfig.showImmersive) {
      addTimer(() => {
        setImmersiveCard(currentCard);
      }, (currentAnimConfig.flipDuration * 1000) + 500);
    }
  }, [cardFlipped, currentCard, currentConfig, currentAnimConfig, currentCardIndex, addTimer]);

  const advanceToNextCard = useCallback(() => {
    const nextIndex = currentCardIndex + 1;
    if (nextIndex >= orderedCards.length) {
      setPhase('complete');
    } else {
      setCurrentCardIndex(nextIndex);
      setCardFlipped(false);
      setShowPreRevealGlow(false);
      setActiveParticles([]);
      setTypeRevealing(false);
    }
  }, [currentCardIndex, orderedCards.length]);

  const handleCardTap = useCallback(() => {
    if (!cardFlipped) {
      flipCurrentCard();
    } else if (!immersiveCard) {
      advanceToNextCard();
    }
  }, [cardFlipped, flipCurrentCard, advanceToNextCard, immersiveCard]);

  const handleRevealAll = useCallback(() => {
    setPhase('complete');
  }, []);

  const handleImmersiveClose = useCallback(() => {
    setImmersiveCard(null);
    addTimer(() => advanceToNextCard(), 300);
  }, [advanceToNextCard, addTimer]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4',
        screenShaking && 'screen-shake'
      )}
    >
      {/* Screen flash overlay */}
      <AnimatePresence>
        {screenFlashColor && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50"
            style={{
              background: `radial-gradient(circle, ${screenFlashColor}30 0%, ${screenFlashColor}10 40%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Golden shower for hyper rare */}
      <AnimatePresence>
        {showShower && currentConfig && <GoldenShower color={currentConfig.color} />}
      </AnimatePresence>

      {/* Opening flash */}
      <AnimatePresence>
        {phase === 'opening' && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50"
            style={{
              background: bestConfig
                ? `radial-gradient(circle, ${bestConfig.color}20 0%, rgba(250,250,247,0.9) 70%)`
                : 'radial-gradient(circle, rgba(200,151,46,0.15) 0%, rgba(250,250,247,0.9) 70%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* =============== SEALED + SHAKING + OPENING =============== */}
        {(phase === 'sealed' || phase === 'shaking' || phase === 'opening') && (
          <motion.div
            key="pack"
            className="flex flex-col items-center"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative cursor-pointer"
              onClick={phase === 'sealed' ? startOpening : undefined}
              animate={
                phase === 'shaking'
                  ? {
                      rotate: [0, -2, 2, -3, 3, -5, 5, -3, 0],
                      scaleX: [1, 1, 1, 1, 1, 1, 1, 1.03, 1],
                      transition: { duration: 1.2, ease: 'easeInOut' },
                    }
                  : phase === 'opening'
                    ? {
                        scale: [1, 1.08, 0],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.6, ease: 'easeIn' },
                      }
                    : {}
              }
            >
              {/* Pulse ring */}
              {phase === 'sealed' && (
                <motion.div
                  className="absolute -inset-3 rounded-2xl border border-accent/30"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Rarity glow buildup during shake */}
              {phase === 'shaking' && bestConfig && (
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  style={{
                    boxShadow: `0 0 40px ${bestConfig.color}40, 0 0 80px ${bestConfig.color}20`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0.6, 0.8] }}
                  transition={{ duration: 1.2, ease: 'easeIn' }}
                />
              )}

              <BoosterPackVisual packName={packName} packImage={packImage} edition={edition} />
            </motion.div>

            {phase === 'sealed' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-sm text-muted"
              >
                Tap to open
              </motion.p>
            )}
          </motion.div>
        )}

        {/* =============== CARD-BY-CARD REVEAL =============== */}
        {phase === 'card-reveal' && currentCard && currentConfig && currentAnimConfig && (
          <motion.div
            key="card-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full flex-col items-center"
          >
            {/* Header: card counter + reveal all */}
            <div className="mb-6 flex w-full max-w-sm items-center justify-between px-2">
              <span className="font-heading text-sm font-semibold text-muted">
                {currentCardIndex + 1}
                <span className="text-muted-dim"> / {orderedCards.length}</span>
              </span>
              <button
                onClick={handleRevealAll}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                Reveal All
              </button>
            </div>

            {/* Single card reveal area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCardIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="perspective-1000 cursor-pointer"
                onClick={handleCardTap}
              >
                <HoloCard isActive={cardFlipped && rarityOrder(currentCard.rarity) >= 2}>
                  <div className="preserve-3d relative aspect-[2.5/3.5] w-64 sm:w-72">
                    <motion.div
                      className="preserve-3d relative h-full w-full"
                      initial={{ rotateY: 180 }}
                      animate={cardFlipped ? { rotateY: 0 } : { rotateY: 180 }}
                      transition={{
                        duration: currentAnimConfig.flipDuration,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {/* ---- Front face ---- */}
                      <div
                        className={cn(
                          'backface-hidden absolute inset-0 overflow-hidden rounded-xl border',
                          cardFlipped ? currentConfig.borderClass : 'border-border'
                        )}
                      >
                        <img
                          src={currentCard.image_url_hires || currentCard.image_url}
                          alt={currentCard.name}
                          className="h-full w-full object-contain"
                        />
                        {currentCard.is_reverse_holo && (
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" />
                        )}
                        {/* Reveal flash */}
                        {cardFlipped && (
                          <motion.div
                            className="pointer-events-none absolute inset-0 z-20 rounded-xl"
                            style={{
                              background:
                                currentAnimConfig.tier === 'common'
                                  ? 'radial-gradient(circle, rgba(200,151,46,0.15) 0%, rgba(255,255,255,0.3) 60%)'
                                  : `radial-gradient(circle, ${currentConfig.color}30 0%, ${currentConfig.color}10 40%, transparent 70%)`,
                            }}
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        )}
                        {/* Type reveal effect */}
                        <TypeRevealEffect types={currentCard.types} active={typeRevealing} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                          <p className="truncate text-sm font-medium text-white">
                            {currentCard.name}
                          </p>
                          <RarityBadge
                            rarity={currentCard.rarity as Rarity}
                            className="mt-0.5 text-[10px]"
                          />
                        </div>
                      </div>

                      {/* ---- Back face ---- */}
                      <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-xl border border-border bg-surface-elevated">
                        <div className="flex h-full items-center justify-center">
                          <div className="h-20 w-20 rounded-full border border-border bg-surface" />
                        </div>
                        <div className="absolute inset-2 rounded-lg border border-border/50" />

                        {/* Pre-reveal glow */}
                        {showPreRevealGlow && currentAnimConfig.glowIntensity > 0 && (
                          <motion.div
                            className={cn(
                              'absolute -inset-1 z-10 rounded-xl',
                              currentAnimConfig.glowPulse && 'glow-pulse'
                            )}
                            style={{
                              boxShadow: `0 0 20px ${currentConfig.color}${Math.round(currentAnimConfig.glowIntensity * 255).toString(16).padStart(2, '0')}, 0 0 40px ${currentConfig.color}${Math.round(currentAnimConfig.glowIntensity * 0.5 * 255).toString(16).padStart(2, '0')}`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: currentAnimConfig.glowIntensity }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        )}

                        {/* Crack effect for ultra tier */}
                        {showPreRevealGlow && currentAnimConfig.crackEffect && (
                          <CrackEffect color={currentConfig.color} />
                        )}
                      </div>
                    </motion.div>

                    {/* Particles */}
                    {activeParticles.map((p) => (
                      <ParticleBurst key={p.id} type={p.type} color={p.color} />
                    ))}
                  </div>
                </HoloCard>
              </motion.div>
            </AnimatePresence>

            {/* Prompt text */}
            <motion.p
              key={cardFlipped ? 'next' : 'reveal'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: cardFlipped ? 0.3 : 0.5 }}
              className="mt-6 text-sm text-muted"
            >
              {cardFlipped ? 'Tap for next card' : 'Tap to reveal'}
            </motion.p>

            {/* Progress dots */}
            <div className="mt-4 flex gap-1.5">
              {orderedCards.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all duration-300',
                    i < currentCardIndex
                      ? 'bg-accent'
                      : i === currentCardIndex
                        ? 'bg-foreground scale-125'
                        : 'bg-border'
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* =============== COMPLETE / SUMMARY =============== */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {orderedCards.map((card, i) => {
                const config = RARITY_CONFIG[card.rarity as Rarity];
                const isHoloEligible = rarityOrder(card.rarity) >= 2;

                return (
                  <motion.div
                    key={`${card.id}-${i}`}
                    className="perspective-1000"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <HoloCard isActive={isHoloEligible}>
                      <div
                        className={cn(
                          'relative aspect-[2.5/3.5] cursor-pointer',
                          isHoloEligible && 'cursor-pointer'
                        )}
                        onClick={() => {
                          if (rarityOrder(card.rarity) >= 2) setImmersiveCard(card);
                        }}
                      >
                        <div
                          className={cn(
                            'absolute inset-0 overflow-hidden rounded-xl border',
                            config.borderClass
                          )}
                        >
                          <img
                            src={card.image_url_hires || card.image_url}
                            alt={card.name}
                            className="h-full w-full object-contain"
                          />
                          {card.is_reverse_holo && (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                            <p className="truncate text-xs font-medium text-white">
                              {card.name}
                            </p>
                            <RarityBadge
                              rarity={card.rarity as Rarity}
                              className="mt-0.5 text-[9px]"
                            />
                          </div>
                        </div>
                      </div>
                    </HoloCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Completion summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col items-center gap-6"
            >
              <div className="h-px w-16 bg-border" />

              {/* Best pull spotlight */}
              {rarityOrder(bestPull.rarity) >= 2 && (
                <div className="flex flex-col items-center gap-4">
                  <motion.p
                    className="font-heading text-lg font-bold"
                    style={{ color: bestConfig.color }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    Best pull: {bestConfig.label}!
                  </motion.p>

                  {rarityOrder(bestPull.rarity) >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <div
                        className="spotlight-border"
                        style={
                          {
                            '--rarity-color': bestConfig.color,
                          } as React.CSSProperties
                        }
                      >
                        <div className="overflow-hidden rounded-[13px] bg-surface">
                          <div className="relative h-48 w-36 sm:h-56 sm:w-40">
                            <img
                              src={bestPull.image_url_hires || bestPull.image_url}
                              alt={bestPull.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs font-medium text-foreground">
                        {bestPull.name}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={onOpenAnother}
                  className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 active:opacity-70"
                >
                  <RotateCcw className="h-4 w-4" />
                  Open another
                </button>
                <Link
                  href="/collection"
                  className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
                >
                  Collection
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive card overlay */}
      <AnimatePresence>
        {immersiveCard && (
          <ImmersiveCard
            card={immersiveCard}
            onClose={phase === 'card-reveal' ? handleImmersiveClose : () => setImmersiveCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
