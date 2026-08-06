# 🚀 Quick Start Guide - Supabase Integration

## Step-by-Step Instructions

### 1️⃣ Create Supabase Project (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `aether-study-platform` (or any name you want)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose `Europe West (eu-west-1)` for best performance in Netherlands
4. Click "Create new project" and wait 2-3 minutes

---

### 2️⃣ Get Your API Keys (2 minutes)

1. Once project is ready, click on **Settings** (⚙️ gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see:
   - **Project URL**: Copy this (looks like `https://abcdefgh.supabase.co`)
   - **Project API keys**:
     - `anon` `public` key: Copy this long string
     - `service_role` key: Copy this too (keep it secret!)

📋 **Copy these three items** and paste them here or in a secure note:

```
Project URL: 
Anon Key: 
Service Role Key: 
```

---

### 3️⃣ Run Database Schema (5 minutes)

1. In Supabase dashboard, click **SQL Editor** (📝 icon in sidebar)
2. Click **+ New query**
3. Open the file `supabase-schema.sql` from your project
4. Copy ALL the SQL code
5. Paste it in the Supabase SQL Editor
6. Click **Run** button (or press Ctrl+Enter)
7. You should see: ✅ Success message

**Verify**: Click **Table Editor** in sidebar - you should see 11 tables:
- users
- subjects
- study_sets
- flashcards
- study_sessions
- card_reviews
- achievements
- calendar_events
- bookmarks
- reading_progress
- analytics_events

---

### 4️⃣ Configure Authentication (3 minutes)

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Email** provider
3. Make sure it's **enabled** (toggle should be ON)
4. Scroll down and **disable** "Confirm email" if you want easier testing
   - Or keep it enabled for production security
5. Click **Save**

**Optional**: Enable other providers (Google, GitHub) if you want

---

### 5️⃣ Send Me Your Credentials

Once you have completed steps 1-4, please provide:

```
✅ Supabase Project URL: _______________________
✅ Anon Public Key: _______________________
✅ Service Role Key: _______________________
✅ Authentication method preference: Email/Password (or others)
```

---

### 6️⃣ What I'll Do Next (Automated)

Once you provide the credentials, I will:

1. ✅ Create `.env.local` file with your credentials
2. ✅ Install Supabase packages (`@supabase/supabase-js`, etc.)
3. ✅ Create Supabase client configuration in `/lib/supabase/`
4. ✅ Update all `/app/api/*` routes to use Supabase
5. ✅ Replace authentication system with Supabase Auth
6. ✅ Create migration script to import your content JSON files
7. ✅ Test everything locally
8. ✅ Provide deployment instructions for Vercel

**Estimated time**: 3-4 hours of coding (automated by me)

---

## 📸 Screenshots Helper

If you're unsure where to find something, here's what to look for:

### Finding API Keys:
```
Supabase Dashboard
├── Your Project Name
│   └── Settings ⚙️
│       └── API
│           ├── Project URL: https://xxxxx.supabase.co
│           └── Project API keys
│               ├── anon public (safe to use in browser)
│               └── service_role (secret, server-only)
```

### Running SQL:
```
Supabase Dashboard
└── SQL Editor 📝
    ├── New query
    └── Paste the supabase-schema.sql content
        └── Run (or Ctrl+Enter)
```

---

## ⚠️ Important Notes

### Security
- ⚠️ **NEVER** share your `service_role` key publicly
- ✅ The `anon` key is safe to use in frontend code
- ✅ All data is protected by Row Level Security (RLS)

### Free Tier Limits
Your free tier includes:
- ✅ 500MB database storage (more than enough for thousands of flashcards)
- ✅ 5GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ 2GB file storage

### Testing
- We'll first test everything on `localhost:3000`
- Once confirmed working, we deploy to Vercel
- Your existing content JSON files won't be deleted

---

## 🆘 Troubleshooting

### Can't find Supabase dashboard?
- Go to https://supabase.com and click "Sign in"
- Log in with GitHub, Google, or email

### Project taking too long to create?
- Usually takes 2-3 minutes
- If stuck, try refreshing the page

### SQL query failed?
- Make sure you copied the ENTIRE `supabase-schema.sql` file
- Check if any red error messages appear
- Share the error message with me

### Lost your database password?
- You can reset it in Settings > Database > Database password

---

## ✅ Checklist

Before sending me credentials, make sure:

- [ ] Supabase project is created and fully loaded
- [ ] You have copied the Project URL
- [ ] You have copied the Anon public key
- [ ] You have copied the Service role key
- [ ] You ran the `supabase-schema.sql` in SQL Editor
- [ ] You see 11 tables in Table Editor
- [ ] Email authentication is enabled in Auth > Providers

---

## 📧 Ready? Send Me This Info:

```
Project URL: https://_____________.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.____________
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.____________

Auth Methods: [✓] Email/Password  [ ] Google  [ ] GitHub

Special requests: (any specific features or requirements?)
```

Once I receive this, I'll start the integration! 🚀
