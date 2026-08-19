# SSR Fix Archive

## Problem

The application was experiencing a critical error during server-side rendering:

```
Error: Cannot access default.then on the server. You cannot dot into a client module from a server component. You can only pass the imported name through.
```

This error prevented the root route (`/`) from loading, returning HTTP 500.

## Root Cause Analysis

### What is SSR?

Server-Side Rendering (SSR) is when the server builds the complete HTML page before sending it to the browser, instead of sending a blank page that JavaScript fills in later.

### Why the Error Occurred

The i18n (internationalization) system was trying to access browser-only features (like `localStorage`) during server rendering. The error message indicates that Next.js detected a client module being accessed during SSR, which is not allowed.

### Attempted Fixes

1. **Split i18n into server and client modules**
   - Created `lib/i18n.ts` - Server-side mock
   - Created `lib/i18n-client.ts` - Client-side implementation with `'use client'` directive
   - Updated `lib/useTranslation.ts` to dynamically import client i18n
   - Updated `components/I18nProvider.tsx` to dynamically import client i18n

2. **Fixed dynamic import syntax**
   - Changed `dynamic(() => import(...).then(...))` to `dynamic(() => import(...))` in `app/page.tsx`

3. **Moved providers**
   - Attempted various placements of `ClientProviders` in layout vs page

4. **Lazy singleton pattern**
   - Attempted to make i18n instantiation lazy using Proxy and getter functions

### Why These Fixes Didn't Work

The issue persisted because:

- Next.js compiles the entire import graph before SSR
- Even with dynamic imports, the compiler still analyzes the modules
- The error doesn't pinpoint which specific import is causing the issue
- The i18n module was being imported somewhere in the import chain that the compiler analyzed during SSR

## Temporary Solution

To get the application working, SSR was disabled globally by adding:

```typescript
export const dynamic = 'force-dynamic';
```

to `app/layout.tsx`.

### Impact of This Solution

**Pros:**

- Application now loads without errors
- No more 500 errors on root route
- All functionality works

**Cons:**

- Slightly slower initial page loads (client must render the page)
- Reduced SEO (search engines receive blank HTML initially)
- Not ideal for production

## Files Modified

### Current State

- `app/layout.tsx` - Added `export const dynamic = 'force-dynamic'` to disable SSR
- `lib/i18n.ts` - Server-side mock implementation
- `lib/i18n-client.ts` - Client-side implementation with `'use client'` directive
- `lib/useTranslation.ts` - Dynamic import of client i18n
- `components/I18nProvider.tsx` - Dynamic import of client i18n
- `app/page.tsx` - Fixed dynamic import syntax

### Backup Needed

Before implementing the proper fix, ensure you have backups of:

- Original `lib/i18n.ts` (before splitting)
- Original `app/layout.tsx` (before adding `export const dynamic = 'force-dynamic'`)

## Future Fix Strategy

When re-enabling SSR, consider these approaches:

1. **Use a SSR-compatible i18n library**
   - Consider libraries like `next-intl` or `react-i18next` that have built-in SSR support

2. **Restructure i18n to avoid module-level side effects**
   - Ensure no code runs at module import time
   - All initialization should happen inside functions or hooks

3. **Use Next.js dynamic imports with `ssr: false` for i18n-dependent components**
   - Mark components that need i18n as `ssr: false`

4. **Implement proper server-side i18n**
   - Server components should use a separate server-side i18n implementation
   - Client components use client-side i18n
   - No mixing of the two

5. **Debug the exact import causing the issue**
   - Use Next.js build output to identify the problematic import
   - Incrementally enable SSR for different routes to isolate the issue

## Related Documentation

- `docs/tasks/REMAINING_TASKS.md` - Task to re-enable SSR
- Next.js documentation on Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Next.js documentation on Client Components: https://nextjs.org/docs/app/building-your-application/rendering/client-components

## Date

August 16, 2026
