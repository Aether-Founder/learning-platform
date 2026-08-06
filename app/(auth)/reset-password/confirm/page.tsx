/**
 * Password Reset Confirmation Page
 * 
 * User lands here from email link to set new password
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/supabase/auth';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten');
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold">
            Wachtwoord aangepast!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold">
            Nieuw wachtwoord instellen
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kies een sterk wachtwoord voor je account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimaal 6 tekens
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Bevestig nieuw wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Terug naar inloggen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
