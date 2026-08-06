# Magister Chrome Extension - Installation Guide

## Prerequisites

1. Chrome or Edge browser
2. Active Magister account
3. Your learning platform account with generated sync token

## Step 1: Set Up Icons

The extension needs icons in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

**Quick Option:** Use any PNG images or generate them online at:
- https://www.favicon-generator.org/
- https://redketchup.io/icon-editor

Or use this placeholder SVG converted to PNG with any color scheme.

## Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `magister-extension-project` folder
5. The extension should now appear in your extensions list

## Step 3: Get Your Sync Token

### Backend API Endpoint Needed

First, create an API endpoint on your platform to generate sync tokens:

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

  // Upsert mapping (creates sync_token automatically via DEFAULT)
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

// GET endpoint to retrieve existing token
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_magister_mappings')
    .select('sync_token, magister_email')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { sync_token: null });
}
```

### User Flow on Your Platform

Create a settings page where users can:

1. Enter their Magister email address
2. Click "Generate Sync Token"
3. Display the token for them to copy
4. Show instructions to paste it in the Chrome Extension

Example frontend:

```tsx
'use client';
import { useState } from 'react';

export default function MagisterSettings() {
  const [magisterEmail, setMagisterEmail] = useState('');
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/magister/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magister_email: magisterEmail })
      });
      
      const data = await response.json();
      setSyncToken(data.sync_token);
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Failed to generate sync token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (syncToken) {
      navigator.clipboard.writeText(syncToken);
      alert('Token copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Magister Integration</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Magister Email Address
          </label>
          <input
            type="email"
            value={magisterEmail}
            onChange={(e) => setMagisterEmail(e.target.value)}
            placeholder="your.name@school.nl"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <button
          onClick={generateToken}
          disabled={!magisterEmail || loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Sync Token'}
        </button>
        
        {syncToken && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold mb-2">Your Sync Token</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white border rounded text-sm break-all">
                {syncToken}
              </code>
              <button
                onClick={copyToken}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Copy this token and paste it in the Chrome Extension settings.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Install the Magister Chrome Extension</li>
          <li>Generate your sync token above</li>
          <li>Copy the token and paste it in the extension</li>
          <li>Visit magister.net and navigate to your agenda or grades</li>
          <li>Data will sync automatically!</li>
        </ol>
      </div>
    </div>
  );
}
```

## Step 4: Configure the Extension

1. Click the extension icon in Chrome toolbar
2. Paste your sync token from your learning platform
3. Click "Save Configuration"
4. Wait for validation confirmation

## Step 5: Start Syncing

1. Navigate to `https://your-school.magister.net`
2. Log in with your Magister credentials
3. Visit your agenda or grades page
4. The extension will automatically intercept and sync data
5. Check your learning platform to see synced data

## Troubleshooting

### Extension Not Working

1. Check that the extension is enabled in `chrome://extensions/`
2. Look for errors in the console (F12 → Console tab)
3. Verify the sync token is correctly saved (click extension icon)

### Data Not Syncing

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages starting with `[Magister Sync]` or `[Magister Interceptor]`
4. Check Network tab for failed requests to Supabase

### Invalid Sync Token Error

1. Regenerate the token on your learning platform
2. Make sure you copied the entire token
3. Verify the token is a valid UUID format

### Supabase RLS Errors

Make sure you've run the `schema.sql` file in Supabase SQL Editor to create:
- The three tables
- RLS policies
- The `get_user_id_from_sync_token` function

## Development & Debugging

### View Extension Logs

1. Open DevTools on Magister page (F12)
2. Look for:
   - `[Magister Interceptor]` - Shows intercepted API calls
   - `[Magister Sync]` - Shows sync status

### Inspect Extension Background

1. Go to `chrome://extensions/`
2. Find the Magister Sync extension
3. Click "Inspect views: service worker" or "Inspect views: popup"

### Test API Interception

Open console and manually trigger:
```javascript
// Test if interceptor is loaded
console.log('Fetch is:', typeof window.fetch);

// Manually trigger a test message
window.postMessage({
  type: 'MAGISTER_API_INTERCEPTED',
  apiType: 'CALENDAR',
  url: '/api/personen/test/afspraken',
  data: { Items: [] }
}, '*');
```

## Security Notes

1. **Never share your sync token** - It's like a password
2. **Use HTTPS** - All API calls use secure connections
3. **Token rotation** - Regenerate tokens periodically for security
4. **Revoke access** - Clear extension config or regenerate token to stop syncing

## Next Steps

After successful installation:

1. Monitor the first sync to ensure data appears correctly
2. Check your learning platform for synced calendar events and grades
3. Set up automatic refresh/sync if needed
4. Consider adding background sync with alarms API

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase SQL schema is correctly installed
3. Confirm RLS policies are active
4. Test the `get_user_id_from_sync_token` function manually in Supabase
