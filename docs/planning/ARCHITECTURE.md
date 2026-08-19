# 🏗️ Aether Study Platform - Architecture Overview

## Current vs New Architecture

### 📦 BEFORE (Current - SQLite)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)              Backend (API Routes)          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Pages       │─────────────▶│  /api/auth   │            │
│  │  Components  │              │  /api/analytics│           │
│  │  Hooks       │              │  /api/calendar│            │
│  └──────────────┘              └───────┬────────┘           │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐           │
│                              │   JWT + bcrypt   │           │
│                              │   (Custom Auth)  │           │
│                              └─────────┬────────┘           │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐           │
│                              │  SQLite Database │           │
│                              │  (better-sqlite3)│           │
│                              │  ❌ Local only   │           │
│                              │  ❌ No RLS       │           │
│                              │  ❌ Manual setup │           │
│                              └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Problems with current setup:**

- ❌ Database is local (can't share between devices)
- ❌ No real authentication (custom JWT implementation)
- ❌ No data security (Row Level Security)
- ❌ Manual database migrations
- ❌ Can't scale to multiple users
- ❌ No real-time features
- ❌ Data backup is manual

---

### ✨ AFTER (New - Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)                                            │
│  ┌──────────────┐                                           │
│  │  Pages       │                                           │
│  │  Components  │                                           │
│  │  Hooks       │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Supabase Client  │                                       │
│  │ (@supabase/js)   │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ HTTPS (Secure API calls)
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ☁️ Supabase Cloud                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             🔐 Supabase Auth                          │  │
│  │  ✅ Email/Password, OAuth, Magic Links               │  │
│  │  ✅ JWT tokens (automatic)                           │  │
│  │  ✅ Session management                               │  │
│  │  ✅ Password reset, email verification              │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────▼────────────────────────────┐  │
│  │           📊 PostgreSQL Database                      │  │
│  │                                                        │  │
│  │  Tables (11 total):                                  │  │
│  │  ├─ users (extends auth.users)                      │  │
│  │  ├─ subjects (Natuurkunde, Wiskunde, etc.)         │  │
│  │  ├─ study_sets (flashcard collections)             │  │
│  │  ├─ flashcards (Q&A pairs)                         │  │
│  │  ├─ study_sessions (tracking)                      │  │
│  │  ├─ card_reviews (spaced repetition)              │  │
│  │  ├─ achievements (badges, milestones)             │  │
│  │  ├─ calendar_events (agenda)                      │  │
│  │  ├─ bookmarks                                     │  │
│  │  ├─ reading_progress                             │  │
│  │  └─ analytics_events                             │  │
│  │                                                    │  │
│  │  ✅ Row Level Security (RLS) on all tables       │  │
│  │  ✅ Automatic backups                            │  │
│  │  ✅ Real-time subscriptions                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │        🔄 Real-time Engine (optional)             │   │
│  │  - Live updates when data changes                │   │
│  │  - Collaborative features                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │        📁 Storage (for future features)           │   │
│  │  - Profile pictures                              │   │
│  │  - Uploaded content                              │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

**Benefits of new setup:**

- ✅ Cloud-hosted (access from any device)
- ✅ Professional authentication (Supabase Auth)
- ✅ Row Level Security (data automatically isolated per user)
- ✅ Automatic migrations via SQL
- ✅ Scales to unlimited users
- ✅ Real-time updates (optional)
- ✅ Automatic backups
- ✅ Built-in API (no need for custom API routes)

---

## 🔄 Data Flow Examples

### Example 1: User Login

**Before (SQLite):**

```
1. User enters email/password
2. Frontend sends to /api/auth/login
3. Backend queries SQLite for user
4. Backend manually hashes password with bcrypt
5. Backend creates JWT token manually
6. Frontend stores JWT in localStorage
```

**After (Supabase):**

```
1. User enters email/password
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase handles everything (secure, automatic)
4. Returns user session + JWT automatically
5. Frontend gets authenticated user
```

**Code comparison:**

```typescript
// BEFORE (30+ lines of custom code in API route)
export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const valid = await bcrypt.compare(password, user.password_hash);
  const token = jwt.sign({ userId: user.id }, SECRET_KEY);
  return Response.json({ token });
}

// AFTER (2 lines!)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

---

### Example 2: Getting User's Study Sets

**Before (SQLite):**

```
1. Frontend sends request to /api/study-sets
2. Backend validates JWT token manually
3. Backend queries SQLite: SELECT * FROM study_sets WHERE user_id = ?
4. Backend returns data
```

**After (Supabase):**

```
1. Frontend calls supabase.from('study_sets').select('*')
2. Supabase automatically:
   - Validates user session
   - Applies RLS policy (only returns user's own data)
   - Returns data
```

**Code comparison:**

```typescript
// BEFORE (API route + validation)
export async function GET(req: Request) {
  const token = req.headers.get('Authorization');
  const userId = validateJWT(token); // Manual validation
  const sets = db.prepare('SELECT * FROM study_sets WHERE user_id = ?').all(userId);
  return Response.json(sets);
}

// AFTER (Direct from frontend, no API route needed!)
const { data: studySets } = await supabase.from('study_sets').select('*').eq('user_id', user.id); // RLS automatically enforces this!
```

---

### Example 3: Tracking Study Session

**Before (SQLite):**

```
1. User finishes study session
2. Frontend calculates stats
3. Frontend sends to /api/analytics/track
4. Backend validates JWT
5. Backend inserts into SQLite
6. Backend updates subject mastery manually
```

**After (Supabase):**

```
1. User finishes study session
2. Frontend calls supabase.from('study_sessions').insert()
3. Supabase automatically:
   - Validates user (via RLS)
   - Inserts data
   - Can trigger database functions for mastery calculation
```

---

## 🗂️ File Structure After Migration

```
my-study-platform/
├── app/
│   ├── (auth)/                    # Auth pages
│   │   ├── login/
│   │   │   └── page.tsx          # Login form with Supabase
│   │   ├── register/
│   │   │   └── page.tsx          # Registration with Supabase
│   │   └── reset-password/
│   │       └── page.tsx          # Password reset
│   │
│   ├── (dashboard)/              # Protected pages
│   │   ├── page.tsx              # Main dashboard
│   │   ├── vakken/
│   │   ├── agenda/
│   │   └── ...
│   │
│   ├── api/                      # Minimal API routes
│   │   ├── webhook/              # For Supabase webhooks (optional)
│   │   └── migrate/              # Data migration helpers
│   │
│   └── layout.tsx                # Root layout with Supabase provider
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   ├── middleware.ts         # Auth middleware
│   │   └── types.ts              # Database types (auto-generated)
│   │
│   ├── hooks/
│   │   ├── useSupabase.ts        # Supabase hook
│   │   ├── useUser.ts            # Current user hook
│   │   └── useStudySets.ts       # Study sets hook
│   │
│   └── queries/
│       ├── subjects.ts           # Subject queries
│       ├── studySets.ts          # Study set queries
│       └── analytics.ts          # Analytics queries
│
├── types/
│   └── database.types.ts         # Generated from Supabase
│
├── .env.local                     # Supabase credentials (gitignored)
├── supabase-schema.sql           # Database schema
├── SUPABASE_SETUP_GUIDE.md       # Setup instructions
└── package.json
```

---

## 🔐 Security Improvements

### Row Level Security (RLS) Example

**What it does:** Automatically filters data so users only see their own data

```sql
-- This policy on study_sets table ensures:
CREATE POLICY "Users can view own and public sets"
  ON study_sets FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);
```

**Result:**

- When User A queries study_sets, they ONLY see their own sets + public sets
- When User B queries study_sets, they ONLY see their own sets + public sets
- No manual filtering needed in code!
- Impossible to accidentally leak data

### Authentication Security

**Before:**

- Custom JWT implementation (potential security holes)
- Manual password hashing (need to update bcrypt)
- Manual session management
- No email verification
- No password reset flow

**After:**

- Industry-standard OAuth 2.0 + JWT
- Automatic password hashing (secure by default)
- Automatic session management
- Built-in email verification
- Built-in password reset
- Multi-factor auth (MFA) ready
- Rate limiting included

---

## 📊 Performance Comparison

| Feature              | SQLite (Before) | Supabase (After)              |
| -------------------- | --------------- | ----------------------------- |
| **Query Speed**      | Fast (local)    | Very fast (optimized, cached) |
| **Concurrent Users** | 1 (local only)  | Unlimited                     |
| **Data Sync**        | None            | Real-time                     |
| **Backup**           | Manual          | Automatic daily               |
| **Scaling**          | Can't scale     | Auto-scales                   |
| **Database Size**    | Limited by disk | 500MB-8GB+ (upgradable)       |
| **API Latency**      | ~0ms (local)    | ~50-100ms (cloud)             |
| **Setup Time**       | Complex         | Simple                        |

---

## 🚀 Deployment Flow

### Before (Complex):

```
1. Build Next.js app
2. Include SQLite database file
3. Deploy to Vercel
4. Database is read-only in production (problem!)
5. Need separate database solution
```

### After (Simple):

```
1. Build Next.js app
2. Add Supabase env vars to Vercel
3. Deploy to Vercel
4. Everything works! ✅
5. Database is in cloud (readable and writable)
```

---

## 💰 Cost Comparison

### Current (SQLite):

- Free (local development only)
- Can't deploy as-is to production
- Would need paid database service anyway

### Supabase:

- **Free tier**: Perfect for your use case!
  - 500MB database (thousands of flashcards)
  - 50,000 monthly active users
  - 5GB bandwidth
  - Unlimited API requests
  - 2GB file storage
- **Paid tier** ($25/month if you outgrow free tier):
  - 8GB database
  - 100,000 MAU
  - 250GB bandwidth

**Verdict:** Free tier is more than enough! 🎉

---

## ✅ Summary

### What We're Replacing:

- ❌ SQLite → ✅ PostgreSQL (Supabase)
- ❌ Custom JWT auth → ✅ Supabase Auth
- ❌ API routes → ✅ Direct database access (with RLS)
- ❌ Manual security → ✅ Automatic RLS policies
- ❌ Local only → ✅ Cloud-hosted

### What Stays the Same:

- ✅ Next.js framework
- ✅ React components
- ✅ UI/UX design
- ✅ Study content (JSON files)
- ✅ All existing features

### New Capabilities:

- 🆕 Multi-device sync
- 🆕 Real-time updates
- 🆕 Better security
- 🆕 Scalable to many users
- 🆕 Professional authentication
- 🆕 Cloud backups
- 🆕 Analytics dashboard

---

**Ready to start? Follow the QUICK_START.md guide!** 🚀
