import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Get 500 coins free and start opening packs
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
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
