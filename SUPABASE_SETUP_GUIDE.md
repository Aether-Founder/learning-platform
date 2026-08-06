# Supabase Integration Setup Guide

## 🎯 Project Overview

We're converting your study platform from SQLite to **Supabase** (PostgreSQL), enabling:
- ✅ Real-time database with cloud hosting
- ✅ Built-in authentication system
- ✅ Row-level security (RLS)
- ✅ Auto-generated REST APIs
- ✅ Real-time subscriptions
- ✅ File storage for future features

---

## 📋 Required Information from You

Please provide the following information from your Supabase project:

### 1. **Supabase Project Details**
- [ ] **Project URL**: `https://[your-project-ref].supabase.co`
- [ ] **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Service Role Key** (optional, for admin operations): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. **Project Configuration**
- [ ] Region: (e.g., `eu-west-1`, `us-east-1`)
- [ ] Database password: (if you need direct database access)

### 3. **Authentication Settings**
Which authentication methods do you want to enable?
- [ ] Email/Password (recommended ✅)
- [ ] Magic Link (email)
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] Other providers?

---

## 🔍 How to Find Your Supabase Keys

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard

### Step 2: Select Your Project
If you don't have a project yet:
1. Click "New Project"
2. Choose organization
3. Name it (e.g., "aether-study-platform")
4. Generate a strong database password
5. Select region (choose closest to Netherlands for best performance)

### Step 3: Get API Keys
1. Click on your project
2. Go to **Settings** (gear icon) → **API**
3. Find these values:
   - **Project URL**: Under "Configuration"
   - **anon public key**: Under "Project API keys"
   - **service_role key**: Under "Project API keys" (keep this secret!)

### Step 4: Screenshot or Copy
Take a screenshot or copy these values securely. We'll add them to `.env.local` file.

---

## 🗄️ Database Schema We'll Create

### Tables

#### 1. **users** (extends Supabase auth.users)
```sql
- id (uuid, primary key, references auth.users)
- username (text, unique)
- full_name (text)
- grade_level (text) -- e.g., "VWO 4"
- track (text) -- e.g., "Natuur & Techniek"
- avatar_url (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. **subjects**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- name (text) -- e.g., "Natuurkunde"
- slug (text) -- e.g., "natuurkunde"
- level (text) -- e.g., "VWO 4"
- color (text, optional)
- icon (text, optional)
- mastery (integer, 0-100)
- topics (integer)
- topics_done (integer)
- due_count (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. **study_sets**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- subject_id (uuid, references subjects)
- title (text)
- description (text, optional)
- content_json (jsonb) -- stores the flashcard content
- is_public (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. **flashcards**
```sql
- id (uuid, primary key)
- study_set_id (uuid, references study_sets)
- question (text)
- answer (text)
- number (text) -- e.g., "Q1", "Q2"
- difficulty (text) -- easy, medium, hard
- order_index (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 5. **study_sessions**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- study_set_id (uuid, references study_sets)
- subject_id (uuid, references subjects)
- started_at (timestamp)
- ended_at (timestamp, nullable)
- duration_minutes (integer)
- cards_studied (integer)
- cards_correct (integer)
- cards_incorrect (integer)
- created_at (timestamp)
```

#### 6. **card_reviews**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- flashcard_id (uuid, references flashcards)
- session_id (uuid, references study_sessions)
- was_correct (boolean)
- time_spent_seconds (integer)
- reviewed_at (timestamp)
- next_review_date (timestamp)
```

#### 7. **achievements**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- achievement_type (text)
- title (text)
- description (text)
- icon (text)
- unlocked_at (timestamp)
```

#### 8. **calendar_events**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- subject_id (uuid, references subjects, nullable)
- title (text)
- description (text, optional)
- event_type (text) -- toets, examen, huiswerk, les
- event_date (date)
- event_time (time, nullable)
- location (text, optional)
- is_completed (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 9. **bookmarks**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- study_set_id (uuid, references study_sets)
- paragraph_id (text)
- note (text, optional)
- created_at (timestamp)
```

#### 10. **reading_progress**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- study_set_id (uuid, references study_sets)
- paragraph_id (text)
- percentage (integer, 0-100)
- last_position (text, optional)
- updated_at (timestamp)
```

#### 11. **analytics_events**
```sql
- id (uuid, primary key)
- user_id (uuid, references users)
- event_type (text) -- page_view, session_start, session_end, card_flip, etc.
- event_data (jsonb)
- created_at (timestamp)
```

---

## 🔐 Row Level Security (RLS) Policies

We'll enable RLS on all tables to ensure users can only access their own data:

```sql
-- Example for study_sets table
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;

-- Users can read their own sets and public sets
CREATE POLICY "Users can view own and public sets"
ON study_sets FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own sets
CREATE POLICY "Users can insert own sets"
ON study_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sets
CREATE POLICY "Users can update own sets"
ON study_sets FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own sets
CREATE POLICY "Users can delete own sets"
ON study_sets FOR DELETE
USING (auth.uid() = user_id);
```

---

## 📦 Dependencies We'll Add

```json
{
  "@supabase/supabase-js": "^2.45.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-ui-react": "^0.4.7",
  "@supabase/auth-ui-shared": "^0.1.8"
}
```

---

## 🔧 Environment Variables (.env.local)

We'll create this file with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Aether Study Platform

# Optional: For production
# NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 🚀 Implementation Plan

### Phase 1: Setup & Configuration (30 minutes)
1. ✅ Get Supabase credentials from you
2. ✅ Install Supabase dependencies
3. ✅ Create `.env.local` with credentials
4. ✅ Setup Supabase client configuration
5. ✅ Create database schema (tables + RLS policies)

### Phase 2: Authentication System (1-2 hours)
1. ✅ Replace custom JWT auth with Supabase Auth
2. ✅ Create login page with Supabase Auth UI
3. ✅ Create registration page
4. ✅ Setup middleware for protected routes
5. ✅ Create user profile management
6. ✅ Implement logout functionality

### Phase 3: Database Layer (2-3 hours)
1. ✅ Remove SQLite (`better-sqlite3`)
2. ✅ Create Supabase database helpers
3. ✅ Migrate all API routes to use Supabase:
   - `/api/auth/*` → Use Supabase Auth
   - `/api/analytics/*` → Query Supabase tables
   - `/api/achievements/*` → Query Supabase tables
   - `/api/calendar/*` → Query Supabase tables
4. ✅ Create database query functions
5. ✅ Setup real-time subscriptions (optional)

### Phase 4: Data Migration (1 hour)
1. ✅ Import existing content JSON files to database
2. ✅ Create seed data for testing
3. ✅ Setup demo user account

### Phase 5: Testing & Validation (1 hour)
1. ✅ Test authentication flow
2. ✅ Test study session tracking
3. ✅ Test analytics dashboard
4. ✅ Test all CRUD operations
5. ✅ Verify RLS policies work correctly

### Phase 6: Deployment (30 minutes)
1. ✅ Add Supabase env vars to Vercel
2. ✅ Deploy to Vercel
3. ✅ Test production build

**Total Estimated Time**: 5-7 hours

---

## ✅ Pre-Migration Checklist

Before we start coding:

- [ ] I have a Supabase account (free tier is fine)
- [ ] I have created a Supabase project
- [ ] I have copied the Project URL
- [ ] I have copied the anon public key
- [ ] I have copied the service_role key (optional but recommended)
- [ ] I want email/password authentication (recommended)
- [ ] I understand this will replace the current SQLite database
- [ ] I have backed up any important local data (if any)

---

## 🎓 What You'll Get

After completion, your platform will have:

### ✅ **Authentication**
- Secure user registration and login
- Email verification (optional)
- Password reset functionality
- Session management
- Protected routes

### ✅ **User Features**
- Personal dashboard
- Study progress tracking
- Achievement system
- Calendar/agenda management
- Bookmarks and reading progress
- Custom study sets

### ✅ **Analytics**
- Study session tracking
- Time spent per subject
- Card accuracy statistics
- Progress over time
- Admin analytics dashboard

### ✅ **Content Management**
- Create/edit/delete study sets
- Import from JSON files
- Share sets with other users (public sets)
- Organize by subject and topic

### ✅ **Performance**
- Fast real-time queries
- Automatic caching
- Optimistic UI updates
- Scalable to 1000s of users

---

## 📞 Next Steps

**Please provide me with:**

1. ✅ Supabase Project URL
2. ✅ Supabase Anon Key
3. ✅ Supabase Service Role Key (optional)
4. ✅ Preferred authentication method(s)
5. ✅ Any specific requirements or features you want

**Once you provide these, I will:**
1. Create all database tables and RLS policies in Supabase
2. Update all code to use Supabase
3. Migrate authentication system
4. Test everything locally
5. Prepare for deployment

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## ⚠️ Important Notes

1. **Backup First**: Although we're not deleting files, make sure you're okay with the changes
2. **Development First**: We'll test everything locally before deploying
3. **Free Tier Limits**: Supabase free tier includes:
   - 500MB database space
   - 1GB file storage
   - 50,000 monthly active users
   - Unlimited API requests
4. **Security**: Never commit `.env.local` to git (already in `.gitignore`)
5. **Migration**: Your existing JSON content files will remain and can be imported

---

**Ready to start? Please provide your Supabase credentials and let me know! 🚀**
