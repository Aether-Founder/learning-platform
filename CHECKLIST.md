# ✅ Supabase Migration Checklist

Print this or keep it open while working through the setup!

---

## 📋 Part 1: Your Tasks (15 minutes)

### Step 1: Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Click "Start your project"
- [ ] Sign in with GitHub, Google, or Email
- [ ] Verify email if needed

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 2: Create New Project
- [ ] Click "New Project" button
- [ ] Choose or create an organization
- [ ] Fill in project details:
  - [ ] Name: `aether-study-platform` (or your choice)
  - [ ] Database Password: _________________ (save this!)
  - [ ] Region: `Europe West (eu-west-1)` ✅ Recommended for NL
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for provisioning

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 3: Get API Keys
- [ ] Project is fully loaded (green checkmark)
- [ ] Click ⚙️ **Settings** in sidebar
- [ ] Click **API** in settings menu
- [ ] Copy **Project URL**: 
  ```
  https://_________________.supabase.co
  ```
- [ ] Copy **anon public** key:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________
  ```
- [ ] Copy **service_role** key:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________
  ```
- [ ] Save these in a secure note or password manager

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 4: Run Database Schema
- [ ] Click 📝 **SQL Editor** in sidebar
- [ ] Click **+ New query** button
- [ ] Open file: `supabase-schema.sql` from project folder
- [ ] Copy **ALL** content (Ctrl+A, Ctrl+C)
- [ ] Paste into Supabase SQL Editor (Ctrl+V)
- [ ] Click **Run** button (or press Ctrl+Enter)
- [ ] Wait for execution (15-30 seconds)
- [ ] See success message: ✅ "Success. No rows returned"

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 5: Verify Tables Created
- [ ] Click 🗂️ **Table Editor** in sidebar
- [ ] You should see these 11 tables:
  - [ ] users
  - [ ] subjects
  - [ ] study_sets
  - [ ] flashcards
  - [ ] study_sessions
  - [ ] card_reviews
  - [ ] achievements
  - [ ] calendar_events
  - [ ] bookmarks
  - [ ] reading_progress
  - [ ] analytics_events

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 6: Configure Authentication
- [ ] Click 🔐 **Authentication** in sidebar
- [ ] Click **Providers** tab
- [ ] Find **Email** provider
- [ ] Make sure toggle is **ON** (enabled)
- [ ] (Optional) Disable "Confirm email" for easier testing
- [ ] Click **Save** if you made changes

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

### Step 7: Send Information to Developer
- [ ] Fill out this form and send:

```
SUPABASE CREDENTIALS
====================

Project URL: https://_________________.supabase.co

Anon Key: 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________

Service Role Key: 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________

Authentication Methods:
[✓] Email/Password
[ ] Google OAuth
[ ] GitHub OAuth
[ ] Other: _________________

Special Requests or Questions:
_________________________________________________
_________________________________________________
```

**Status**: ⬜ Not started | ⬜ In progress | ⬜ Done

---

## 🎯 Part 2: Developer Tasks (3-4 hours)

### Phase 1: Setup & Configuration
- [ ] Receive credentials from you
- [ ] Install Supabase packages
- [ ] Create `.env.local` file with credentials
- [ ] Setup Supabase client configuration
- [ ] Generate TypeScript types from database

**ETA**: 30 minutes

---

### Phase 2: Authentication Migration
- [ ] Remove custom JWT authentication
- [ ] Replace with Supabase Auth
- [ ] Update `/app/api/auth/login` route
- [ ] Update `/app/api/auth/register` route
- [ ] Update `/app/api/auth/logout` route
- [ ] Create auth middleware for protected routes
- [ ] Update session management
- [ ] Test login/logout flow

**ETA**: 1.5 hours

---

### Phase 3: Database Migration
- [ ] Remove SQLite (`better-sqlite3`)
- [ ] Remove `bcrypt` dependency
- [ ] Remove `jsonwebtoken` dependency
- [ ] Create Supabase query helpers
- [ ] Update `/app/api/analytics/*` routes
- [ ] Update `/app/api/calendar/*` routes
- [ ] Update `/app/api/achievements/*` routes
- [ ] Update frontend data fetching

**ETA**: 2 hours

---

### Phase 4: Data Import
- [ ] Create import script for `content/*.json` files
- [ ] Map JSON structure to database tables
- [ ] Import all subjects
- [ ] Import all study sets
- [ ] Import all flashcards
- [ ] Create demo user account
- [ ] Verify data integrity

**ETA**: 1 hour

---

### Phase 5: Testing
- [ ] Test locally with `npm run dev`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test dashboard loading
- [ ] Test subject pages
- [ ] Test flashcard study mode
- [ ] Test progress tracking
- [ ] Test analytics
- [ ] Test calendar/agenda
- [ ] Test on mobile (responsive)
- [ ] Fix any bugs found

**ETA**: 1 hour

---

### Phase 6: Deployment
- [ ] Add environment variables to Vercel
- [ ] Deploy to production
- [ ] Test production build
- [ ] Verify all features work
- [ ] Monitor for errors
- [ ] Update documentation

**ETA**: 30 minutes

---

## 📊 Progress Tracker

```
YOUR TASKS (Part 1)
[▓▓▓▓▓▓▓░░░] 0/7 steps complete (0%)

DEVELOPER TASKS (Part 2)
[░░░░░░░░░░] 0/6 phases complete (0%)

OVERALL PROGRESS
[░░░░░░░░░░] 0% Complete
```

Update this as you go! 🎯

---

## 🆘 Troubleshooting

### Problem: Can't create Supabase project
**Solution**: 
- Try different browser
- Clear cache and cookies
- Use incognito mode
- Make sure you're signed in

### Problem: SQL script shows errors
**Solution**: 
- Make sure you copied the ENTIRE file
- Check there are no missing characters
- Try running in smaller chunks
- Copy error message and send to developer

### Problem: Tables don't appear
**Solution**: 
- Refresh the page
- Check SQL Editor for errors
- Make sure script finished running
- Look in "public" schema

### Problem: Lost database password
**Solution**: 
- Go to Settings → Database
- Click "Reset database password"
- Generate new password

---

## ⏰ Time Estimates

| Task | Estimated Time | Actual Time |
|------|---------------|-------------|
| Create Supabase account | 2 minutes | _____ |
| Create project | 3 minutes | _____ |
| Get API keys | 2 minutes | _____ |
| Run SQL schema | 3 minutes | _____ |
| Verify tables | 2 minutes | _____ |
| Configure auth | 3 minutes | _____ |
| Send credentials | 1 minute | _____ |
| **TOTAL (Your part)** | **~15 minutes** | **_____** |

---

## 📝 Notes & Observations

Use this space to write down any issues, questions, or observations:

```
Date: ___________

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## ✅ Completion Confirmation

### Once Everything is Done:

- [ ] I can access the app at: https://_________________.vercel.app
- [ ] I can register a new account
- [ ] I can log in successfully
- [ ] I see my personalized dashboard
- [ ] I can browse subjects
- [ ] I can study flashcards
- [ ] My progress is tracked
- [ ] I can add calendar events
- [ ] Analytics show my data
- [ ] App works on mobile

### Final Sign-off:

**Date Completed**: ___________

**Tested By**: ___________

**Status**: ⬜ Success | ⬜ Issues (describe below)

**Issues/Feedback**:
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🎉 Congratulations!

Your study platform is now:
- ☁️ Cloud-powered
- 🔐 Secure
- 📱 Multi-device
- 🚀 Production-ready
- 🆓 Free to use

**You're ready to ace those exams!** 📚✨

---

**Print this checklist and tick off items as you complete them!**
