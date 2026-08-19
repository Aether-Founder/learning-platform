# Client-Side Features Inventory for SSR Compatibility

This document lists all client-side browser APIs used throughout the codebase that need to be handled properly when re-enabling Server-Side Rendering (SSR).

## Summary Statistics
- **Total files using localStorage**: 30+ files
- **Total files using window object**: 25+ files
- **Total files using document object**: 20+ files
- **Total files using sessionStorage**: 3 files
- **Total files using navigator object**: 10+ files

---

## 1. localStorage Usage

### Critical Files (Most Usage)

#### lib/i18n-client.ts
**Lines**: 42, 77, 123, 175
**Usage**: 
- Storing/reading language preference
- Caching translations
- **SSR Impact**: HIGH - This is the main cause of the current SSR error
**Fix Status**: Partially fixed with 'use client' directive

#### app/dashboard/page.tsx
**Lines**: 93, 127, 128, 131, 132
**Usage**:
- Storing agenda events
- First-time visit tracking
- Username storage
**SSR Impact**: MEDIUM - Needs `typeof window !== 'undefined'` check

#### hooks/useNavbarPreferences.ts
**Lines**: 86, 106, 116
**Usage**:
- Storing navbar visibility preferences
**SSR Impact**: LOW - Already has proper checks

#### app/agenda/page.tsx
**Lines**: 81, 110, 195, 225
**Usage**:
- Storing agenda events
**SSR Impact**: MEDIUM - Needs proper guards

#### app/vakken/page.tsx
**Lines**: 130, 134, 138, 240
**Usage**:
- Storing subject preferences
- Grade setup completion tracking
**SSR Impact**: MEDIUM - Needs proper guards

#### app/notities/page.tsx
**Lines**: 190, 191, 264
**Usage**:
- Workspace preferences (font, spellcheck)
**SSR Impact**: MEDIUM - Needs proper guards

#### app/[page]/page.tsx
**Lines**: 205, 218, 245, 269, 303
**Usage**:
- View mode persistence
- Content caching
**SSR Impact**: MEDIUM - Needs proper guards

#### components/learning-platform/StandaloneLearningPlatform.tsx
**Lines**: 153, 185, 191, 198, 204, 211, 1743, 1749, 1752, 1754, 1755
**Usage**:
- User profile storage
- Study sets/folders storage
- Streak tracking
**SSR Impact**: HIGH - Extensive usage, needs comprehensive guards

### Moderate Usage Files

#### store/useWorkspaceStore.ts
**Lines**: 52, 54, 62
**Usage**: Workspace items persistence
**SSR Impact**: LOW - Has error handling

#### components/PlatformBanner.tsx
**Lines**: 25, 35, 52, 61
**Usage**: Banner state, onboarding tracking
**SSR Impact**: LOW - Properly guarded

#### components/RTLProvider.tsx
**Lines**: 19, 27
**Usage**: Language preference
**SSR Impact**: MEDIUM - Needs proper guards

### Authentication Token Storage (Should Use Cookies Instead)

The following files store authentication tokens in localStorage (security concern for SSR):

#### components/TestWeekWizard.tsx
**Line**: 86

#### components/TestResultAnalytics.tsx
**Lines**: 67, 91

#### components/TeacherDashboard.tsx
**Line**: 67

#### components/StudyPlanWizard.tsx
**Line**: 63

#### components/StudyModeComparison.tsx
**Line**: 34

#### components/StudyGoalTracking.tsx
**Lines**: 64, 84, 113, 133

#### components/StreakFreeze.tsx
**Line**: 52

#### components/PerformanceInsights.tsx
**Line**: 44

#### components/HomeworkWidget.tsx
**Lines**: 38, 66

#### components/HomeworkStreaks.tsx
**Line**: 40

#### components/HomeworkStatistics.tsx
**Line**: 49

#### components/HomePageClient.tsx
**Lines**: 52, 53, 62

#### components/GoalProgressTracking.tsx
**Lines**: 47, 67

#### components/FolderSystem.tsx
**Lines**: 54, 88, 114, 134

**Recommendation**: Move token storage to httpOnly cookies for better security and SSR compatibility

---

## 2. window Object Usage

### Event Listeners (Generally Safe with Proper Guards)

#### components/AppShell.tsx
**Lines**: 75, 76, 364, 365
**Usage**: 
- Mouse event listeners (dropdowns)
- Resize event listeners (responsive navbar)
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### app/[page]/page.tsx
**Lines**: 357, 364, 365, 373, 432, 434
**Usage**: Scroll event listeners
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### components/ui-kit.tsx
**Lines**: 186, 187, 385, 386, 388, 389
**Usage**: Keyboard and scroll listeners
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### components/StudyMode.tsx
**Lines**: 183, 184
**Usage**: Keyboard shortcuts
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### components/ScrollToTop.tsx
**Lines**: 11, 18, 19, 23
**Usage**: Scroll detection and scrolling
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### components/AdvancedLearningSystem.tsx
**Lines**: 284, 295, 296, 444
**Usage**: Keyboard shortcuts, setTimeout
**SSR Impact**: LOW - Already in useEffect with proper cleanup

### Window Properties (Need Guards)

#### app/page.tsx
**Line**: 313
**Usage**: `window.location.assign('/')`
**SSR Impact**: MEDIUM - Should use Next.js router instead

#### app/agenda/page.tsx
**Line**: 207
**Usage**: `window.confirm()`
**SSR Impact**: LOW - Already in event handler

#### app/vakken/[subjectId]/[chapterId]/page.tsx
**Line**: 239
**Usage**: `window.confirm()`
**SSR Impact**: LOW - Already in event handler

#### app/notities/page.tsx
**Lines**: 68, 173, 205, 237, 239, 247
**Usage**: setTimeout, getSelection
**SSR Impact**: MEDIUM - Needs proper guards

#### app/record/page.tsx
**Lines**: 20, 21
**Usage**: setInterval, clearInterval
**SSR Impact**: LOW - Already in useEffect with proper cleanup

#### lib/offline/sync.ts
**Lines**: 9, 14
**Usage**: online/offline event listeners
**SSR Impact**: MEDIUM - Needs proper guards

#### lib/data-sync.ts
**Lines**: 23, 28
**Usage**: online/offline event listeners
**SSR Impact**: MEDIUM - Needs proper guards

#### lib/analytics.ts
**Lines**: 125, 138, 159, 162, 191
**Usage**: Screen resolution, pathname, beforeunload
**SSR Impact**: MEDIUM - Needs proper guards

### Browser APIs

#### components/TestResultAnalytics.tsx
**Lines**: 100, 106
**Usage**: URL.createObjectURL, URL.revokeObjectURL
**SSR Impact**: LOW - Only used in client-side functions

#### components/StudySetSharing.tsx
**Line**: 31
**Usage**: `window.location.origin`
**SSR Impact**: MEDIUM - Should use Next.js config or relative URLs

#### components/ExportableReports.tsx
**Lines**: 43, 49
**Usage**: URL.createObjectURL, URL.revokeObjectURL
**SSR Impact**: LOW - Only used in client-side functions

#### components/CalendarExport.tsx
**Lines**: 66, 72, 99
**Usage**: URL.createObjectURL, URL.revokeObjectURL, window.open
**SSR Impact**: LOW - Only used in client-side functions

#### components/AuthModal.tsx
**Line**: 148
**Usage**: `window.location.href`
**SSR Impact**: MEDIUM - Should use Next.js router

#### components/AchievementNotifications.tsx
**Line**: 122
**Usage**: `window.location.href`
**SSR Impact**: MEDIUM - Should use Next.js router

#### lib/supabase/auth.ts
**Line**: 84
**Usage**: `window.location.origin`
**SSR Impact**: MEDIUM - Should use Next.js config

#### trellis-core/ArtisanTracker.tsx
**Line**: 205
**Usage**: `window.location.reload()`
**SSR Impact**: LOW - Only in event handler

---

## 3. document Object Usage

### DOM Manipulation (Generally Safe with Proper Guards)

#### lib/i18n-client.ts
**Line**: 60
**Usage**: `document.documentElement.lang`
**SSR Impact**: HIGH - This is part of the SSR error cause
**Fix Status**: Partially fixed with 'use client' directive

#### components/I18nProvider.tsx
**Lines**: 36, 37, 39
**Usage**: lang, dir, title
**SSR Impact**: HIGH - This is part of the SSR error cause
**Fix Status**: Partially fixed with 'use client' directive

#### app/decks/page.tsx
**Lines**: 274, 277, 279, 289, 292, 294
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in event handlers

#### app/admin/artisan/page.tsx
**Lines**: 88, 91, 93
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in event handlers

#### app/notities/page.tsx
**Lines**: 170, 227, 229, 252, 254
**Usage**: Range selection, execCommand
**SSR Impact**: MEDIUM - Text editing features need proper guards

#### app/[page]/page.tsx
**Lines**: 358, 379, 395, 397
**Usage**: scrollHeight, getElementById, querySelector
**SSR Impact**: MEDIUM - Scroll tracking needs proper guards

#### components/RTLProvider.tsx
**Lines**: 26, 27
**Usage**: dir, lang
**SSR Impact**: MEDIUM - Needs proper guards

#### components/learning-platform/StandaloneLearningPlatform.tsx
**Lines**: 281, 283, 470, 472
**Usage**: body.style.overflow
**SSR Impact**: LOW - Modal backdrop, already in useEffect

#### components/learning-platform/games/BlastGame.tsx
**Line**: 15
**Usage**: classList.contains
**SSR Impact**: LOW - Theme detection

#### components/header.tsx
**Lines**: 163, 166, 168
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in event handlers

#### components/ExportableReports.tsx
**Lines**: 44, 47, 50
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in event handlers

#### components/CalendarExport.tsx
**Lines**: 67, 70, 73
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in event handlers

#### utils/exportUtils.ts
**Lines**: 37, 40, 42, 60, 63, 65
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in utility functions

#### utils/csvUtils.ts
**Lines**: 93, 100, 102
**Usage**: Creating and removing links for downloads
**SSR Impact**: LOW - Only in utility functions

#### lib/analytics.ts
**Line**: 139
**Usage**: document.referrer
**SSR Impact**: MEDIUM - Analytics needs proper guards

#### lib/supabase/client.ts
**Lines**: 24, 45
**Usage**: document.cookie
**SSR Impact**: HIGH - Cookie access, needs server-side alternative

---

## 4. sessionStorage Usage

### Authentication Draft Storage

#### app/(auth)/register/page.tsx
**Lines**: 26, 28, 57, 58, 127, 128
**Usage**: Draft email/password persistence
**SSR Impact**: MEDIUM - Has `typeof window !== 'undefined'` checks

#### app/(auth)/login/page.tsx
**Lines**: 28, 34, 45, 52, 71, 72
**Usage**: Draft email/password persistence
**SSR Impact**: MEDIUM - Needs `typeof window !== 'undefined'` checks

### Analytics

#### lib/analytics.ts
**Lines**: 50, 53
**Usage**: Session ID tracking
**SSR Impact**: MEDIUM - Needs proper guards

---

## 5. navigator Object Usage

### Browser Capabilities

#### lib/offline/sync.ts
**Line**: 5
**Usage**: navigator.onLine
**SSR Impact**: MEDIUM - Needs proper guards

#### lib/data-sync.ts
**Line**: 21
**Usage**: navigator.onLine
**SSR Impact**: MEDIUM - Needs proper guards

#### lib/i18n-location.ts
**Lines**: 177, 179, 241
**Usage**: navigator.languages
**SSR Impact**: MEDIUM - Needs proper guards

#### lib/analytics.ts
**Lines**: 123, 124
**Usage**: navigator.userAgent, navigator.language
**SSR Impact**: MEDIUM - Needs proper guards

### Clipboard API

#### components/StudySetSharing.tsx
**Lines**: 36, 46, 55, 57
**Usage**: Clipboard.writeText, navigator.share
**SSR Impact**: LOW - Only in event handlers

#### components/learning-platform/StudySetTools.tsx
**Line**: 80
**Usage**: navigator.clipboard.writeText
**SSR Impact**: LOW - Only in event handler

#### components/header.tsx
**Line**: 92
**Usage**: navigator.clipboard.writeText
**SSR Impact**: LOW - Only in event handler

#### components/AchievementNotifications.tsx
**Lines**: 118, 119
**Usage**: navigator.share
**SSR Impact**: LOW - Only in event handler

#### app/[page]/copy/page.tsx
**Line**: 33
**Usage**: navigator.clipboard.writeText
**SSR Impact**: LOW - Only in event handler

### Media Devices

#### app/record/page.tsx
**Lines**: 30, 31
**Usage**: navigator.mediaDevices.getUserMedia
**SSR Impact**: LOW - Only in useEffect with proper checks

---

## SSR Compatibility Strategy

### Priority 1: Critical Fixes (Block SSR)

1. **lib/i18n-client.ts** - Already marked with 'use client'
2. **components/I18nProvider.tsx** - Already marked with 'use client'
3. **lib/supabase/client.ts** - Cookie access needs server-side alternative
4. **Authentication token storage** - Move from localStorage to httpOnly cookies

### Priority 2: High Impact (Frequent Usage)

1. **app/dashboard/page.tsx** - Add `typeof window !== 'undefined'` guards
2. **app/agenda/page.tsx** - Add `typeof window !== 'undefined'` guards
3. **app/vakken/page.tsx** - Add `typeof window !== 'undefined'` guards
4. **app/notities/page.tsx** - Add `typeof window !== 'undefined'` guards
5. **app/[page]/page.tsx** - Add `typeof window !== 'undefined'` guards
6. **components/learning-platform/StandaloneLearningPlatform.tsx** - Add comprehensive guards

### Priority 3: Medium Impact (Moderate Usage)

1. **lib/analytics.ts** - Add server-side fallback or disable during SSR
2. **lib/offline/sync.ts** - Add `typeof window !== 'undefined'` guards
3. **lib/data-sync.ts** - Add `typeof window !== 'undefined'` guards
4. **lib/i18n-location.ts** - Add `typeof window !== 'undefined'` guards
5. **components/RTLProvider.tsx** - Add `typeof window !== 'undefined'` guards

### Priority 4: Low Impact (Infrequent or Already Guarded)

1. Event listeners (scroll, resize, keyboard) - Already properly guarded in useEffect
2. Download utilities - Only used in event handlers
3. Clipboard operations - Only used in event handlers
4. Media device access - Only used in useEffect with checks

---

## Recommended Guard Pattern

```typescript
// Pattern for localStorage access
if (typeof window !== 'undefined') {
  const value = localStorage.getItem('key');
  // use value
}

// Pattern for window access
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', handler);
  // cleanup in useEffect return
}

// Pattern for document access
if (typeof window !== 'undefined') {
  document.documentElement.lang = 'nl';
}
```

---

## Next Steps

1. Implement guards for Priority 1 and 2 files
2. Test SSR with incremental re-enablement
3. Move authentication tokens to httpOnly cookies
4. Consider using a SSR-compatible i18n library
5. Remove `export const dynamic = 'force-dynamic'` from layout.tsx

---

## Related Documentation
- `docs/archive/SSR_FIX_ARCHIVE.md` - SSR fix history
- `docs/tasks/REMAINING_TASKS.md` - Task to re-enable SSR
