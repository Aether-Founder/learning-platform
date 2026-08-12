# Supabase Realtime Setup Guide

## Overview

This guide explains how to enable Supabase Realtime for your `magister_events` and `magister_grades` tables so your frontend receives instant updates when the Chrome Extension syncs data.

## Prerequisites

- ✅ Tables created with `schema.sql`
- ✅ Edge Function deployed
- ✅ Chrome Extension working
- ✅ Frontend using `@supabase/supabase-js` v2+

## Step 1: Enable Realtime on Tables

By default, Realtime is **disabled** on tables for security. You need to enable it.

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/zbppznuwwcjdbdbkexyq
2. Navigate to: **Database** → **Replication**
3. Find `magister_events` table
4. Toggle **Realtime** ON
5. Find `magister_grades` table
6. Toggle **Realtime** ON

### Option B: Via SQL

```sql
-- Enable Realtime for magister_events
ALTER PUBLICATION supabase_realtime ADD TABLE magister_events;

-- Enable Realtime for magister_grades
ALTER PUBLICATION supabase_realtime ADD TABLE magister_grades;
```

Run this in the Supabase SQL Editor.

### Verify Realtime is Enabled

```sql
-- Check which tables have Realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Should return both `magister_events` and `magister_grades`.

## Step 2: Install Supabase Client

If not already installed:

```bash
npm install @supabase/supabase-js
# or
npm install @supabase/auth-helpers-nextjs
```

## Step 3: Initialize Supabase Client

### For Next.js App Router (Client Component)

```typescript
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MyComponent() {
  const supabase = createClientComponentClient();
  
  // Use supabase client here
}
```

### For React (Create React App, Vite, etc.)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbppznuwwcjdbdbkexyq.supabase.co',
  'YOUR_ANON_KEY'
);
```

Get your anon key from:
- Dashboard → Settings → API → Project API keys → `anon` `public`

## Step 4: Subscribe to Realtime Changes

### Basic Subscription

```typescript
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'magister_events',
        filter: `user_id=eq.${userId}` // IMPORTANT: Filter by user
      },
      (payload) => {
        console.log('Change received!', payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Complete Example with State Updates

```typescript
useEffect(() => {
  const setupRealtime = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('magister_events_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'magister_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new event to state
            setEvents(prev => [...prev, payload.new]);
          }
          
          if (payload.eventType === 'UPDATE') {
            // Update existing event
            setEvents(prev =>
              prev.map(e => e.id === payload.new.id ? payload.new : e)
            );
          }
          
          if (payload.eventType === 'DELETE') {
            // Remove event
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const cleanup = setupRealtime();
  return () => cleanup.then(fn => fn?.());
}, []);
```

## Step 5: Use the Provided Components

We've created ready-to-use components in this folder:

### 1. Full Calendar Component
```typescript
// CalendarWithRealtime.tsx
import CalendarWithRealtime from './CalendarWithRealtime';

export default function CalendarPage() {
  return <CalendarWithRealtime />;
}
```

Features:
- ✅ Automatic Realtime subscription
- ✅ Visual sync status indicator
- ✅ Toast notifications
- ✅ Handles INSERT, UPDATE, DELETE
- ✅ Auto-sorts by date

### 2. Custom Hook
```typescript
// useRealtimeEvents.tsx
import { useRealtimeEvents } from './useRealtimeEvents';

function MyCalendar() {
  const { events, loading, isConnected, fetchEvents } = useRealtimeEvents({
    onInsert: (event) => {
      toast.success(`New event: ${event.title}`);
    },
    onUpdate: (event) => {
      toast.info(`Updated: ${event.title}`);
    },
    onDelete: (event) => {
      toast.warning('Event removed');
    }
  });

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

### 3. Grades Component
```typescript
// GradesWithRealtime.tsx
import GradesWithRealtime from './GradesWithRealtime';

export default function GradesPage() {
  return <GradesWithRealtime />;
}
```

Features:
- ✅ Real-time grade updates
- ✅ Automatic average calculation
- ✅ Highlight new grades
- ✅ Browser notifications
- ✅ Grouped by subject

## Step 6: Test Realtime

### Testing Method 1: Via Chrome Extension

1. Open your frontend (calendar or grades page)
2. Open browser DevTools Console
3. Visit Magister in another tab
4. Navigate to agenda or cijfers
5. Watch your frontend update instantly!

### Testing Method 2: Via SQL Editor

```sql
-- Insert a test event (replace with your user_id)
INSERT INTO magister_events (id, user_id, start_time, end_time, title, raw_payload)
VALUES (
  'test-' || gen_random_uuid()::text,
  'YOUR_USER_ID_HERE',
  NOW() + interval '1 hour',
  NOW() + interval '2 hours',
  'Test Realtime Event',
  '{}'::jsonb
);
```

You should see the event appear on your frontend **instantly** without refresh!

### Testing Method 3: Via REST API

```bash
curl -X POST 'https://zbppznuwwcjdbdbkexyq.supabase.co/rest/v1/magister_events' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "user_id": "YOUR_USER_ID",
    "start_time": "2026-08-05T10:00:00Z",
    "end_time": "2026-08-05T11:00:00Z",
    "title": "Test Event",
    "raw_payload": {}
  }'
```

## Troubleshooting

### "No change received" - Realtime not working

**Check 1:** Is Realtime enabled?
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Check 2:** Is the filter correct?
```typescript
// Make sure user_id matches
filter: `user_id=eq.${currentUserId}`
```

**Check 3:** Are you subscribed?
```typescript
.subscribe((status) => {
  console.log('Status:', status); // Should be 'SUBSCRIBED'
});
```

### "CHANNEL_ERROR" or subscription fails

**Cause:** Invalid filter syntax or table not found

**Solution:**
```typescript
// Correct syntax
filter: `user_id=eq.${userId}`

// NOT:
filter: `user_id=${userId}` // ❌ Wrong
filter: `user_id = ${userId}` // ❌ Wrong
```

### Changes received for other users

**Cause:** Filter not applied correctly

**Solution:** Always filter by the authenticated user:
```typescript
const { data: { user } } = await supabase.auth.getUser();

.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'magister_events',
  filter: `user_id=eq.${user.id}` // ✅ Critical!
}, ...)
```

### Multiple channels causing duplicates

**Cause:** Subscribing multiple times without cleanup

**Solution:** Always unsubscribe:
```typescript
useEffect(() => {
  const channel = supabase.channel('unique-name')...

  return () => {
    supabase.removeChannel(channel); // ✅ Always cleanup
  };
}, []);
```

### High memory usage / connection leaks

**Cause:** Channels not being removed

**Solution:**
```typescript
// Remove ALL channels on unmount
useEffect(() => {
  // ... setup

  return () => {
    supabase.removeAllChannels(); // Nuclear option
  };
}, []);
```

## Performance Considerations

### Subscription Limits

- Free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections

For typical usage (1 connection per logged-in user), this is sufficient.

### Payload Size

Each change sends the **entire row** over WebSocket. With `raw_payload` JSONB, this can be ~1-5KB per event.

**Optimization:** If needed, use `SELECT` to only include specific columns:
```sql
-- In RLS policy or view, limit columns
SELECT id, user_id, start_time, end_time, title FROM magister_events;
```

### Connection Management

Supabase Realtime automatically:
- ✅ Reconnects on network interruption
- ✅ Handles authentication refresh
- ✅ Manages WebSocket lifecycle

You don't need to manually handle reconnection logic.

## Security Notes

### RLS Still Applies

Even with Realtime enabled, **RLS policies are enforced**. Users can only receive changes for rows they have access to.

### Filter is Additional Security

The `filter` parameter is enforced server-side. Even if a user modifies client code, they can't receive other users' events.

### No Sensitive Data in raw_payload

Since `raw_payload` is sent over WebSocket, avoid storing sensitive data there. The Magister API shouldn't include sensitive info, but verify before going to production.

## Next Steps

1. **Enable Realtime** on your tables (Step 1)
2. **Copy one of the example components** to your frontend
3. **Test with Chrome Extension** by visiting Magister
4. **Add toast notifications** for better UX
5. **Monitor performance** in Supabase Dashboard → Realtime tab

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Filters](https://supabase.com/docs/guides/realtime/postgres-changes#available-filters)
- [React Hooks Example](https://supabase.com/docs/guides/realtime/quickstart)

---

**Ready to go live?** Follow the steps above and your frontend will update in real-time as the Chrome Extension syncs data! ⚡
