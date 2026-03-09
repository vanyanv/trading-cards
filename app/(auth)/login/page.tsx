import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to open packs and view your collection
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <AuthForm mode="login" />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-white"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
