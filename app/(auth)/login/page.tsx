/**
 * Login Page
 * 
 * User authentication with email/password
 * Includes redirect to dashboard after successful login
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/auth';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

function LoginPageContent() {
  useRedirectIfAuthenticated();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_draft_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_draft_password') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_draft_email', val);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_draft_password', val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await signIn({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Clear draft on successful login
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_draft_email');
      sessionStorage.removeItem('auth_draft_password');
    }

    // Redirect to dashboard
    router.push(redirectTo);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold">Welkom terug</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in om verder te gaan met studeren
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
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="naam@voorbeeld.nl"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-0 mt-2.5 h-6 w-6 flex items-center justify-center text-sm rounded-md hover:bg-secondary/50"
                  aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-muted-foreground"
              >
                Onthoud mij
              </label>
            </div>

            <Link
              href="/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Wachtwoord vergeten?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Of
              </span>
            </div>
          </div>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Nog geen account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Registreer nu
              </Link>
            </span>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Door in te loggen ga je akkoord met onze{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            voorwaarden
          </Link>{' '}
          en{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            privacybeleid
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background" aria-label="Inlogpagina laden" />}
    >
      <LoginPageContent />
    </Suspense>
  );
}
