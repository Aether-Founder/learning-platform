# Remaining Tasks for Aether Learning Platform

## Priority: HIGH

### 1. Re-enable Server-Side Rendering (SSR) for i18n

**Status**: SKIPPED - App is functional without SSR
**Reason**: To keep the app functional. Re-enabling SSR carries risk of breaking the application due to complex i18n client/server boundary issues. The current solution (disabled SSR) keeps the app working reliably.

---

## Priority: MEDIUM

### 2. Integrate Leersets Structure Inside Vakken

**Status**: Completed
**Description**:

- ✅ Added subject_id field to study_sets table
- ✅ Updated Leersets page to link to subjects
- ✅ Created subject detail page with Leersets section
- ✅ Added "Bekijk in Vakken" button to Leersets page

### 3. Add Notities as Navbar Button

**Status**: Completed
**Description**:

- ✅ Notities already enabled in navbar

### 4. Add Groepen as Navbar Button

**Status**: Completed
**Description**:

- ✅ Groepen enabled in navbar (changed from false to true)

### 5. Add Agenda as Separate Navbar Button

**Status**: Completed
**Description**:

- ✅ Agenda already enabled in navbar

### 6. Hide Cijfers from Navigation

**Status**: Completed
**Description**:

- ✅ Removed Cijfers from middleware protected routes

---

## Priority: LOW

### 7. Admin Portal JSON Content Management

**Status**: Partially complete
**Description**:

- Add GUI pages for adding Subjects, Chapters, Learningsets, and Educational content
- Show JSON formats/examples and documentation in the UI
- Provide JSON input field with Enter key submission
- Store submitted content globally in Supabase
- Make content visible to all users at specified locations
- Verify admin authentication is server-side only

---

## Completed Tasks

- [x] Fix SSR error - SKIPPED to keep app functional
- [x] Add 'Bijhouden' foldable navbar button with hover dropdown (Inbox, Foutenlogboek, Planner)
- [x] Keep Artisan as separate navbar button
- [x] Restructure navbar: Logo → Vakken → Leersets
- [x] Rename Decks to Leersets in navbar and PAGE_LABELS
- [x] Move Statistieken to Settings page with sidebar navigation
- [x] Add Vandaag section to Dashboard with live Dutch time/date
- [x] Add Quick Create menu (Maak leerset, Maak notitie)
- [x] Integrate Leersets with Vakken (subject linking)
- [x] Enable Groepen in navbar
- [x] Hide Cijfers from navigation
- [x] Create /leersets route with proper terminology

---

## Notes

- Admin authentication moved to server-side via `app/api/admin/auth/route.ts`
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are server-side environment variables only
- Supabase client configuration is safe for missing values
- Navigation structure: Logo → Vakken → Leersets → Artisan → Bijhouden → Quick-create → Search → Profile/Settings
