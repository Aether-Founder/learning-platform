# Aether Learning Platform - Feature Status Overview

## Landing Page (`/`)

### ✅ Functional Features
- **Logo Display**: Shows `/public/aether-logo.png` correctly
- **Navigation**: Links to Artisan AI, Features, How it works, Pricing sections
- **Hero Section**: 
  - Headline "Jouw persoonlijke leerassistent met AI."
  - Subtitle about uploading study material
  - "Start gratis" and "Bekijk Artisan AI" buttons
  - Proper positioning without overlap with visual elements
- **Authentication**: Login and Register buttons that open AuthModal
- **Artisan AI Section**: Shows upload workflow and AI processing preview
- **Features Section**: 6 feature cards (Flashcards, Notes, Graph, Calendar, Modes, Audio)
- **How it Works Section**: 4-step process explanation
- **Pricing Section**: Shows free plan details
- **Footer**: Links to Privacy, Terms, About, Contact

### ⚠️ Non-Functional/Placeholder Features
- **Artisan AI Upload**: Visual preview only, no actual file upload functionality
- **Interactive Features**: Feature cards and previews are visual demonstrations only
- **Forms**: No actual form submissions work on landing page

---

## Authentication Modal

### ✅ Functional Features
- **Email/Password Login**: Works with Supabase authentication
- **Registration**: Creates new user accounts
- **Password Verification**: Confirm password field for registration
- **Google OAuth**: Google login button (configured in Supabase)
- **Form Validation**: Password minimum length, matching passwords
- **Error Handling**: Shows error messages for failed authentication

### ⚠️ Non-Functional/Placeholder Features
- **Guest Mode**: Button exists but functionality not implemented

---

## Dashboard (`/` when logged in)

### ✅ Functional Features
- **Welcome Message**: Shows "Welkom, {name}" on first visit, "Welkom terug, {name}" on subsequent visits
- **Username Persistence**: Username stored in localStorage for instant display
- **Study Set Count**: Shows actual count from database
- **Session Count**: Shows actual study session count from database
- **Empty State**: Shows helpful message when no data exists
- **Quick Actions**: Links to create first study set and plan session

### ⚠️ Non-Functional/Placeholder Features
- **Recent Activity**: Shows count but no detailed activity list

---

## Vakken Page (`/vakken`)

### ✅ Functional Features
- **Subject List**: Dynamically loads from Supabase subjects table
- **Empty State**: Shows setup modal when no subjects exist
- **Setup Modal**: GradeOnboardingModal for selecting grade level and profile
- **Subject Cards**: Display subject name, folder/set counts, progress
- **Dynamic Counts**: Shows actual folder and set counts (0 when empty)
- **Progress Bars**: Visual progress indicators
- **Navigation**: Links to individual subject pages

### ⚠️ Non-Functional/Placeholder Features
- **Subject Detail Pages**: `/vakken/{slug}` routes may not be implemented
- **Progress Calculation**: Shows 0% by default, needs actual progress logic
- **Folder/Set Creation**: No UI to create folders or sets yet

---

## Agenda/Calendar Page (`/agenda` or `/calendar`)

### ✅ Functional Features
- **Calendar View**: CalendarView component displays events
- **Event Creation**: Modal to create new events with validation
- **Event Editing**: Edit existing events
- **Event Deletion**: Delete events with confirmation
- **Form Validation**: Required fields, date/time validation
- **Error Handling**: Shows error messages, logs to console
- **Empty State**: Shows helpful message when no events exist
- **Event Types**: Supports different event types (les, other, examen, huiswerk)
- **Duration Selection**: 30min, 1 hour, 2 hour options

### ⚠️ Non-Functional/Placeholder Features
- **Event Persistence**: May have issues with database saves (previously reported errors)
- **Calendar Sync**: No external calendar integration
- **Reminders**: Reminder system not implemented
- **Recurring Events**: Recurrence functionality not implemented

---

## Cijfers Page (`/cijfers`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users
- **Tab Navigation**: Switch between Vakken, Matrix, Periodes views
- **Period Selection**: Filter by school periods (P1-P4)
- **Summary Statistics**: Real-time calculation of subject count, highest/lowest grades, insufficient count
- **Average Calculation**: Weighted average calculation across all grades
- **Grade Entry**: Full grade creation with subject, teacher, test name, grade, weight, period, date, and target
- **Grade Editing**: Edit existing grades with modal dialog
- **Grade Deletion**: Delete grades with confirmation
- **Subject Overview**: Group grades by subject with subject averages
- **Progress Tracking**: Visual progress bars showing performance vs target grades
- **Matrix View**: Detailed table view of all grades with sorting and filtering
- **Period View**: Period-specific grade breakdowns with averages
- **Database Integration**: Full Supabase integration with grades table
- **Real-time Updates**: Immediate UI updates on grade changes
- **Visual Indicators**: Color coding for insufficient grades (< 5.5)
- **Trend Indicators**: Visual indicators for high/low performance

### ⚠️ Non-Functional/Placeholder Features
- **Subject Detail Pages**: Subject detail view not implemented (placeholder link)

---

## Planner Page (`/planner`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users
- **Status Columns**: Todo, Bezig, Review, Klaar columns
- **Kanban Layout**: Proper grid layout for task management
- **New Task Button**: Button to create new tasks
- **Task Creation**: Full task creation with title, description, subject, due date, and priority
- **Task Editing**: Edit existing tasks with modal dialog
- **Task Deletion**: Delete tasks with confirmation
- **Task Movement**: Move tasks between status columns with buttons
- **Database Integration**: Full Supabase integration with tasks table
- **Real-time Updates**: Optimistic UI updates with database sync
- **Task Counting**: Shows task count per status column
- **Priority Levels**: Low, Medium, High priority with color-coded badges
- **Priority Filtering**: Tasks display priority indicators
- **Task Metadata**: Subject tags and due date display

### ⚠️ Non-Functional/Placeholder Features
- **Drag and Drop**: Button-based movement instead of drag-and-drop
- **Task Filtering**: No filtering by priority or subject
- **Task Sorting**: No sorting options
- **Task Search**: No search functionality
- **Subtasks**: No subtask support
- **Task Templates**: No task templates

---

## Decks Page (`/decks`)

### ✅ Functional Features
- **Study Set Creation**: Full study set creation with title and description
- **Study Set Management**: Edit and delete study sets
- **Flashcard Creation**: Add flashcards to study sets with question and answer
- **Flashcard Management**: Delete flashcards from sets
- **Database Integration**: Full Supabase integration with study_sets and flashcards tables
- **Search Functionality**: Search study sets by title and description
- **Set Selection**: Click on a set to view its cards and study modes
- **Study Mode Links**: Links to all 5 study modes (flashcards, learn, write, test, match)
- **Card Counting**: Shows number of cards per set
- **Real-time Updates**: Immediate UI updates on changes

### ⚠️ Non-Functional/Placeholder Features
- **Card Editing**: No card editing functionality (can only delete and recreate)
- **Import/Export**: No import or export functionality
- **Public Sets**: No public set sharing functionality

## Study Modes (`/study/[deck_id]/[mode]`)

### ✅ Functional Features
- **Flashcards Mode**: Full flashcard flipping with FSRS ratings (again, hard, good, easy)
- **FSRS Algorithm**: Implemented Free Spaced Repetition Scheduler with stability, difficulty, and retrievability tracking
- **Learn Mode**: Multiple choice interface with real distractors from other cards in the deck
- **Learn Mode Feedback**: Shows correct/incorrect feedback with visual indicators
- **Write Mode**: Text input for typing answers with semantic grading
- **Semantic Grading**: Levenshtein distance-based fuzzy matching with 80% threshold
- **Write Mode Feedback**: Shows feedback based on similarity score and key term matching
- **Test Mode**: Full test mode with answer collection for all cards
- **Test Mode Grading**: Automatic grading with similarity scores for all answers
- **Test Mode Results**: Detailed results showing user answers, correct answers, and similarity percentages
- **Match Mode**: Interactive selection-based matching with visual feedback
- **Match Mode Feedback**: Shows matched pairs count
- **Progress Tracking**: Session progress indicator and completion tracking
- **Card Navigation**: Previous/next card navigation (including back navigation in test mode)
- **Session Completion**: Session completion screen with replay option
- **Database Integration**: Loads cards from flashcards table
- **Mobile Responsive**: Optimized layouts for mobile devices
- **Gamification Integration**: XP and streak display on completion (when enabled)

### ⚠️ Non-Functional/Placeholder Features
- **Card Editing**: Implemented in decks page
- **Import/Export**: CSV and Anki format export/import implemented
- **Match Mode Drag-Drop**: Selection-based matching instead of drag-and-drop (works but could be improved)

---

## Lessen Page (`/lessen`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users
- **Search Field**: Search input with placeholder
- **List Layout**: Proper list structure for lessons

### ⚠️ Non-Functional/Placeholder Features
- **Lesson Data**: No actual lesson content loading
- **Search Functionality**: Search doesn't filter actual content
- **Lesson Creation**: No UI to create lessons
- **Lesson Playback**: No lesson content display

---

## Groepen Page (`/groepen`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users
- **Create Button**: Button to create new groups
- **List Layout**: Proper list structure for groups

### ⚠️ Non-Functional/Placeholder Features
- **Group Data**: No actual group data loading
- **Group Creation**: No group creation functionality
- **Group Management**: No invite/join functionality
- **Collaboration Features**: No sharing or collaboration features

---

## Statistieken Page (`/statistieken`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users

### ⚠️ Non-Functional/Placeholder Features
- **Analytics Data**: No actual analytics or statistics
- **Charts/Graphs**: No visual data representation
- **Progress Tracking**: No study progress analytics
- **Performance Metrics**: No performance data

---

## Instellingen Page (`/instellingen`)

### ✅ Functional Features
- **Profile Editing**: Full profile editing with name, username, bio
- **Avatar Upload**: Avatar upload with Supabase Storage integration
- **Avatar Preview**: Preview before upload
- **Avatar Removal**: Remove avatar functionality
- **School Info**: Class level, profile track, school year
- **Theme Selection**: Light/dark/system theme toggle (functional)
- **Account Settings**: Email display (read-only), password change button
- **Database Integration**: Full Supabase integration with users table
- **Real-time Updates**: Immediate UI updates on save
- **Save Feedback**: Success/error messages on save
- **Storage Policies**: RLS policies for avatar storage

### ⚠️ Non-Functional/Placeholder Features
- **Language Selection**: Disabled (multi-language coming soon)
- **Notification Settings**: UI exists but not functional (coming soon)
- **Password Change**: Button exists but not implemented

## Statistieken Page (`/statistieken`)

### ✅ Functional Features
- **Study Time Tracking**: Total study time in hours/minutes
- **Cards Reviewed**: Total cards studied count
- **Study Streak**: Consecutive days studied calculation
- **Sets Completed**: Number of study sets completed
- **Weekly Chart**: Visual bar chart of study time per day
- **Subject Progress**: Progress breakdown by subject with mastery levels
- **Recent Sessions**: List of recent study sessions with details
- **Database Integration**: Full Supabase integration with study_sessions
- **Real-time Calculations**: Dynamic statistics based on user data
- **Streak Algorithm**: Smart streak calculation with consecutive day tracking

### ⚠️ Non-Functional/Placeholder Features
- **Detailed Analytics**: No deep-dive analytics or insights
- **Comparisons**: No comparison with other users or benchmarks
- **Goals**: No goal setting or tracking

## Zoeken Page (`/zoeken`)

### ✅ Functional Features
- **Cross-Content Search**: Search across study sets, notes, tasks, and calendar events
- **Real-time Search**: Debounced search with 300ms delay
- **Relevance Scoring**: Intelligent relevance scoring for results
- **Type Filtering**: Visual indicators for result types
- **Type Labels**: Clear labels for each result type
- **Quick Navigation**: Click to navigate to result location
- **Empty States**: Clear empty states for no results
- **Database Integration**: Full Supabase integration across multiple tables
- **Case-Insensitive**: Case-insensitive search
- **Multi-Field Search**: Searches in title and description fields

### ⚠️ Non-Functional/Placeholder Features
- **Advanced Filters**: No advanced filtering options
- **Search History**: No search history or saved searches
- **Global Search**: Only searches user's own content

## Lessen Page (`/lessen`)

### ✅ Functional Features
- **JSON-Based Lessons**: Loads lessons from JSON files in /content directory
- **Flexible Content**: Supports text, questions, code, video, and image blocks
- **Markdown Rendering**: Full markdown support with KaTeX for math
- **Section Organization**: Hierarchical section structure
- **Expandable Sections**: Collapsible sections for better navigation
- **View Modes**: Simple, study, and advanced view modes
- **Answer Toggle**: Show/hide answers for questions
- **Code Highlighting**: Code block display with language labels
- **Video Support**: Video player placeholders
- **Progress Tracking**: Section count and block count display
- **Responsive Design**: Works on mobile and desktop

### ⚠️ Non-Functional/Placeholder Features
- **Video Playback**: Placeholder video player (no actual video integration)
- **Image Display**: Placeholder image display
- **Progress Persistence**: No lesson progress tracking
- **Quiz Mode**: No interactive quiz functionality
- **Lesson Creation**: No UI to create new lessons (JSON only)

---

## Notities Page (`/notities`)

### ✅ Functional Features
- **Empty State**: Clean empty state for new users
- **Workspace Sidebar**: File tree structure similar to Obsidian
- **Folder Creation**: Create new folders (maps) with button
- **Page Creation**: Create new pages (documents) with button
- **Tree Structure**: Hierarchical folder/page organization
- **Drag and Drop**: Full drag-and-drop functionality using dnd-kit
- **Item Renaming**: Double-click to rename items
- **Item Deletion**: Delete items with confirmation
- **Database Integration**: Full Supabase integration with workspace_items table
- **Real-time Updates**: Optimistic UI updates with database sync
- **Visual Feedback**: Hover effects, selection states, drag indicators
- **Nested Folders**: Support for infinite folder nesting
- **Item Icons**: Folder and file icons for visual distinction
- **Rich Text Editor**: BlockNote editor with markdown support
- **Auto-save**: Automatic content saving to database
- **Block-based Editing**: Modern block-based note editing similar to Notion/Obsidian
- **Slash Commands**: Quick commands for formatting

### ⚠️ Non-Functional/Placeholder Features
- **File Upload**: No file upload functionality
- **Internal Linking**: No internal linking between pages (TODO: implement [[wikilinks]])
- **Graph View**: No knowledge graph visualization (TODO)

---

## Profile Dropdown (Header)

### ✅ Functional Features
- **Profile Menu**: Click on profile avatar to open dropdown
- **Settings Link**: Links to /instellingen
- **Edit Profile Link**: Links to /instellingen
- **Theme Toggle**: Dark/light mode toggle functionality
- **Click Outside**: Closes menu when clicking outside
- **Avatar Display**: Shows user avatar if uploaded, otherwise shows initials

### ⚠️ Non-Functional/Placeholder Features
- None

---

## Global Features

### ✅ Functional Features
- **Responsive Design**: Works on mobile and desktop with optimized layouts
- **Navigation**: Main navigation and mobile navigation
- **Theme Support**: Dark/light mode with system preference detection
- **Internationalization**: 19 languages supported (nl, en, ru, zh, fr, es, ar, de, ja, ko, hi, pt, it, tr, id, vi, th, pl, uk)
- **Language Switching**: Functional language selector in settings
- **RTL Support**: Arabic RTL layout support
- **Location-Based Onboarding**: Dutch onboarding only for NL/BE users
- **Authentication Flow**: Complete auth flow with Supabase
- **Error Handling**: Basic error handling throughout
- **Privacy Page**: `/privacy` page with localized content
- **Terms Page**: `/terms` page with localized content
- **Artisan AI Upload**: User upload page at `/artisan` with drag-drop and Labor Illusion animation
- **Artisan Queue System**: Database tracking for AI processing workflow
- **Artisan Admin Dashboard**: Admin page at `/admin/artisan` for founder to manage queue
- **Artisan Storage**: Private `artisan-inbox` bucket for temporary file storage
- **Artisan Purge**: Automatic deletion of original files after download (zero storage cost)
- **Artisan Delivery**: JSON-based result delivery with automatic deck/card creation
- **Artisan Hub**: Public search page at `/artisan-hub` for browsing AI-generated sets
- **Wizard of Oz Architecture**: Human-in-the-loop AI processing for quality control
- **YouTube Ingestion**: YouTube URL input for video-based AI generation
- **Podcast Generation**: Option to generate podcasts from content
- **Gamification (Opt-In)**: XP and streak system with opt-out toggle (default OFF)
- **Password Change**: User can change password via settings
- **Card Editing**: Full edit functionality for flashcards
- **CSV Export/Import**: Export cards to CSV, import from CSV
- **Anki Export**: Export cards in Anki-compatible format
- **Search History Hook**: `useSearchHistory` hook for search history management
- **Planner Subtasks**: Database schema for hierarchical task support
- **Recurring Events**: Database schema for recurring calendar events
- **Service Worker**: Basic service worker for offline support (Tauri preparation)

### ⚠️ Non-Functional/Placeholder Features
- **Accessibility**: Limited accessibility features
- **Push Notifications**: No notification system
- **Full Offline Mode**: Service worker ready but not fully implemented
- **Public Content Library**: No public set sharing (except Artisan sets)
- **Lesson Creation UI**: JSON-based only, no visual editor
- **Video Playback**: Lesson videos not yet implemented
- **Lesson Progress**: Not tracked/persisted
- **Interactive Quizzes**: Lesson quizzes not implemented
- **Planner Drag-Drop**: Not implemented
- **Planner Filtering/Sorting**: Not implemented
- **Notes Wikilinks**: Internal linking not implemented
- **Knowledge Graph**: Not implemented
- **Calendar Reminders**: Not implemented
- **Accessibility Tools**: IEP/504 adjustments not implemented
- **Study Analytics**: Detailed session analytics not implemented

---

## Competitive Feature Gap Analysis

Based on competitive analysis of Quizlet, Gizmo AI, StudyFetch, Anki, Knowt, and StudyGo.

### ❌ CRITICAL GAPS (Table Stakes)
1. **AI Content Generation**: Missing AI card generation from PDF, text, PPT, YouTube
2. **Mobile Apps**: No iOS/Android apps (web-only)
3. **Public Content Library**: No public set sharing or discovery
4. **Semantic Answer Grading**: Exact-match only, no fuzzy/semantic matching
5. **Advanced SRS Algorithm**: Basic SRS, not FSRS-grade transparency
6. **Offline Mode**: No offline support
7. **Browser Extension**: No official browser extension

### ❌ HIGH PRIORITY GAPS (Differentiators)
1. **Lecture-to-Podcast**: No audio-first study features
2. **AI Tutor Chat**: No RAG-based AI tutor grounded in user material
3. **File Upload & OCR**: No PDF/image upload with OCR for handwritten notes
4. **Video/YouTube Ingestion**: No video transcription or summarization
5. **Live Lecture Recording**: No lecture recording + transcription
6. **AI Grading of Free-Text**: No rubric-based AI grading
7. **Curriculum Alignment**: No textbook/method-edition alignment (Dutch market)
8. **Teacher Analytics**: No institutional/teacher dashboards
9. **LMS Integration**: No Canvas/Google Classroom/Magister/Somtoday integration

### ❌ DUTCH MARKET SPECIFIC GAPS
1. **Textbook-Aligned Content**: No official Dutch textbook vocabulary lists
2. **Magister/Somtoday Integration**: No Dutch LVS integration
3. **Human Tutor Backstop**: No hybrid AI+human tutoring
4. **Eindexamens Hub**: No dedicated final exam content section
5. **Language Subject Lists**: No specific French/German/English/Spanish textbook lists
6. **Accessibility Tools**: No IEP/504 text-complexity adjustment

### ✅ COMPETITIVE ADVANTAGES
1. **Modern Tech Stack**: Next.js 14, Supabase, React (vs. Quizlet's legacy tech)
2. **Transparent Free Tier**: No ads, no paywalls on core features (unlike Quizlet)
3. **Flexible Notes System**: BlockNote editor superior to competitors' basic notes
4. **Comprehensive Planner**: Integrated planner with kanban board
5. **Grade Tracking**: Full grade tracking system (unique among competitors)
6. **Calendar Integration**: Built-in calendar with event management
7. **Multi-Language**: 19 languages vs. most competitors' 2-5 languages
8. **Privacy-First**: No undisclosed data collection (unlike Gizmo's inconsistency)
9. **Real Supabase Backend**: Modern database vs. legacy competitors

---

## Priority Issues to Fix

### ✅ COMPLETED - High Priority
1. **Calendar Event Creation**: ✅ Fixed database save errors with improved validation
2. **Notities Page**: ✅ Implemented note creation and folder management with drag-and-drop
3. **Task Management**: ✅ Implemented actual task creation and management in Planner
4. **Grade System**: ✅ Implemented actual grade data entry and calculations
5. **Study Sets & Modes**: ✅ Implemented study set creation, flashcard management, and all 5 study modes
6. **Notes Editor**: ✅ Improved notes editor with BlockNote (Obsidian-like) with markdown support
7. **Planner Enhancement**: ✅ Added priority levels and improved task management
8. **Profile Management**: ✅ Implemented profile editing and avatar upload
9. **Settings Page**: ✅ Implemented comprehensive settings UI
10. **Analytics**: ✅ Implemented study analytics and statistics
11. **Search**: ✅ Implemented functional search across content
12. **Lesson System**: ✅ Implemented lesson content and playback system using JSON format

### 📋 PENDING - Lower Priority (Future Features)
13. **Group Features**: Group creation and collaboration (beta feature for future)
14. **Artisan AI**: Implement actual file upload and AI processing
15. **Advanced Calendar**: Add reminders, recurrence, sync
16. **Offline Support**: Add PWA capabilities
17. **Language Switching**: Add language selection UI
18. **Accessibility**: Improve accessibility features
19. **Video Integration**: Actual video playback in lessons
20. **Internal Linking**: [[wikilinks]] support in notes
21. **Graph View**: Knowledge graph visualization
