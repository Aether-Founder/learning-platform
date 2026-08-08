'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/auth';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    const logout = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
      // Redirect to login page after signing out
      router.push('/login');
    };

    logout();
  }, [router]);

  return null;
}
