'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { I18nProvider } from '@/components/I18nProvider';
import { SyncManager } from '@/lib/offline/sync';

// Force client-side rendering
export const dynamic = 'force-dynamic';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    SyncManager.init();
  }, []);

  return (
    <SupabaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}
