# ✅ Magister Extension Project - Complete

**Created:** August 4, 2026  
**Status:** Ready for implementation  
**Supabase Project:** https://zbppznuwwcjdbdbkexyq.supabase.co

---

## 📦 What's Included

### 1. Database Schema (`schema.sql`)
Three PostgreSQL tables with full Row Level Security:

- **`user_magister_mappings`**: Links users to sync tokens
  - `sync_token` (UUID): Unique token for Chrome Extension auth
  - `magister_email`: User's school email
  - RLS: Users can only see/edit their own mappings

- **`magister_events`**: Stores calendar items
  - `id` (TEXT): Magister event ID
  - `start_time`, `end_time`, `title`
  - `raw_payload` (JSONB): Complete API response
  - RLS: Users can only see/edit their own events

- **`magister_grades`**: Stores grades
  - `id` (TEXT): Magister grade ID  
  - `subject`, `grade_value`
  - `raw_payload` (JSONB): Complete API response
  - RLS: Users can only see/edit their own grades

### 2. Chrome Extension (Manifest V3)

**Files:**
- `manifest.json`: Extension configuration
- `content.js`: Runs in isolated context, forwards data to backend
- `interceptor.js`: Runs in page context, intercepts fetch/XHR calls
- `popup.html` + `popup.js`: Configuration UI

**What it does:**
1. Monkey-patches `window.fetch` on `*.magister.net`
2. Intercepts API calls to:
   - `/api/personen/*/afspraken` (calendar)
   - `/api/personen/*/cijfers` (grades)
3. Clones responses without breaking the original app
4. Sends data to Supabase Edge Function with `sync_token`

### 3. Supabase Edge Function

**Location:** `supabase/functions/magister-sync/index.ts`

**What it does:**
1. Receives POST from Chrome Extension
2. Validates `sync_token` → gets `user_id`
3. Formats data according to schema
4. Upserts to `magister_events` or `magister_grades`
5. Returns success/error response

**Deploy command:**
```bash
supabase functions deploy magister-sync --project-ref zbppznuwwcjdbdbkexyq
```

### 4. Frontend Examples

**Files:**
- `frontend-examples/useRealtimeEvents.tsx`: React hook for Supabase Realtime
- `frontend-examples/CalendarWithRealtime.tsx`: Example calendar component
- `frontend-examples/GradesWithRealtime.tsx`: Example grades component
- `frontend-examples/REALTIME_SETUP.md`: Setup instructions

**What it does:**
- Subscribes to Supabase Realtime changes
- Listens for INSERT, UPDATE, DELETE events
- Automatically refreshes UI without page reload

### 5. Documentation

- `README.md`: Complete overview and API documentation
- `QUICKSTART.md`: 5-minute setup guide
- `INSTALLATION.md`: Detailed installation instructions
- `API_STRUCTURE.md`: Magister API field mappings
- `EDGE_FUNCTION_DEPLOYMENT.md`: Edge Function deployment guide
- `PROJECT_SUMMARY.md`: High-level architecture summary

---

## 🚀 Quick Start

### 1. Set up Database
```bash
# Run in Supabase SQL Editor
psql < schema.sql
```

### 2. Install Extension
1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select `magister-extension-project` folder

### 3. Deploy Edge Function
```bash
cd supabase/functions
supabase functions deploy magister-sync
```

### 4. Generate Sync Token (on your platform)
```typescript
// app/api/magister/generate-token/route.ts
const { data } = await supabase
  .from('user_magister_mappings')
  .upsert({ user_id, magister_email })
  .select('sync_token')
  .single();

return { sync_token: data.sync_token };
```

### 5. Configure Extension
- Click extension icon
- Paste sync token
- Save configuration

### 6. Test
- Visit magister.net
- Navigate to Agenda or Cijfers
- Check console for sync messages
- Verify data in Supabase

---

## 🔒 Security Features

✅ **Row Level Security (RLS)**: Users can only access their own data  
✅ **Token-based auth**: No passwords stored in extension  
✅ **Service Role Key**: Edge Function bypasses RLS for inserts  
✅ **HTTPS only**: All API calls encrypted  
✅ **Token validation**: Invalid tokens rejected with 401  
✅ **CORS headers**: Extension allowed, others blocked

---

## 📊 Data Flow

```
Magister.net (Browser)
    ↓ fetch/XHR intercepted
interceptor.js (page context)
    ↓ postMessage
content.js (extension context)
    ↓ GET sync_token from chrome.storage
    ↓ POST to Edge Function
Supabase Edge Function
    ↓ Validate sync_token
    ↓ Get user_id from user_magister_mappings
    ↓ Format data
    ↓ Upsert to magister_events or magister_grades
PostgreSQL with RLS
    ↓ Realtime subscription
Frontend (React/Next.js)
    ↓ Auto-refresh UI
User sees updated data
```

---

## 🎯 Next Steps

### For Development:
1. Add icons to `icons/` folder (16x16, 48x48, 128x128)
2. Test with real Magister data
3. Adjust field mappings in Edge Function if needed
4. Add error logging/monitoring

### For Production:
1. Add Supabase anon key to extension
2. Implement background sync with `chrome.alarms`
3. Add retry logic for failed syncs
4. Create settings page on platform
5. Add analytics/monitoring
6. Package and publish to Chrome Web Store

### For Users:
1. Create UI to generate sync tokens
2. Display sync status and last sync time
3. Show synced calendar and grades
4. Allow manual refresh/re-sync

---

## 📞 Support

- **Database Issues**: Check `schema.sql` and RLS policies
- **Extension Issues**: Check browser console for errors
- **Edge Function Issues**: Check Supabase Functions logs
- **Sync Issues**: Verify sync_token is valid and not expired

**Common Issues:**
- "Invalid sync token" → Regenerate token
- "No data syncing" → Check extension is enabled
- "403 Forbidden" → Check RLS policies
- "CORS error" → Verify Edge Function CORS headers

---

## 📝 Notes

- **Magister API**: Field names may vary between schools (e.g., `Items` vs `items`)
- **Raw Payload**: Always stored in JSONB for future-proofing
- **Upsert Logic**: Uses `ON CONFLICT (id)` to update existing records
- **Timezone**: All timestamps stored in UTC with timezone (`TIMESTAMP WITH TIME ZONE`)
- **User Mapping**: One sync_token per user (enforced by UNIQUE constraint)

---

## ✨ Features

✅ Automatic sync when browsing Magister  
✅ Real-time UI updates via Supabase Realtime  
✅ Token-based authentication  
✅ Future-proof with JSONB storage  
✅ Row-level security  
✅ Upsert behavior (no duplicates)  
✅ Non-intrusive (doesn't break Magister)  
✅ Manifest V3 compliant  

---

**Project created for:** Custom learning platform with Magister sync  
**Technology Stack:** Chrome Extension, Supabase (PostgreSQL + Edge Functions), Next.js, React  
**Author:** Kiro AI Assistant  
**Date:** August 4, 2026  

