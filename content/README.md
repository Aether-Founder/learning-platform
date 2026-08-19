# Aether Content Management System

This directory contains all learning content organized in a structured JSON file format. **All learning content is stored in JSON files, not in Supabase.**

## Architecture Decision: JSON vs Supabase

### JSON Files (Learning Content)
All learning content is stored in JSON files in this directory:
- **Subjects, chapters, learning sets, quizzes, summaries, practice tests**
- **Static content that doesn't change per user**
- **Benefits**:
  - Offline support with service workers
  - Faster performance (static files vs database queries)
  - Version control with Git
  - Easy portability between environments
  - Optimized for Vercel deployment
  - AI-friendly for content generation
  - No database dependency for content delivery

### Supabase (User-Specific Data)
Supabase is used exclusively for user-specific data:
- **User authentication and profiles**
- **User progress tracking**
- **User-created content**
- **Real-time features**
- **User preferences and settings**
- **Study sessions and card reviews**

**Learning content is NEVER stored in Supabase.** The Admin CLI tool can sync JSON content to Supabase for backup purposes, but the primary source of truth is the JSON files in this directory.

## File Structure

```
content/
├── subjects/
│   ├── index.json                          # Master index of all subjects
│   └── {subject-id}/
│       ├── subject.json                     # Subject metadata
│       └── chapters/
│           ├── {chapter-id}/
│           │   ├── chapter.json             # Chapter metadata
│           │   ├── learning-sets/
│           │   │   └── {learning-set-id}.json
│           │   ├── quizzes/
│           │   │   └── {quiz-id}.json
│           │   ├── summaries/
│           │   │   └── {summary-id}.json
│           │   └── practice-tests/
│           │       └── {practice-test-id}.json
```

## File Formats

### subjects/index.json

Master index listing all available subjects:

```json
{
  "version": "1.0",
  "lastUpdated": "2024-08-19",
  "subjects": [
    {
      "id": "natuurkunde",
      "name": "Natuurkunde",
      "slug": "natuurkunde",
      "description": "De studie van materie, energie en hun interacties",
      "color": "#3b82f6",
      "icon": "atom",
      "level": "VWO",
      "chapters": ["mechanica", "thermodynamica", "elektriciteit-magnetisme"]
    }
  ]
}
```

### subjects/{subject-id}/subject.json

Subject metadata and configuration:

```json
{
  "id": "natuurkunde",
  "name": "Natuurkunde",
  "slug": "natuurkunde",
  "description": "De studie van materie, energie en hun interacties",
  "color": "#3b82f6",
  "icon": "atom",
  "level": "VWO",
  "mastery": 0,
  "topics": 15,
  "topics_done": 0,
  "due_count": 0
}
```

### subjects/{subject-id}/chapters/{chapter-id}/chapter.json

Chapter metadata and content references:

```json
{
  "id": "mechanica",
  "subjectId": "natuurkunde",
  "title": "Mechanica",
  "description": "De studie van beweging, krachten en hun effecten",
  "order": 1,
  "content": {
    "learningSets": ["krachten-beweging", "energie-werk"],
    "quizzes": ["mechanica-quiz"],
    "summaries": ["mechanica-summary"],
    "practiceTests": ["mechanica-practicetest"]
  }
}
```

### Learning Sets (learning-sets/{id}.json)

Flashcard decks with cards:

```json
{
  "id": "krachten-beweging",
  "chapterId": "mechanica",
  "subjectId": "natuurkunde",
  "title": "Krachten en Beweging",
  "description": "Flashcards over Newton's wetten",
  "cards": [
    {
      "front": "Wat is de eerste wet van Newton?",
      "back": "Een object in rust blijft in rust...",
      "source_text": "Biologie tekstboek pagina 45"
    }
  ]
}
```

### Quizzes (quizzes/{id}.json)

Interactive quizzes with questions:

```json
{
  "id": "mechanica-quiz",
  "chapterId": "mechanica",
  "subjectId": "natuurkunde",
  "title": "Mechanica Quiz",
  "description": "Test je kennis van krachten",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Wat is de eenheid van kracht?",
      "options": ["Joule", "Newton", "Watt", "Pascal"],
      "correct_answer": 1,
      "explanation": "Kracht wordt gemeten in Newton"
    }
  ]
}
```

### Summaries (summaries/{id}.json)

Text summaries with markdown support:

```json
{
  "id": "mechanica-summary",
  "chapterId": "mechanica",
  "subjectId": "natuurkunde",
  "title": "Samenvatting Mechanica",
  "content": "# Mechanica\n\nMechanica is de tak van natuurkunde...",
  "tags": ["mechanica", "krachten", "newton"],
  "difficulty": "intermediate"
}
```

### Practice Tests (practice-tests/{id}.json)

Timed practice tests with scoring:

```json
{
  "id": "mechanica-practicetest",
  "chapterId": "mechanica",
  "subjectId": "natuurkunde",
  "title": "Mechanica Oefentoets",
  "description": "Complete oefentoets over mechanica",
  "duration_minutes": 45,
  "passing_score": 70,
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Wat is de netto kracht?",
      "options": ["2 N", "15 N", "50 N", "500 N"],
      "correct_answer": 2,
      "points": 5
    }
  ]
}
```

## Content Loader

The `lib/content-loader.ts` utility provides functions to load content from JSON files:

```typescript
import { loadSubject, loadChapters, loadLearningSet } from '@/lib/content-loader';

// Load a subject
const subject = await loadSubject('natuurkunde');

// Load all chapters for a subject
const chapters = await loadChapters('natuurkunde');

// Load a specific learning set
const learningSet = await loadLearningSet('natuurkunde', 'mechanica', 'krachten-beweging');
```

## Organization Principles

### 1. Hierarchical Structure
- Subjects contain chapters
- Chapters contain content types (learning sets, quizzes, summaries, practice tests)
- Each content type is in its own subdirectory

### 2. ID-Based References
- All IDs are lowercase with hyphens
- IDs are used for file references and database lookups
- Chapter.json references content by ID arrays

### 3. Consistent Naming
- Subject IDs match folder names
- Chapter IDs match folder names
- Content IDs match JSON filenames (without .json extension)

### 4. Scalability
- Adding new subjects: Create new folder under subjects/
- Adding new chapters: Create new folder under chapters/
- Adding new content: Create new JSON file in appropriate subdirectory
- No file conflicts due to hierarchical structure

## Benefits of JSON-Based Content

1. **Version Control**: Content can be tracked in Git
2. **Easy Editing**: Simple text files, no database access needed
3. **Backup**: Easy to backup entire content structure
4. **Collaboration**: Multiple people can edit content simultaneously
5. **Portability**: Content can be moved between environments
6. **Organization**: Clear hierarchical structure prevents clutter
7. **Validation**: JSON schema can validate content structure
8. **AI-Friendly**: Easy for AI agents to parse and generate content

## Integration with Supabase

The Admin CLI can sync JSON content to Supabase:

```bash
# Sync all content from JSON files to Supabase
node admin-cli/dist/index.js sync-content

# Sync specific subject
node admin-cli/dist/index.js sync-subject natuurkunde
```

## Adding New Content

### Adding a New Subject

1. Create folder: `content/subjects/{subject-id}/`
2. Create `subject.json` with subject metadata
3. Add subject to `subjects/index.json`
4. Create chapters subfolder
5. Add chapters with content

### Adding a New Chapter

1. Create folder: `content/subjects/{subject-id}/chapters/{chapter-id}/`
2. Create `chapter.json` with chapter metadata
3. Create content subdirectories (learning-sets, quizzes, etc.)
4. Add content files
5. Update chapter.json content references

### Adding New Learning Set

1. Create file: `content/subjects/{subject-id}/chapters/{chapter-id}/learning-sets/{id}.json`
2. Add learning set data following the schema
3. Update chapter.json to include the new learning set ID

## Best Practices

1. **Use Descriptive IDs**: Use clear, descriptive IDs (e.g., `krachten-beweging` not `ls1`)
2. **Keep Files Small**: Split large content into multiple files
3. **Use Markdown**: Use markdown in summaries for formatting
4. **Validate JSON**: Use JSON linters to ensure valid syntax
5. **Document Changes**: Update this README when adding new content types
6. **Consistent Formatting**: Use consistent indentation and spacing
7. **Use Tags**: Add relevant tags to summaries for better searchability
8. **Set Difficulty**: Always set difficulty level for summaries

## Current Content

### Natuurkunde (Physics)
- **Chapters**: Mechanica, Thermodynamica, Elektriciteit en Magnetisme
- **Learning Sets**: Krachten en Beweging, Energie en Werk, Warmte en Temperatuur, Elektrische Stromen
- **Quizzes**: Mechanica Quiz, Thermodynamica Quiz
- **Summaries**: Mechanica Summary, Thermodynamica Summary
- **Practice Tests**: Mechanica Oefentoets
