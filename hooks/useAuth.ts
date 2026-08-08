/**
 * React Hooks for Authentication
 *
 * Custom hooks for managing authentication state in React components
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/auth';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * Hook to get the current authenticated user
 *
 * @returns Current user or null
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const user = useUser();
 *
 *   if (!user) return <div>Please log in</div>;
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Hook to get the current user's profile from the users table
 *
 * @returns User profile or null
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { profile, loading } = useUserProfile();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!profile) return <div>Not logged in</div>;
 *
 *   return (
 *     <div>
 *       <h1>{profile.full_name}</h1>
 *       <p>{profile.username}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUserProfile().then((profile) => {
      setProfile(profile);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getCurrentUserProfile();
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading };
}

/**
 * Hook to require authentication (redirects to login if not authenticated)
 *
 * @param redirectTo - Path to redirect to after login
 * @returns Current user (guaranteed to exist after loading)
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user, loading } = useRequireAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   // User is guaranteed to exist here
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo?: string) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const loginPath = redirectTo
        ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/login';
      router.push(loginPath);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

/**
 * Hook to redirect authenticated users (useful for login/register pages)
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   useRedirectIfAuthenticated();
 *
 *   // Rest of login form...
 * }
 * ```
 */
export function useRedirectIfAuthenticated(to: string = '/') {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(to);
    }
  }, [user, loading, router, to]);

  return { user, loading };
}

/**
 * Hook to get auth session
 *
 * @returns Current session or null
 */
export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
