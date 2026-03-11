'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AVATARS, getAvatar } from '@/lib/avatars';
import { cn } from '@/lib/cn';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('pokeball');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? '');
        setAvatarId(data.avatar_id ?? 'pokeball');
      } else {
        setDisplayName(user.email?.split('@')[0] ?? '');
      }
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, avatar_id: avatarId }),
      });
      if (res.ok) {
        setSaved(true);
        // Notify navbar
        window.dispatchEvent(
          new CustomEvent('profile-update', {
            detail: { display_name: displayName, avatar_id: avatarId },
          })
        );
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="spinner" />
      </div>
    );
  }

  const currentAvatar = getAvatar(avatarId);

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8"
      >
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted">Customize your trainer profile</p>

        {/* Current avatar preview */}
        <div className="mt-10 flex items-center gap-4">
          <div className={cn('flex h-16 w-16 items-center justify-center rounded-full text-2xl', currentAvatar.bg)}>
            {currentAvatar.emoji}
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-foreground">
              {displayName || 'Trainer'}
            </p>
            <p className="text-xs text-muted">Pokemon Trainer</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="mt-8">
          <label
            htmlFor="displayName"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-muted-dim transition-colors focus:border-accent focus:outline-none"
            placeholder="Your trainer name"
          />
          <p className="mt-1 text-[10px] text-muted-dim">{displayName.length}/20 characters</p>
        </div>

        {/* Avatar Picker */}
        <div className="mt-8">
          <label className="mb-3 block text-xs font-medium text-muted">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setAvatarId(avatar.id)}
                className={cn(
                  'group relative flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl transition-all hover:scale-105',
                  avatarId === avatar.id
                    ? 'border-accent shadow-warm-md'
                    : 'border-border hover:border-accent/30'
                )}
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', avatar.bg)}>
                  {avatar.emoji}
                </span>
                {avatarId === avatar.id && (
                  <motion.div
                    layoutId="avatar-check"
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent"
                  >
                    <Check className="h-2.5 w-2.5 text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="mt-10 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-all',
              'hover:opacity-85 active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-medium text-green-600"
            >
              Saved!
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
