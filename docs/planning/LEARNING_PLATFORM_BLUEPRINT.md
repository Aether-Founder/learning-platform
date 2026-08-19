# Learning Platform - Comprehensive Blueprint

## Executive Summary

This blueprint outlines the complete feature set for a bulletproof learning platform designed to support 12 subjects: Wiskunde B/D, Natuurkunde, Scheikunde, Biologie, Nederlands, Engels Cambridge, Frans, Informatica, Maatschappijleer, LV, and CKV.

**Core Philosophy:**
- Make waiting impossible (daily guidance)
- Make forgetting impossible (spaced repetition + active recall)
- Make mistakes visible (error tracking + retesting)

---

## Current Implementation Status

### ✅ Fully Implemented & Working

1. **Authentication System**
   - User registration/login
   - Profile management
   - Session handling

2. **Basic Navigation**
   - Responsive navbar with "Meer" overflow button
   - Mobile-friendly navigation
   - Page routing

3. **Core Pages**
   - Dashboard (Overzicht) - basic version
   - Subjects (Vakken) - basic listing
   - Agenda - basic view
   - Planner - basic planning
   - Notes (Notities) - note-taking
   - Decks - flashcard decks
   - Statistics (Statistieken) - basic analytics
   - Settings (Instellingen) - user preferences

4. **Learning Features**
   - **Vandaag (Today Dashboard)** - Daily overview with stats
   - **Foutenlogboek (Error Log)** - Full CRUD with database integration
   - **Active Recall Engine** - Multiple question types, add questions, session management
   - **Spaced Repetition Engine** - SM-2 algorithm, item management, interval scheduling
   - **Daily Quiz** - Quiz sessions with database integration
   - **Inbox** - Quick notes/tasks with toggle completion

5. **Artisan Ingestion Engine**
   - User upload page with 15-second labor illusion animation
   - Admin dashboard for queue management
   - File upload to Supabase Storage
   - Realtime status updates
   - JSON validation with Zod

6. **Database Integration**
   - Supabase client setup
   - RLS policies for user data isolation
   - All tables properly indexed
   - Storage policies for Artisan

7. **UI/UX**
   - Skeleton shimmer loading states
   - Consistent styling across pages
   - Dark mode support
   - Responsive design

### 🚧 Partially Implemented

1. **Dashboard (Overzicht)**
   - Basic stats display
   - Missing: Percentages, progress bars, agenda widget (per user request)

2. **Agenda/Calendar**
   - Separate pages exist
   - Missing: Merged view with toggle, calendar as default

### ❌ Not Implemented Yet

#### Core Learning Features
1. **Vakpagina's (Subject Pages)** - Detailed subject-specific pages
2. **Smart Grading** - Detailed analytics per question
3. **Meesterschap per onderwerp** - Mastery tracking per topic
4. **Quiz Engine with Special Types** - 15+ quiz types
5. **Huiswerkmodule** - Homework tracking with red/orange/green grading
6. **Lesnotities & Vraaggeneratie** - Lesson notes with question prompts
7. **Toetsplanning & Exam Readiness** - Test planning with T-minus study plans
8. **Oefentoetsmodus** - Practice test mode with timer
9. **Anti-overload Modus** - Daily cap, sick mode, minimum viable day
10. **Subject Vault per vak** - Knowledge vault per subject

#### Subject-Specific Features
11. **Wiskunde B/D** - Method cards, formula recognition
12. **Natuurkunde** - Formula choice, unit checking
13. **Scheikunde** - Reaction analysis templates
14. **Biologie** - Process templates, diagram questions
15. **Nederlands** - Writing templates, argumentation
16. **Cambridge Engels** - Writing feedback rubric
17. **Frans** - Grammar error bank
18. **Informatica** - Debug templates, code questions
19. **Maatschappijleer** - Concept questions
20. **CKV/LV** - Light theoretical modules

#### Advanced Features
21. **Smart Recommendations** - AI-driven study suggestions
22. **Herhaalqueue per type** - Different queues for knowledge types
23. **Notities & Kennisbibliotheek** - Active note-taking system
24. **Notion Integration** - Calendar integration links
25. **Import/Export** - Data portability
26. **Focusmodus** - Distraction-free study mode
27. **Confidence Calibration** - Self-assessment accuracy
28. **Interleaving** - Mixed subject study
29. **Retrieval Variations** - Multiple ways to test same knowledge
30. **Error Clustering** - Pattern recognition in mistakes
31. **Exam Prediction** - Score prediction based on data
32. **Study Load Guard** - Protection against overload
33. **Weekly Review Export** - Sunday review generation
34. **Question Generator** - AI question assistance
35. **Docentvraag-export** - Teacher question collection

---

## Implementation Phases

### Phase 1: Foundation (Current - ✅ Complete)
**Status:** DONE

**Tasks:**
- [x] Authentication system
- [x] Basic navigation
- [x] Core pages (dashboard, subjects, agenda, planner, notes, decks, stats, settings)
- [x] Database integration (Supabase)
- [x] RLS policies
- [x] Loading states
- [x] Responsive design

**Deliverables:**
- Working authentication
- Basic page structure
- Database connectivity
- User data isolation

---

### Phase 2: Core Learning Features (Current - 🚧 In Progress)
**Status:** IN PROGRESS

**Tasks:**
- [x] Vandaag (Today Dashboard)
- [x] Foutenlogboek (Error Log)
- [x] Active Recall Engine
- [x] Spaced Repetition Engine
- [x] Daily Quiz
- [x] Inbox
- [x] Artisan Ingestion Engine
- [ ] Redesign Overzicht with percentages & progress bars
- [ ] Merge calendar into agenda with view toggle
- [ ] Remove standalone calendar page

**Deliverables:**
- Daily learning guidance
- Error tracking system
- Spaced repetition scheduling
- Quiz generation
- Content ingestion pipeline

**Estimated Time:** 2-3 weeks

---

### Phase 3: Subject Pages & Mastery Tracking
**Status:** NOT STARTED

**Tasks:**
- [ ] Create detailed subject pages for all 12 subjects
- [ ] Implement mastery tracking per topic
- [ ] Add subject-specific status (veilig/let op/gevaar)
- [ ] Subject-specific learning cards (begripskaart, formulekaart, etc.)
- [ ] Subject vault implementation
- [ ] Test date tracking per subject
- [ ] Grade tracking per subject
- [ ] Last test analysis per subject

**Deliverables:**
- 12 detailed subject pages
- Mastery percentage per topic
- Status indicators
- Subject-specific learning tools

**Estimated Time:** 3-4 weeks

---

### Phase 4: Advanced Quiz Engine
**Status:** NOT STARTED

**Tasks:**
- [ ] Implement 15+ quiz types
- [ ] Smart quiz builder
- [ ] Quiz configuration (duration, subject, difficulty)
- [ ] Exam mode with timer
- [ ] Score calculation per question
- [ ] Automatic error logging from quizzes
- [ ] Analysis per subject after quiz
- [ ] Custom quiz creation
- [ ] Old test import

**Deliverables:**
- Comprehensive quiz engine
- Multiple quiz types
- Exam simulation
- Detailed quiz analytics

**Estimated Time:** 4-5 weeks

---

### Phase 5: Smart Grading & Analytics
**Status:** NOT STARTED

**Tasks:**
- [ ] Detailed question scoring (good/partial/wrong/not done)
- [ ] Confidence scoring per question
- [ ] Time tracking per question
- [ ] Hint usage tracking
- [ ] Mastery calculation per topic
- [ ] Status calculation (0-40% gevaar, 40-65% let op, 65-85% redelijk, 85-100% beheerst)
- [ ] Predicted test score
- [ ] Risk indicators
- [ ] Progress trends (up/stable/down)
- [ ] Most common error types
- [ ] Time spent per subject
- [ ] Streak tracking

**Deliverables:**
- Advanced grading system
- Mastery percentages
- Predictive analytics
- Risk warnings

**Estimated Time:** 3-4 weeks

---

### Phase 6: Homework & Lesson Notes
**Status:** NOT STARTED

**Tasks:**
- [ ] Homework module with subtasks
- [ ] Red/orange/green grading system
- [ ] Automatic action suggestions based on grade
- [ ] Lesson notes module
- [ ] Question generation prompts
- [ ] Question status tracking
- [ ] Teacher question export

**Deliverables:**
- Homework tracking
- Lesson note system
- Question generation assistance

**Estimated Time:** 2-3 weeks

---

### Phase 7: Test Planning & Exam Readiness
**Status:** NOT STARTED

**Tasks:**
- [ ] Test date tracking
- [ ] T-minus study plan generation
- [ ] Exam readiness calculation
- [ ] Test week planning
- [ ] Subject weighting
- [ ] Required grade tracking
- [ ] Risk assessment per test

**Deliverables:**
- Test planning system
- Exam readiness indicators
- Automated study plans

**Estimated Time:** 2-3 weeks

---

### Phase 8: Anti-Overload & Study Modes
**Status:** NOT STARTED

**Tasks:**
- [ ] Daily cap configuration
- [ ] Priority filter system
- [ ] Sick mode (minimal items)
- [ ] Minimum Viable Day mode
- [ ] Catch-up mode
- [ ] Exam mode (less new content)
- [ ] Vacation mode
- [ ] Study load guard

**Deliverables:**
- Multiple study modes
- Overload protection
- Flexible scheduling

**Estimated Time:** 2-3 weeks

---

### Phase 9: Subject-Specific Features
**Status:** NOT STARTED

**Tasks:**
- [ ] Wiskunde B: Method cards, formula recognition, proof templates
- [ ] Wiskunde D: Concept explanations, proof templates
- [ ] Natuurkunde: Formula choice, unit checking, step-by-step templates
- [ ] Scheikunde: Reaction analysis, equation balancing
- [ ] Biologie: Process templates, diagram questions, cause-effect
- [ ] Nederlands: Writing templates, argumentation analysis
- [ ] Cambridge Engels: Writing rubric, grammar in context
- [ ] Frans: Grammar error bank, vocabulary active recall
- [ ] Informatica: Debug templates, code questions, algorithm explanations
- [ ] Maatschappijleer: Concept questions, current examples
- [ ] CKV: Reflection questions, activity tracking
- [ ] LV: Theoretical concepts, practical tasks

**Deliverables:**
- Subject-specific learning tools
- Specialized question types
- Subject-optimized workflows

**Estimated Time:** 6-8 weeks

---

### Phase 10: Advanced Features
**Status:** NOT STARTED

**Tasks:**
- [ ] Smart recommendations engine
- [ ] Confidence calibration
- [ ] Interleaving implementation
- [ ] Retrieval variations
- [ ] Error clustering
- [ ] Exam prediction
- [ ] Weekly review export
- [ ] Question generator
- [ ] Notion Calendar integration
- [ ] Import/Export functionality
- [ ] Focus mode
- [ ] Mobile optimization
- [ ] Offline support
- [ ] Backup system

**Deliverables:**
- AI-driven features
- Integration capabilities
- Advanced analytics
- Mobile-first design

**Estimated Time:** 8-10 weeks

---

## Task Breakdown by Priority

### High Priority (Must Have)
1. Redesign Overzicht page with percentages & progress bars
2. Merge calendar into agenda with view toggle
3. Remove standalone calendar page
4. Create detailed subject pages
5. Implement mastery tracking per topic
6. Add subject-specific learning cards
7. Implement homework module with red/orange/green
8. Add lesson notes with question generation
9. Implement test planning system
10. Add anti-overload modes

### Medium Priority (Should Have)
1. Advanced quiz engine with 15+ types
2. Smart grading system
3. Exam readiness calculation
4. Subject-specific features
5. Smart recommendations
6. Confidence calibration
7. Notion integration

### Low Priority (Nice to Have)
1. Interleaving
2. Retrieval variations
3. Error clustering
4. Exam prediction
5. Weekly review export
6. Question generator
7. Focus mode
8. Offline support

---

## Database Schema Requirements

### Existing Tables
- ✅ users
- ✅ profiles
- ✅ decks
- ✅ cards
- ✅ error_log
- ✅ active_recall_questions
- ✅ spaced_repetition_items
- ✅ daily_quiz_sessions
- ✅ daily_quiz_questions
- ✅ artisan_queue
- ✅ inbox

### Tables to Create
- ❌ subjects (vakken)
- ❌ subject_chapters (vak hoofdstukken)
- ❌ subject_topics (vak onderwerpen)
- ❌ mastery_tracking (meesterschap per onderwerp)
- ❌ homework_assignments (huiswerkopdrachten)
- ❌ homework_subtasks (huiswerk subtaken)
- ❌ lesson_notes (lesnotities)
- ❌ lesson_questions (lesvragen)
- ❌ tests (toetsen)
- ❌ test_plans (toetsplannen)
- ❌ quiz_templates (quiz sjablonen)
- ❌ quiz_sessions (quiz sessies)
- ❌ quiz_questions (quiz vragen)
- ❌ study_sessions (leersessies)
- ❌ knowledge_items (kennisitems)
- ❌ recommendations (aanbevelingen)

---

## Technical Stack

### Current
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- shadcn/ui components
- Lucide icons
- Framer Motion
- react-dropzone
- Zod
- Sonner

### Additional Requirements
- Chart library for analytics (Chart.js or Recharts)
- Calendar library (react-big-calendar or similar)
- Rich text editor for notes (Tiptap or similar)
- PDF generation for exports
- Web Speech API for speaking prompts
- Camera access for diagram questions

---

## API Integrations Needed

### Potential Future Integrations
- Notion API (for calendar integration)
- OpenAI API (for question generation - optional)
- Google Calendar API (alternative to Notion)
- Email notifications (for reminders)

---

## Security & Privacy

### Current Implementation
- ✅ Row Level Security (RLS) on all tables
- ✅ User data isolation
- ✅ Secure file upload to private buckets
- ✅ Authenticated routes

### Additional Requirements
- ❌ Two-factor authentication
- ❌ Session timeout
- ❌ Audit logging
- ❌ Data export for GDPR compliance
- ❌ Backup automation

---

## Mobile Responsiveness

### Current Status
- ✅ Responsive navbar with overflow
- ✅ Mobile-friendly navigation
- ✅ Touch-friendly buttons

### Additional Requirements
- ❌ PWA support
- ❌ Offline mode
- ❌ Push notifications
- ❌ Mobile-specific optimizations

---

## Performance Optimization

### Current Status
- ✅ Skeleton loading states
- ✅ Lazy loading where needed
- ✅ Optimistic UI updates

### Additional Requirements
- ❌ Image optimization
- ❌ Code splitting
- ❌ Caching strategy
- ❌ Database query optimization
- ❌ CDN for static assets

---

## Testing Strategy

### Required Testing
- [ ] Unit tests for core functions
- [ ] Integration tests for database operations
- [ ] E2E tests for critical user flows
- [ ] Performance testing
- [ ] Security testing
- [ ] Mobile testing
- [ ] Accessibility testing

---

## Deployment Strategy

### Current
- ✅ Development environment
- ✅ Supabase project setup
- ✅ Database migrations

### Required
- [ ] Staging environment
- [ ] Production environment
- [ ] CI/CD pipeline
- [ ] Automated backups
- [ ] Monitoring setup
- [ ] Error tracking (Sentry or similar)

---

## Success Metrics

### User Engagement
- Daily active users
- Session duration
- Feature usage per session
- Retention rate

### Learning Effectiveness
- Mastery improvement over time
- Error reduction rate
- Quiz score improvement
- Test score correlation

### System Performance
- Page load time < 2s
- Quiz response time < 100ms
- Database query time < 50ms
- 99.9% uptime

---

## Risk Assessment

### Technical Risks
- Database scaling issues
- Realtime connection stability
- File storage costs
- API rate limits

### User Risks
- Feature complexity overwhelming users
- Learning curve too steep
- Mobile experience not optimal
- Data loss concerns

### Mitigation Strategies
- Gradual feature rollout
- User onboarding flow
- Comprehensive documentation
- Regular backups
- A/B testing for UX changes

---

## Conclusion

This blueprint provides a comprehensive roadmap for building a bulletproof learning platform. The current implementation covers the foundation and core learning features. The remaining phases focus on advanced analytics, subject-specific tools, and AI-driven features.

**Key Principles:**
1. Start with core functionality
2. Add subject-specific features incrementally
3. Prioritize user experience over feature count
4. Maintain data privacy and security
5. Ensure mobile responsiveness throughout

**Next Immediate Steps:**
1. Redesign Overzicht page with percentages & progress bars
2. Merge calendar into agenda with view toggle
3. Remove standalone calendar page
4. Begin Phase 3: Subject Pages & Mastery Tracking
