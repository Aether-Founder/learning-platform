/**
 * Register Page
 *
 * New user registration with email/password
 * Creates user profile automatically via database trigger
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, signIn, isUsernameAvailable } from '@/lib/supabase/auth';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function RegisterPage() {
  useRedirectIfAuthenticated();
  const { t } = useTranslation();

  const router = useRouter();

  const [formData, setFormData] = useState(() => {
    const draftEmail =
      typeof window !== 'undefined' ? sessionStorage.getItem('auth_draft_email') || '' : '';
    const draftPassword =
      typeof window !== 'undefined' ? sessionStorage.getItem('auth_draft_password') || '' : '';
    return {
      email: draftEmail,
      password: draftPassword,
      confirmPassword: draftPassword,
      username: '',
      fullName: '',
      showPassword: false,
      showConfirmPassword: false,
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/vakken');
      }, 2000); // Redirect to vakken page for setup after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (typeof window !== 'undefined') {
      if (name === 'email') sessionStorage.setItem('auth_draft_email', value);
      if (name === 'password') sessionStorage.setItem('auth_draft_password', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.fullName.trim()) {
      setError(t('error_name_required'));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('error_passwords_mismatch'));
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t('error_password_min'));
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError(t('error_username_min'));
      setLoading(false);
      return;
    }

    // Check if username is available
    const available = await isUsernameAvailable(formData.username);
    if (!available) {
      setError(t('error_username_taken'));
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await signUp({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      fullName: formData.fullName.trim(),
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Ensure session is active
    if (!data?.session) {
      const { error: signInError } = await signIn({
        email: formData.email,
        password: formData.password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    // Clear drafts
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_draft_email');
      sessionStorage.removeItem('auth_draft_password');
    }

    // Set success to true to show success message
    setSuccess(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold">{t('register_title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t('register_email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={t('login_email_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                {t('register_username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="gebruikersnaam"
                minLength={3}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('register_username_helper')}</p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                {t('register_full_name')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={t('register_full_name_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t('register_password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={formData.showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                  }
                  className="absolute right-2 top-0 mt-2.5 h-6 w-6 flex items-center justify-center text-sm rounded-md hover:bg-secondary/50"
                  aria-label={t(
                    formData.showPassword ? 'login_hide_password' : 'login_show_password'
                  )}
                >
                  {formData.showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t('register_password_helper')}</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                {t('register_confirm_password')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={formData.showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      showConfirmPassword: !prev.showConfirmPassword,
                    }))
                  }
                  className="absolute right-2 top-0 mt-2.5 h-6 w-6 flex items-center justify-center text-sm rounded-md hover:bg-secondary/50"
                  aria-label={t(
                    formData.showConfirmPassword ? 'login_hide_password' : 'login_show_password'
                  )}
                >
                  {formData.showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('register_submitting') : t('register_submit')}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('login_or')}</span>
            </div>
          </div>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {t('register_have_account')}{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('register_login')}
              </Link>
            </span>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t('register_legal_intro')}{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            {t('login_legal_terms')}
          </Link>{' '}
          {t('login_legal_and')}{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            {t('login_legal_privacy')}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
