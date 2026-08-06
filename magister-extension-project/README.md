# Magister Chrome Extension - Sync Project

## 🎯 Overview
This Chrome Extension automatically syncs calendar events and grades from Magister (Dutch school system) to your custom learning platform. It uses a unique `sync_token` (UUID) for authentication instead of email matching, allowing users to have different emails on your platform vs. their school system.

**Key Features:**
- ✅ Automatic API interception on magister.net
- ✅ Real-time sync of calendar events (agenda/afspraken)
- ✅ Real-time sync of grades (cijfers)
- ✅ Secure token-based authentication
- ✅ Row Level Security (RLS) enforced
- ✅ Future-proof with JSONB raw payload storage

## 🏗️ Architecture

```
┌─────────────────┐
│  Magister.net   │
│   (Web Page)    │
└────────┬────────┘
         │
         │ API Calls Intercepted
         ↓
┌─────────────────┐
│ interceptor.js  │ (Page Context)
│  - Monkey patch │
│  - Clone Response│
└────────┬────────┘
         │
         │ postMessage
         ↓
┌─────────────────┐
│  content.js     │ (Extension Context)
│  - Get sync_token│
│  - Format data  │
└────────┬────────┘
         │
         │ REST API
         ↓
┌─────────────────┐
│   Supabase      │
│  - RLS Security │
│  - PostgreSQL   │
└─────────────────┘
```

## 📁 Project Structure

```
magister-extension-project/
├── manifest.json          # Extension configuration (Manifest V3)
├── content.js            # Content script (runs in isolated context)
├── interceptor.js        # API interceptor (runs in page context)
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic & configuration
├── icons/                # Extension icons (16x16, 48x48, 128x128)
│   └── README.md
├── schema.sql            # Supabase database schema
├── INSTALLATION.md       # Detailed setup guide
└── README.md             # This file
```

## 🗄️ Supabase Project
- **URL**: https://zbppznuwwcjdbdbkexyq.supabase.co

## 📊 Database Schema

### Tables

#### 1. `user_magister_mappings`
Links platform users to Magister accounts via a unique sync token.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → `auth.users(id)`)
- `sync_token` (UUID, Unique) - Generated automatically, used by Chrome Extension
- `magister_email` (TEXT) - User's email in Magister system
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Usage:**
```sql
-- Create a mapping for a user
INSERT INTO user_magister_mappings (user_id, magister_email)
VALUES ('user-uuid-here', 'student@school.nl');

-- Get sync token for a user
SELECT sync_token FROM user_magister_mappings WHERE user_id = 'user-uuid-here';
```

#### 2. `magister_events`
Stores calendar items from Magister.

**Columns:**
- `id` (TEXT, Primary Key) - Magister's event ID
- `user_id` (UUID, Foreign Key → `auth.users(id)`)
- `start_time` (TIMESTAMP WITH TIME ZONE)
- `end_time` (TIMESTAMP WITH TIME ZONE)
- `title` (TEXT)
- `raw_payload` (JSONB) - Complete API response for future-proofing
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Usage:**
```sql
-- Insert event from Chrome Extension
INSERT INTO magister_events (id, user_id, start_time, end_time, title, raw_payload)
VALUES (
  'magister-event-123',
  'user-uuid-here',
  '2026-08-05 09:00:00+00',
  '2026-08-05 10:00:00+00',
  'Math Class',
  '{"location": "Room 101", "teacher": "Mr. Smith", ...}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  title = EXCLUDED.title,
  raw_payload = EXCLUDED.raw_payload;

-- Query user's upcoming events
SELECT * FROM magister_events 
WHERE user_id = 'user-uuid-here' 
  AND start_time > NOW()
ORDER BY start_time;
```

#### 3. `magister_grades`
Stores grades from Magister.

**Columns:**
- `id` (TEXT, Primary Key) - Magister's grade ID
- `user_id` (UUID, Foreign Key → `auth.users(id)`)
- `subject` (TEXT)
- `grade_value` (TEXT) - Supports various formats (numbers, letters, etc.)
- `raw_payload` (JSONB) - Complete API response for future-proofing
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Usage:**
```sql
-- Insert grade from Chrome Extension
INSERT INTO magister_grades (id, user_id, subject, grade_value, raw_payload)
VALUES (
  'magister-grade-456',
  'user-uuid-here',
  'Mathematics',
  '8.5',
  '{"weight": 1.0, "date": "2026-08-01", "type": "Test", ...}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  grade_value = EXCLUDED.grade_value,
  raw_payload = EXCLUDED.raw_payload;

-- Query all grades for a subject
SELECT subject, grade_value, raw_payload->>'date' as grade_date
FROM magister_grades
WHERE user_id = 'user-uuid-here'
  AND subject = 'Mathematics'
ORDER BY created_at DESC;
```

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only:
- SELECT their own data
- INSERT their own data
- UPDATE their own data
- DELETE their own data

The policies use `auth.uid()` to verify the authenticated user matches the `user_id` in the row.

## Installation

1. Open Supabase SQL Editor
2. Copy the contents of `schema.sql`
3. Run the SQL script

## Chrome Extension Flow

### 1. Initial Setup (On Platform)
```typescript
// User generates sync token on your platform
const response = await fetch('/api/magister/generate-token', {
  method: 'POST',
  body: JSON.stringify({ magister_email: 'student@school.nl' })
});
const { sync_token } = await response.json();

// Display sync_token to user (they'll enter it in Chrome Extension)
```

### 2. Chrome Extension Authentication
```typescript
// User enters sync_token in Chrome Extension
// Extension validates token and gets user_id
const { data, error } = await supabase.rpc('get_user_id_from_sync_token', {
  token: userEnteredToken
});

if (data) {
  // Store user_id for subsequent API calls
  chrome.storage.local.set({ user_id: data });
}
```

### 3. Syncing Data
```typescript
// Chrome Extension syncs events
const events = await fetchMagisterEvents(); // Your Magister API call

for (const event of events) {
  await supabase.from('magister_events').upsert({
    id: event.id,
    user_id: storedUserId,
    start_time: event.start,
    end_time: event.end,
    title: event.title,
    raw_payload: event
  });
}

// Chrome Extension syncs grades
const grades = await fetchMagisterGrades(); // Your Magister API call

for (const grade of grades) {
  await supabase.from('magister_grades').upsert({
    id: grade.id,
    user_id: storedUserId,
    subject: grade.subject,
    grade_value: grade.value,
    raw_payload: grade
  });
}
```

## API Endpoint Example (Platform)

```typescript
// app/api/magister/generate-token/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { magister_email } = await request.json();

  // Upsert mapping (creates or updates)
  const { data, error } = await supabase
    .from('user_magister_mappings')
    .upsert(
      { user_id: user.id, magister_email },
      { onConflict: 'user_id' }
    )
    .select('sync_token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sync_token: data.sync_token });
}
```

## Security Notes

1. **Sync Token**: The `sync_token` is like a password. Users should keep it secure.
2. **RLS**: All tables have Row Level Security enabled to prevent unauthorized access.
3. **HTTPS**: Always use HTTPS for API calls with the sync token.
4. **Token Rotation**: Consider adding functionality to regenerate sync tokens if compromised.

## Future Enhancements

- Add `last_synced_at` timestamp to track sync status
- Add sync status indicators (pending, syncing, success, error)
- Implement incremental sync (only fetch new/updated items)
- Add webhook support for real-time updates
- Implement conflict resolution for concurrent updates
