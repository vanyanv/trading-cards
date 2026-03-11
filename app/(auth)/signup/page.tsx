import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-lg font-extrabold text-background">
            P
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Get $10.00 free and start opening packs
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-warm-sm">
          <AuthForm mode="signup" />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
