/**
 * Supabase Provider Component
 *
 * Wraps the app to provide Supabase context to all components
 * This ensures proper session handling and auth state management
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

function getBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient<Database> | null>(() => {
    const config = getBrowserConfig();

    if (!config) {
      // NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.
      // This happens on a fresh clone or in CI before env vars are configured.
      // We render children without a Supabase client instead of crashing the
      // whole app (and the build's prerendering) at module load time.
      if (typeof window !== 'undefined') {
        console.warn(
          '[SupabaseProvider] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured. Supabase features are disabled.'
        );
      }
      return null;
    }

    return createBrowserClient<Database>(config.url, config.anonKey);
  });
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Refresh the page to load user data
        router.refresh();
      }
      if (event === 'SIGNED_OUT') {
        // Redirect to login
        router.push('/login');
      }
      if (event === 'TOKEN_REFRESHED') {
        // Refresh the page to update session
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return <Context.Provider value={{ supabase } as SupabaseContext}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }

  return context;
};
