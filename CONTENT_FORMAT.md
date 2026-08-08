# Content Format Documentation

This document describes the JSON content formats supported by the application.

## Overview

The application supports three content formats:

1. **Legacy Format** - Original flashcard-based format with nested sections
2. **Paragraph Format** - Enhanced format with paragraph-based sections
3. **Textbook Format** - New format designed for educational content with long reading text, questions, and answers

---

## Textbook Format

The textbook format is designed for educational content that includes:

- Long reading text blocks (explanations, theory, examples)
- Numbered questions (e.g., 1a, 1b, 2, 3a, 3b, 4, etc.)
- Answers stored separately and displayed at the bottom of the page

### Format Detection

The application detects the textbook format when:

- `"contentFormat": "textbook"` is present in the root, OR
- Sections contain a `blocks` array with text/question blocks

### Structure

```json
{
  "siteMetadata": {
    "title": "Page Title",
    "description": "Page description"
  },
  "contentFormat": "textbook",
  "defaultViewMode": "book",
  "showTimestamps": false,
  "showExportButtons": false,
  "showAnkiExport": false,
  "showFlashcardsExport": false,
  "showTranscriptExport": false,
  "showCopyTranscript": false,
  "buttons": [...],
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "blocks": [
        {
          "id": "block-id",
          "type": "text",
          "content": "Long reading text in Markdown/LaTeX"
        },
        {
          "id": "questions-block-id",
          "type": "questions",
          "intro": "Optional intro sentence",
          "questions": [
            {
              "id": "question-id",
              "number": "1a",
              "text": "Question text in Markdown/LaTeX"
            }
          ]
        }
      ],
      "answers": [
        {
          "questionId": "question-id",
          "number": "1a",
          "answer": "Answer text in Markdown/LaTeX"
        }
      ]
    }
  ]
}
```

### Block Types

#### Text Block

```json
{
  "id": "blk-1-1",
  "type": "text",
  "content": "## Heading\n\nLong text with **Markdown** and $LaTeX$ support."
}
```

- `id`: Unique identifier for the block
- `type`: Must be `"text"`
- `content`: The reading content (supports Markdown and LaTeX)

#### Questions Block

```json
{
  "id": "blk-1-q",
  "type": "questions",
  "intro": "Beantwoord de volgende opgaven.",
  "questions": [
    {
      "id": "q-1a",
      "number": "1a",
      "text": "What is $f'(x)$ if $f(x) = x^2$?"
    }
  ]
}
```

- `id`: Unique identifier for the block
- `type`: Must be `"questions"`
- `intro` (optional): Introductory text displayed above the questions
- `questions`: Array of question objects

#### Answer Object

```json
{
  "questionId": "q-1a",
  "number": "1a",
  "answer": "$$f'(x) = 2x$$\n\nExplanation text..."
}
```

- `questionId`: Must match the `id` of the corresponding question
- `number`: Display number (e.g., "1a", "1b", "2")
- `answer`: The answer text (supports Markdown and LaTeX)

### View Modes

The textbook format supports all four view modes:

1. **Book Mode** - Displays text blocks and question blocks in order, with answers panel at the bottom (collapsible)
2. **Simple Mode** - Clean, minimal layout with text and questions, answers panel at bottom
3. **Study Mode** - Flashcard-style mode where each question is shown as a flip card with answer on the back
4. **Advanced Mode** - Integrates with the Advanced Learning System for spaced repetition

### Complete Example

See `content/example-textbook.json` for a complete example with:

- Multiple sections
- Text blocks with Markdown/LaTeX
- Questions with numbered sub-questions (1a, 1b, 2, 3a, 3b, etc.)
- Answers with detailed explanations
- Proper linking between questions and answers via `questionId`

### Question Numbering

Questions can have any numbering scheme:

- Simple: "1", "2", "3"
- With letters: "1a", "1b", "1c"
- Mixed: "1", "2a", "2b", "3", "4a", "4b", "4c"

The `number` field is purely for display - the actual linking is done via the `id` and `questionId` fields.

### Content Guidelines

1. **Text Blocks**: Use for explanations, theory, examples, and any long-form content
2. **Questions Blocks**: Use to group related questions together
3. **Answers**: Always include at the section level, not per block
4. **Markdown/LaTeX**: Both text and answers support full Markdown syntax and LaTeX math
5. **Newlines**: Use `\n` for line breaks in JSON strings

---

## Legacy Format

The legacy format is the original flashcard-based format with nested sections.

### Structure

```json
{
  "siteMetadata": {
    "title": "Page Title",
    "description": "Page description"
  },
  "showTimestamps": true,
  "sections": [
    {
      "id": "section-id",
      "timestamp": "00:00",
      "title": "Section Title",
      "questions": [
        {
          "id": "question-id",
          "number": "1",
          "text": "Question text"
        }
      ]
    }
  ]
}
```

---

## Paragraph Format

The paragraph format enhances the legacy format by adding paragraph-based sections.

### Structure

```json
{
  "siteMetadata": {
    "title": "Page Title",
    "description": "Page description"
  },
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "paragraphs": [
        {
          "id": "paragraph-id",
          "title": "Paragraph Title",
          "content": "Paragraph content",
          "questions": [...]
        }
      ]
    }
  ]
}
```

---

## Choosing a Format

- **Use Textbook Format** for educational content with reading material, exercises, and solutions
- **Use Paragraph Format** for content organized by topics with embedded questions
- **Use Legacy Format** for simple flashcard-style content (not recommended for new content)

---

## Migration Guide

To migrate from Legacy/Paragraph to Textbook format:

1. Add `"contentFormat": "textbook"` to the root
2. Convert paragraph content to text blocks
3. Extract questions into separate question blocks
4. Move answers to the section-level `answers` array
5. Ensure all questions have unique IDs
6. Link answers to questions via `questionId`

---

## Support

For questions or issues with content formats, refer to the example files in the `content/` directory or check the component implementations in `components/`.
