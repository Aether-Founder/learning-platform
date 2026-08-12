# Supabase Edge Function Deployment Guide

## Overview

The `magister-sync` Edge Function acts as a secure webhook that:
1. Receives POST requests from the Chrome Extension
2. Validates the `sync_token` against `user_magister_mappings` table
3. Upserts data into `magister_events` or `magister_grades` tables
4. Returns success/error responses

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project initialized**
   ```bash
   supabase login
   ```

3. **Database schema deployed**
   - Ensure `schema.sql` has been run in your Supabase project
   - Verify tables exist: `user_magister_mappings`, `magister_events`, `magister_grades`

## Deployment Steps

### Step 1: Link to Your Supabase Project

```bash
# Navigate to your project directory
cd magister-extension-project

# Link to your Supabase project
supabase link --project-ref zbppznuwwcjdbdbkexyq
```

When prompted, enter your database password.

### Step 2: Deploy the Edge Function

```bash
# Deploy the magister-sync function
supabase functions deploy magister-sync
```

This will:
- Bundle the TypeScript code
- Deploy to your Supabase project
- Make the function available at: `https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync`

### Step 3: Verify Deployment

```bash
# List all deployed functions
supabase functions list
```

You should see `magister-sync` in the list.

### Step 4: Test the Function

```bash
# Test with curl
curl -i --location --request POST 'https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync' \
  --header 'Content-Type: application/json' \
  --header 'sync-token: YOUR_SYNC_TOKEN_HERE' \
  --data '{"apiType":"CALENDAR","data":{"Items":[]}}'
```

Expected response:
```json
{
  "success": true,
  "message": "CALENDAR data synced successfully",
  "inserted": 0
}
```

## Environment Variables

The Edge Function automatically has access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has full database access)

These are injected automatically by Supabase, no configuration needed!

## Function URL

After deployment, your function is available at:
```
https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync
```

This URL is already configured in the Chrome Extension's `content.js`.

## Monitoring & Logs

### View Real-time Logs

```bash
# Stream logs from the deployed function
supabase functions logs magister-sync
```

Or view logs in Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/zbppznuwwcjdbdbkexyq
2. Navigate to: **Edge Functions** → **magister-sync** → **Logs**

### Common Log Messages

**Success:**
```
[Magister Sync] Token validated for user: 123e4567-e89b-12d3-a456-426614174000
[Magister Sync] Upserting 5 calendar events
[Magister Sync] CALENDAR sync completed: { inserted: 5, skipped: 0 }
```

**Errors:**
```
[Magister Sync] No sync token provided
[Magister Sync] Invalid sync token
[Magister Sync] Error upserting calendar events: ...
```

## Testing with Sample Data

### Test Calendar Sync

```bash
curl -X POST 'https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync' \
  -H 'Content-Type: application/json' \
  -H 'sync-token: YOUR_ACTUAL_TOKEN' \
  -d '{
    "apiType": "CALENDAR",
    "data": {
      "Items": [
        {
          "Id": 123456,
          "Start": "2026-08-05T09:00:00.000+02:00",
          "Einde": "2026-08-05T10:00:00.000+02:00",
          "Omschrijving": "Test Wiskunde Les"
        }
      ]
    }
  }'
```

### Test Grades Sync

```bash
curl -X POST 'https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync' \
  -H 'Content-Type: application/json' \
  -H 'sync-token: YOUR_ACTUAL_TOKEN' \
  -d '{
    "apiType": "GRADES",
    "data": {
      "items": [
        {
          "CijferId": 789,
          "Vak": "Nederlands",
          "Omschrijving": "Proefwerk spelling",
          "Cijfer": "7.5",
          "Weging": 2,
          "Datum": "2025-10-15T00:00:00.000+02:00"
        }
      ]
    }
  }'
```

## Troubleshooting

### Error: "Invalid or expired sync token"

**Cause:** The sync_token doesn't exist in `user_magister_mappings` table.

**Solution:**
```sql
-- Check if token exists
SELECT * FROM user_magister_mappings WHERE sync_token = 'YOUR_TOKEN';

-- If not, create a mapping
INSERT INTO user_magister_mappings (user_id, magister_email)
VALUES ('YOUR_USER_ID', 'student@school.nl');
```

### Error: "Failed to upsert calendar events"

**Cause:** Missing required fields or RLS policy blocking insert.

**Solution:**
1. Check logs for specific error message
2. Verify RLS policies allow inserts:
   ```sql
   -- Should return your policy
   SELECT * FROM pg_policies WHERE tablename = 'magister_events';
   ```
3. Ensure Edge Function uses service role key (it should automatically)

### Error: "Function not found"

**Cause:** Function not deployed or wrong URL.

**Solution:**
```bash
# Redeploy
supabase functions deploy magister-sync

# Verify URL
supabase functions list
```

### Error: "CORS error" in Chrome Extension

**Cause:** CORS headers not set correctly.

**Solution:** Already handled in the function code. If you still get CORS errors:
1. Check function logs for errors
2. Verify the function is responding to OPTIONS requests
3. Ensure Chrome Extension manifest has correct `host_permissions`

## Updating the Function

After making changes to `index.ts`:

```bash
# Redeploy
supabase functions deploy magister-sync

# Watch for errors in logs
supabase functions logs magister-sync
```

Changes are applied immediately after deployment.

## Security Considerations

### Service Role Key

The function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. This is **intentional** because:
1. We manually validate the sync_token
2. We explicitly set `user_id` in the data
3. RLS policies still protect the data when accessed via REST API

### Token Validation

The function validates tokens by:
1. Querying `user_magister_mappings` table
2. Checking if `sync_token` matches
3. Extracting the associated `user_id`
4. Only then inserting/updating data with that `user_id`

This ensures users can only sync data to their own account.

### CORS

The function allows requests from any origin (`*`). This is safe because:
1. Authentication via sync_token is required
2. Token is validated before any database operations
3. Chrome Extension is the primary client

To restrict to specific origins, modify the CORS headers in `index.ts`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'chrome-extension://YOUR_EXTENSION_ID',
  // ... rest of headers
};
```

## Performance

### Expected Response Times

- Token validation: ~50ms
- Small batch (1-5 items): ~100-200ms
- Medium batch (10-20 items): ~300-500ms
- Large batch (50+ items): ~1-2s

### Rate Limits

Supabase Edge Functions have these limits (as of 2026):
- **Free tier**: 500,000 function invocations/month
- **Pro tier**: 2 million function invocations/month
- **Timeout**: 150 seconds per invocation

For typical usage (syncing agenda/grades a few times per day), you'll stay well within limits.

## Cost Considerations

**Free Tier:**
- 500,000 invocations/month = ~16,000 per day
- If a user syncs 10 times per day = supports 1,600 users

**Pro Tier ($25/month):**
- 2 million invocations/month = ~66,000 per day
- If a user syncs 10 times per day = supports 6,600 users

Edge Functions are very cost-effective for this use case!

## Next Steps

1. **Deploy the function** using steps above
2. **Test with curl** to verify it works
3. **Update Chrome Extension** if needed (URL is already configured)
4. **Monitor logs** for the first few real syncs
5. **Set up alerts** in Supabase dashboard for function errors

## Support

If you encounter issues:
1. Check function logs: `supabase functions logs magister-sync`
2. Verify database schema is correct
3. Test with curl to isolate issues
4. Check Supabase status page: https://status.supabase.com/
