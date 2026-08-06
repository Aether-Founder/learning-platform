/**
 * Supabase Client for Browser/Client-Side Operations
 * 
 * Use this client in:
 * - React components
 * - Client-side hooks
 * - Browser-side data fetching
 * 
 * This client uses the ANON key which is safe to expose in the browser.
 * Row Level Security (RLS) ensures users can only access their own data.
 */

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

/**
 * Create a Supabase client for use in Client Components
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { supabase } from '@/lib/supabase/client';
 * 
 * export default function MyComponent() {
 *   const [data, setData] = useState([]);
 * 
 *   useEffect(() => {
 *     async function fetchData() {
 *       const { data: studySets } = await supabase
 *         .from('study_sets')
 *         .select('*');
 *       setData(studySets);
 *     }
 *     fetchData();
 *   }, []);
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
function getBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getBrowserConfig();

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Create a fresh Supabase client instance
 * Useful when you need a new instance (e.g., after auth state changes)
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
