# 🚀 Quick Start Guide

Get your Magister sync extension running in 5 minutes!

## Prerequisites Checklist

- [ ] Chrome or Edge browser installed
- [ ] Magister school account
- [ ] Supabase project set up
- [ ] Learning platform with user accounts

---

## Step 1: Database Setup (5 min)

1. Open Supabase SQL Editor: https://zbppznuwwcjdbdbkexyq.supabase.co
2. Copy contents of `schema.sql`
3. Paste and execute in SQL Editor
4. Verify tables created:
   - `user_magister_mappings`
   - `magister_events`
   - `magister_grades`

**Test it:**
```sql
-- Should return your tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'magister_%';
```

---

## Step 2: Get Supabase Anon Key (1 min)

1. Go to Supabase Project Settings → API
2. Copy "anon" "public" key
3. Save it - you'll need it for the extension

---

## Step 3: Add Icons (2 min)

Create three PNG files in `icons/` folder:
- `icon16.png`
- `icon48.png`
- `icon128.png`

**Quick method:** Use online tool like https://www.favicon-generator.org/

**Super quick method:** Use any square PNG and rename it three times (browser will scale it)

---

## Step 4: Install Extension (1 min)

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked**
4. Select the `magister-extension-project` folder
5. Extension should appear with your icon

---

## Step 5: Create Backend API Endpoint (10 min)

Create this file in your Next.js project:

**File:** `app/api/magister/generate-token/route.ts`

```typescript
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

---

## Step 6: Generate Your Sync Token (2 min)

### Option A: Via API (Postman/curl)

```bash
curl -X POST https://your-platform.com/api/magister/generate-token \
  -H "Content-Type: application/json" \
  -d '{"magister_email": "your.name@school.nl"}' \
  -H "Cookie: your-auth-cookie"
```

### Option B: Create a Quick Settings Page

Add this to any authenticated page on your platform:

```tsx
'use client';
import { useState } from 'react';

export default function MagisterSync() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  const generate = async () => {
    const res = await fetch('/api/magister/generate-token', {
      method: 'POST',
      body: JSON.stringify({ magister_email: email }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setToken(data.sync_token);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Magister Sync Setup</h2>
      <input 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        placeholder="your.name@school.nl"
      />
      <button onClick={generate}>Generate Token</button>
      {token && (
        <div>
          <p>Your Sync Token:</p>
          <code>{token}</code>
          <button onClick={() => navigator.clipboard.writeText(token)}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Step 7: Configure Extension (1 min)

1. Click the extension icon in Chrome toolbar
2. Paste your sync token
3. Click "Save Configuration"
4. Wait for "✓ Configuration saved" message

---

## Step 8: Test the Sync! (2 min)

1. Navigate to your school's Magister site (e.g., `https://yourschool.magister.net`)
2. Log in with your school credentials
3. Open DevTools (F12) and go to **Console** tab
4. Navigate to **Agenda** or **Cijfers** page
5. Look for these console messages:
   ```
   [Magister Interceptor] Intercepting: /api/personen/.../afspraken
   [Magister Sync] Received intercepted data: CALENDAR
   [Magister Sync] Successfully synced CALENDAR item: ...
   ```
6. You should see a green notification in top-right: "🔄 Magister Sync: Synced X items"

---

## Step 9: Verify Data in Supabase (1 min)

1. Open Supabase Table Editor
2. Check `magister_events` or `magister_grades` tables
3. You should see synced data with your `user_id`

**Quick SQL check:**
```sql
-- View your synced events
SELECT id, title, start_time, end_time 
FROM magister_events 
WHERE user_id = 'your-user-id'
ORDER BY start_time DESC 
LIMIT 10;

-- View your synced grades
SELECT subject, grade_value, raw_payload->>'Omschrijving' as description
FROM magister_grades
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Success!

Your extension is now syncing Magister data to Supabase!

### What happens automatically:
- ✅ Calendar events sync when you visit the agenda page
- ✅ Grades sync when you visit the cijfers page
- ✅ Data is protected by Row Level Security (only you can see your data)
- ✅ Updates overwrite old data (upsert behavior)

---

## Troubleshooting

### "No sync token found"
- Re-configure the extension with your token
- Check that token was saved: `chrome.storage.local.get(['sync_token'])`

### "Failed to sync"
- Check browser console for error messages
- Verify Supabase URL is correct in `content.js`
- Ensure RLS policies allow inserts for your user

### "Invalid sync token"
- Regenerate the token on your platform
- Make sure you copied the entire UUID

### No console messages appear
- Refresh the Magister page
- Check that extension is enabled in `chrome://extensions/`
- Verify `interceptor.js` is loading (check Sources tab in DevTools)

---

## Next Steps

### For Production:

1. **Add Supabase anon key to extension**
   - Update `content.js` with your actual anon key
   - Or store it in `chrome.storage.local`

2. **Improve error handling**
   - Show user-friendly error messages
   - Add retry logic for failed syncs

3. **Add background sync**
   - Use `chrome.alarms` API
   - Periodically fetch new data even when not browsing Magister

4. **Publish to Chrome Web Store**
   - Follow INSTALLATION.md for packaging
   - Submit to Chrome Web Store review

5. **Add analytics**
   - Track sync success/failure rates
   - Monitor API changes from Magister

### For Users:

1. **Create a settings page** on your platform
   - Show sync status
   - Allow regenerating tokens
   - Display last sync time

2. **Add UI to view synced data**
   - Calendar view for events
   - Grade overview with subject filtering
   - Compare with Magister data

---

## Support & Debugging

### View Extension Logs
```javascript
// In DevTools Console on Magister page
console.log('Checking extension status...');

// Manually trigger test sync
window.postMessage({
  type: 'MAGISTER_API_INTERCEPTED',
  apiType: 'CALENDAR',
  url: '/test',
  data: { Items: [{ Id: 1, Start: new Date(), Einde: new Date(), Omschrijving: 'Test' }] }
}, '*');
```

### Check Storage
```javascript
// In extension popup console or background console
chrome.storage.local.get(['sync_token', 'user_id'], (result) => {
  console.log('Stored config:', result);
});
```

### Test Supabase Connection
```bash
curl https://zbppznuwwcjdbdbkexyq.supabase.co/rest/v1/magister_events \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN"
```

---

**Need help?** Check `INSTALLATION.md` for detailed troubleshooting and `API_STRUCTURE.md` for API details.
