# Paragraph-Based Learning System - Blueprint

## Executive Summary

Transform the flashcard application into a comprehensive paragraph-based learning platform that supports three distinct viewing modes: Book Mode (continuous reading with inline Q&A), Study Mode (traditional flashcards), and Simple Mode (lp-lw style continuous text). This enhancement maintains backward compatibility while providing a superior learning experience.

---

## 1. Requirements Analysis

### 1.1 Functional Requirements

#### Content Structure

- **FR1.1**: Support paragraph-based content organization
- **FR1.2**: Each paragraph must contain: title, content (explanation text), and questions
- **FR1.3**: Questions must be displayable inline or as separate sections
- **FR1.4**: Support markdown formatting in paragraph content
- **FR1.5**: Support mathematical notation (KaTeX) in paragraphs

#### Viewing Modes

- **FR2.1**: **Book Mode**: Continuous scrolling with expandable inline questions
- **FR2.2**: **Study Mode**: Traditional flashcard-style Q&A presentation
- **FR2.3**: **Simple Mode**: lp-lw style single-page continuous text view
- **FR2.4**: Mode switcher accessible from header
- **FR2.5**: Mode preference persisted in localStorage

#### Navigation & Progress

- **FR3.1**: Paragraph-level navigation in sidebar
- **FR3.2**: Reading progress tracking (percentage, visual indicators)
- **FR3.3**: Bookmark specific paragraphs
- **FR3.4**: Search across all paragraph content
- **FR3.5**: Auto-save reading position

### 1.2 Non-Functional Requirements

#### Performance

- **NFR1**: Initial load time < 2 seconds for files up to 500KB
- **NFR2**: Smooth scrolling with 60fps
- **NFR3**: React.memo and useMemo optimizations
- **NFR4**: Lazy load paragraph content when needed

#### Compatibility

- **NFR5**: Backward compatible with existing JSON structure
- **NFR6**: Graceful fallback for missing paragraph data
- **NFR7**: Mobile responsive (320px to 2560px width)

---

## 2. System Design

### 2.1 Data Models

#### Enhanced Section Interface

```typescript
interface Paragraph {
  id: string;
  title?: string;
  content: string; // Markdown-supported explanation
  questions: ParagraphQuestion[];
  bookmarked?: boolean;
  readProgress?: number; // 0-100
}

interface ParagraphQuestion {
  id: string;
  number: string;
  question: string;
  answer: string;
  type: 'inline' | 'section';
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ParagraphSection {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  timestamp?: string;
  // Legacy support
  subSections?: SubSection[];
  questions?: LegacyQuestion[];
}
```

#### Content JSON Structure

```json
{
  "siteMetadata": { "title": "...", "description": "..." },
  "showTimestamps": false,
  "showExportButtons": false,
  "buttons": [...],
  "viewMode": "book", // Default: "book" | "study" | "simple"
  "sections": [
    {
      "id": "unit-1",
      "title": "Unit 1: Fundamentals",
      "paragraphs": [
        {
          "id": "para-1-1",
          "title": "Introduction to Algebra",
          "content": "Algebra forms the foundation...",
          "questions": [
            {
              "id": "q1",
              "number": "Q1",
              "question": "What is algebra?",
              "answer": "Algebra is...",
              "type": "inline"
            }
          ]
        }
      ]
    }
  ]
}
```

### 2.2 Component Architecture

```
app/[page]/page.tsx
├── Header (unchanged)
├── ModeSwitcher (new)
│   └── Toggle between Book/Study/Simple modes
├── Sidebar (enhanced)
│   └── Paragraph-level navigation
└── Main Content
    ├── BookMode (new)
    │   └── ParagraphSection
    │       └── ParagraphCard
    │           ├── Markdown content
    │           └── InlineQuestionAccordion
    ├── StudyMode (new)
    │   └── FlashcardGrid
    │       └── Flashcard
    └── SimpleMode (new)
        └── ContinuousText
            └── Full content render
```

### 2.3 State Management

```typescript
// View mode state
const [viewMode, setViewMode] = useState<'book' | 'study' | 'simple'>('book');

// Reading progress
const [readingProgress, setReadingProgress] = useState<{
  paragraphId: string;
  percentage: number;
}>();

// Bookmarks
const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

// Expanded questions (Book Mode)
const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

// Search
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<SearchResult[]>();
```

---

## 3. Implementation Plan

### Phase 1: Foundation (Day 1)

#### Task 1.1: Update TypeScript Interfaces

- [ ] Modify `content.d.ts` to include Paragraph interfaces
- [ ] Update FlashcardSection interface for backward compatibility
- [ ] Add type definitions for view modes
- [ ] Estimated time: 1 hour

#### Task 1.2: Create Base Components

- [ ] Create `ModeSwitcher.tsx` with toggle UI
- [ ] Create `ParagraphSection.tsx` skeleton
- [ ] Create `SimpleMode.tsx` skeleton
- [ ] Estimated time: 2 hours

### Phase 2: Core Features (Day 2)

#### Task 2.1: Implement Book Mode

- [ ] Create `ParagraphCard` component
- [ ] Implement markdown rendering with KaTeX
- [ ] Add inline question accordion
- [ ] Implement scroll spy for paragraphs
- [ ] Estimated time: 4 hours

#### Task 2.2: Implement Study Mode

- [ ] Create `FlashcardGrid` component
- [ ] Extract all questions from paragraphs
- [ ] Implement card flip animation
- [ ] Add keyboard navigation (space/arrow keys)
- [ ] Estimated time: 3 hours

#### Task 2.3: Implement Simple Mode

- [ ] Create `ContinuousText` component
- [ ] Render all paragraphs as single document
- [ ] Add paragraph anchors for linking
- [ ] Implement print-friendly styles
- [ ] Estimated time: 2 hours

### Phase 3: Navigation & UX (Day 3)

#### Task 3.1: Enhanced Sidebar

- [ ] Add paragraph-level navigation items
- [ ] Implement search in sidebar
- [ ] Add reading progress indicator
- [ ] Estimated time: 3 hours

#### Task 3.2: Progress Tracking

- [ ] Implement IntersectionObserver for paragraph visibility
- [ ] Calculate reading percentage
- [ ] Persist progress to localStorage
- [ ] Estimated time: 2 hours

#### Task 3.3: Bookmarks

- [ ] Add bookmark button to paragraphs
- [ ] Create bookmarks sidebar section
- [ ] Implement bookmark persistence
- [ ] Estimated time: 2 hours

### Phase 4: Polish & Integration (Day 4)

#### Task 4.1: Update Page Integration

- [ ] Modify `page.tsx` to support new data structure
- [ ] Add mode persistence on route change
- [ ] Handle legacy JSON fallback
- [ ] Estimated time: 2 hours

#### Task 4.2: Create Example Content

- [ ] Create `math-paragraphs.json` with full content
- [ ] Include 10+ paragraphs with questions
- [ ] Add mathematical notation examples
- [ ] Estimated time: 3 hours

#### Task 4.3: Testing & Optimization

- [ ] Test all three modes
- [ ] Verify mobile responsiveness
- [ ] Performance profiling
- [ ] Fix any issues
- [ ] Estimated time: 3 hours

---

## 4. Design Specifications

### 4.1 Visual Design

#### Book Mode

- **Layout**: Single column, max-width 720px, centered
- **Paragraph Card**: White/light card with subtle shadow
- **Typography**: 18px body text, 1.7 line height
- **Inline Questions**: Collapsible accordion below paragraph
- **Spacing**: 32px between paragraphs

#### Study Mode

- **Layout**: Grid layout, 2 columns on desktop, 1 on mobile
- **Flashcard**: Fixed aspect ratio, flip animation
- **Typography**: Large question text (20px), answer on flip
- **Spacing**: 24px gap between cards

#### Simple Mode (lp-lw style)

- **Layout**: Full width, max-width 900px
- **Typography**: 17px body, GitHub-style markdown
- **Headings**: Anchor links for navigation
- **Spacing**: 45px padding, 1.6 line height

### 4.2 Color Scheme

#### Light Mode

- Background: `hsl(222.2, 84%, 95.1%)` (very light blue)
- Card Background: `hsl(222.2, 84%, 97%)`
- Text: `hsl(222.2, 84%, 4.9%)`
- Secondary: `hsl(222.2, 84%, 90%)`
- Border: `hsl(222.2, 84%, 85%)`

#### Dark Mode

- Background: `hsl(222.2, 84%, 4.9%)`
- Card Background: `hsl(222.2, 84%, 8%)`
- Text: `hsl(222.2, 84%, 95.1%)`
- Secondary: `hsl(222.2, 84%, 15%)`
- Border: `hsl(222.2, 84%, 20%)`

### 4.3 Animations

#### Transitions

- Mode switch: 300ms ease-in-out
- Card flip: 400ms cubic-bezier(0.4, 0, 0.2, 1)
- Accordion expand: 200ms ease-out
- Scroll to paragraph: 400ms smooth scroll

#### Hover States

- Paragraph card: `translateY(-2px)` + shadow increase
- Buttons: Background color transition 150ms
- Links: Underline animation

---

## 5. API & Data Flow

### 5.1 Data Loading

```typescript
// Dynamic import with error handling
const loadContent = async (page: string) => {
  try {
    const content = await import(`@/content/${page}.json`);
    return normalizeContent(content.default);
  } catch (error) {
    console.error('Failed to load content:', error);
    return null;
  }
};

// Normalize legacy and new formats
const normalizeContent = (data: any) => {
  if (data.paragraphs) return data; // New format
  if (data.sections) {
    // Convert legacy to new format
    return convertLegacyToParagraphs(data);
  }
  return data;
};
```

### 5.2 Progress Tracking

```typescript
// IntersectionObserver for paragraph visibility
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateReadingProgress(entry.target.id);
        }
      });
    },
    { threshold: 0.5 }
  );

  paragraphRefs.current.forEach((ref) => observer.observe(ref));
  return () => observer.disconnect();
}, []);
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

- Component rendering with different props
- Mode switching logic
- Progress calculation
- Search functionality

### 6.2 Integration Tests

- Full page load with different JSON structures
- Mode persistence across navigation
- Bookmark save/load
- Search across paragraphs

### 6.3 Manual Testing

- All three modes on desktop and mobile
- Large content files (>500KB)
- Keyboard navigation in Study Mode
- Print functionality in Simple Mode

---

## 7. Deployment Checklist

- [ ] All TypeScript interfaces updated
- [ ] Three viewing modes fully functional
- [ ] Example content created and tested
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No console errors
- [ ] Build successful
- [ ] Vercel deployment tested

---

## 8. Future Enhancements

### 8.1 Version 2.0

- Audio narration for paragraphs
- Highlight and annotate text
- Export to PDF/EPUB
- Collaborative bookmarks

### 8.2 Version 2.1

- Spaced repetition integration
- Quiz generation from questions
- Progress analytics dashboard
- Import from Markdown files

---

## Appendix

### A. File Structure

```
components/
├── ModeSwitcher.tsx         # Mode toggle UI
├── ParagraphSection.tsx     # Book mode container
├── ParagraphCard.tsx        # Individual paragraph
├── InlineQuestion.tsx       # Expandable Q&A
├── StudyMode.tsx           # Flashcard grid
├── SimpleMode.tsx          # Continuous text
├── ReadingProgress.tsx       # Progress indicator
├── BookmarkButton.tsx       # Bookmark UI
└── SearchBar.tsx           # Search interface

content/
├── math-paragraphs.json    # Example full content
├── [existing files...]

hooks/
├── useReadingProgress.ts   # Progress tracking
├── useBookmarks.ts         # Bookmark management
└── useSearch.ts           # Search functionality
```

### B. Dependencies to Add

```json
{
  "react-intersection-observer": "^9.5.0",
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-katex": "^7.0.0",
  "remark-math": "^6.0.0"
}
```

---

## Approval

**Status**: Ready for Implementation
**Estimated Total Time**: 20-24 hours
**Priority**: High
**Dependencies**: None (backward compatible)

Proceed with implementation immediately.
