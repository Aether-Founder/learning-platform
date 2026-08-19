# Changelog

## [Unreleased] - Paragraph-Based Learning System Enhancement

### Added

#### Core Features

- **Paragraph-Based Content Structure**: New content organization with paragraphs containing explanations and integrated Q&A
- **Three Viewing Modes**:
  - **Book Mode**: Continuous reading experience with inline expandable questions
  - **Study Mode**: Traditional flashcard-style Q&A for focused studying
  - **Simple Mode**: lp-lw style - single page with all content as continuous text

#### Content Structure

- `ParagraphSection` interface with nested paragraphs and questions
- `content` field for detailed paragraph explanations
- `questions` array within each paragraph for contextual Q&A
- Support for both inline and section-level question display

#### Components

- `ParagraphSection.tsx`: Renders paragraphs with integrated Q&A
- `SimpleMode.tsx`: lp-lw style continuous text view
- `ModeSwitcher.tsx`: Toggle between Book/Study/Simple modes
- `SectionHierarchy.tsx`: Visual table of contents showing section structure with indented sub-items
- Enhanced `NestedSection.tsx` with paragraph support

#### User Experience

- **Progress Tracking**: Visual indicators for reading completion
- **Bookmarks**: Save and return to specific paragraphs
- **Search**: Full-text search across all paragraphs
- **Reading Position Memory**: Auto-save last read position
- **Smooth Scrolling**: Enhanced navigation between paragraphs
- **Visual Section Hierarchy in Sidebar**: Hierarchical navigation in sidebar showing:
  - Main sections (e.g., H11A, H12A)
  - Indented sub-sections with numbering (e.g., 1.1, 1.2, 1.3) using tab-style indentation
  - Click to navigate directly to any section
  - Active section highlighting

#### Data & Performance

- Updated TypeScript interfaces for type safety
- React.memo and useMemo optimizations
- Support for large content files
- **Chunked Rendering**: Content loads in sections (initially 2 sections) for faster initial render
- **Progressive Loading**: More sections load automatically as user scrolls
- **Simple Loading Spinner**: Clean, color-palette matching circle animation
- **Fast Loading**: Optimized for large JSON files
- **Efficient Rendering**: Only re-renders changed sections
- **Memory Efficient**: Uses Sets for tracking expanded states
- Example `math-paragraphs.json` with complete content

### Changed

- Enhanced JSON structure to support paragraph-based organization
- Modified sidebar navigation to show paragraph-level items
- Updated hover states to use `bg-secondary` consistently
- Improved mobile responsiveness for all viewing modes

### Technical Details

- Added `useMemo` for expensive calculations
- Implemented `React.memo` for component optimization
- Enhanced scroll spy for paragraph-level highlighting
- Updated `page.tsx` to support new data structure
- Added `processNewlines()` helper to convert `\\n` to actual newlines in JSON content

### Fixed

- **LaTeX/Math Rendering**: Added KaTeX CSS import to `layout.tsx` for proper math formula display
- **Flashcard Flip Animation**: Fixed CSS 3D transform using inline styles instead of Tailwind classes
- **Spacebar in Study Mode**: Added keyboard event handler that prevents page scroll and flips card
- **Newline Characters**: Fixed `\\n` in JSON answers not rendering as actual line breaks
- **Math Notation**: All math expressions like `\\frac{}{}`, `$...$`, and `$$...$$` now render correctly
- **Inline Math Support**: Added explicit `singleDollarTextMath: true` configuration for `$...$` inline math support in MarkdownRenderer

### Migration Notes

- Existing JSON files remain compatible
- New paragraph structure is optional - falls back to existing structure
- Can gradually migrate content to new format

## [Previous] - Nested Sections Implementation

### Added

- Nested sections structure (sections within sections)
- `NestedSection.tsx` component for hierarchical content
- Math subject example with 2 units and 10 subsections
- Performance optimizations with memoization

### Fixed

- Theme toggle button visibility
- Hover colors for sections and buttons
- Mobile responsiveness issues

## [Previous] - Initial Release

### Added

- Basic flashcard functionality
- Dark/Light mode toggle
- Section navigation sidebar
- Export functionality (Anki, Flashcards, Transcript)
- YouTube/Substack button integration
- Mobile responsiveness
