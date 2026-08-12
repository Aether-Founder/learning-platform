hytyhhhhhyy# Design: Advanced Study Modes and Learning System

## Overview

The existing app exposes paragraph-based study content and a basic `StudyMode` flashcard surface. The advanced learning system extends that into a local-only study dashboard with four interactive modes, session configuration, SRS scheduling, and progress statistics for the JSON-provided content.

All persisted data stays in the browser. Structured state is stored in `localStorage`; larger media blobs are designed for IndexedDB. The system is self-contained in reusable client modules and components so the static content pages can immediately use the new study modes while custom learning sets can be added from the browser.

## Architecture

The system is organized into three layers:

1. **Data layer** — `lib/learning-system.ts` owns all types, algorithms (SM-2, FSRS, Levenshtein), and localStorage persistence.
2. **Component layer** — `components/AdvancedLearningSystem.tsx` owns the study session UI, mode switching, and stats dashboard.
3. **Integration layer** — The page mode switcher mounts `AdvancedLearningSystem` with the current page's sections as props.

## Data Models

### LearningSet

```typescript
interface LearningSet {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cards: StudyCard[];
  dailyNewLimit: number;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
}
```

### StudyCard

```typescript
interface StudyCard {
  id: string;
  front: string;
  back: string;
  type: 'basic' | 'cloze' | 'image-occlusion';
  difficulty?: 'easy' | 'medium' | 'hard';
  clozeText?: string;
  imageUrl?: string;
  audioUrl?: string;
  occlusions?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### CardProgress

```typescript
interface CardProgress {
  cardId: string;
  sm2: {
    easeFactor: number; // 1.3–2.5, starts at 2.5
    intervalDays: number;
    repetitions: number;
    nextReviewAt: string; // ISO date
  };
  fsrs: {
    difficulty: number; // 1–10
    stability: number;
    retrievability: number;
    nextReviewAt: string;
  };
  reviews: number;
  correct: number;
  totalTimeMs: number;
  responses: Record<'again' | 'hard' | 'good' | 'easy', number>;
}
```

### UserStats

```typescript
interface UserStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  cardsReviewed: number;
  sessionsCompleted: number;
  perfectSessions: number;
  fastReviews: number;
  setsCreated: number;
  totalStudyTimeMs: number;
  responses: Record<ResponseQuality, number>;
  dailyActivity: Record<string, { cards: number; timeMs: number }>;
  unlockedAchievements: string[];
  challenge?: DailyChallenge;
}
```

### SessionPreferences

```typescript
interface SessionPreferences {
  mode: 'flashcard' | 'multiple-choice' | 'typing' | 'matching';
  cardLimit: number;
  timeLimitMinutes: number;
  reviewMix: 'due' | 'new' | 'mix';
  fuzzyThreshold: number; // 70–95, default 80
  autoplayAudio: boolean;
  srsAlgorithm: 'sm2' | 'fsrs';
}
```

### StudyResponse (normalized output from all modes)

```typescript
interface StudyResponse {
  cardId: string;
  quality: 'again' | 'hard' | 'good' | 'easy';
  isCorrect: boolean;
  timeMs: number;
}
```

## Components and Interfaces

### `lib/learning-system.ts` — Core logic module

Pure functions and types, no React dependencies.

| Export                                            | Purpose                                    |
| ------------------------------------------------- | ------------------------------------------ |
| `updateSm2(progress, quality)`                    | SM-2 interval calculation                  |
| `updateFsrs(progress, quality)`                   | FSRS interval calculation                  |
| `updateProgress(progress, response)`              | Merge a StudyResponse into CardProgress    |
| `levenshtein(a, b)`                               | Edit distance                              |
| `similarityPercent(input, answer)`                | 0–100 similarity score                     |
| `qualityFromSimilarity(percent)`                  | Maps similarity to ResponseQuality         |
| `generateOptions(cards, card)`                    | Distractor generation for multiple choice  |
| `getDueCards(set, progress, algorithm)`           | Cards due for review now                   |
| `forecastDueCards(set, progress, algorithm)`      | 7-day review forecast                      |
| `applySessionResults(stats, responses, setCount)` | XP, streak, achievement, challenge updates |
| `loadLearningState()`                             | SSR-safe localStorage read                 |
| `saveLearningState(state)`                        | localStorage write                         |
| `parseImportText(text)`                           | Parse tab/comma/pipe-delimited import      |
| `createLearningSet(name, cards)`                  | Factory for new sets                       |

### `components/AdvancedLearningSystem.tsx` — Main UI component

```typescript
interface AdvancedLearningSystemProps {
  sourceSections?: SourceSection[]; // Page content to convert to cards
}
```

Internal sub-components:

- `StudySession` — Owns mode state, card index, response collection, and session summary
- `CardContent` — Renders markdown/LaTeX card text
- `StatPill` — Reusable stat display widget

Tabs: `study` | `stats` | `settings`

### Study Mode Interfaces

**Flashcard Mode**

- Click or Space to flip
- Keys 1–4 record Again/Hard/Good/Easy after reveal
- 3D CSS flip animation (600ms)

**Multiple Choice Mode**

- 4 options: 1 correct + 3 distractors from similar cards
- Keys A–D select options
- Immediate color feedback (green/red)
- Correct → "good", incorrect → "again"

**Typing Mode**

- Textarea input, submitted via form
- Levenshtein similarity calculated on submit
- Configurable threshold (default 80%)
- Quality mapping: 100%=easy, 90–99%=good, 75–89%=hard, <75%=again

**Matching Mode**

- 4–6 shuffled pairs displayed in two columns
- Click question then answer to match
- Correct pairs lock with green highlight
- Completion triggers session summary

### Storage Interface

```typescript
const STORAGE_KEY = 'advanced-learning-system-v1';
// loadLearningState() — SSR-safe, returns defaults before hydration
// saveLearningState(state) — serializes to JSON, excludes generated sets
```

## Correctness Properties

The following properties must hold for the system to be correct:

1. **SM-2 ease factor bounds** — `easeFactor` must always remain in `[1.3, 2.5]` after any update.
2. **SM-2 "again" resets** — A response of "again" must reset `repetitions` to 0 and schedule review within 1–2 minutes.
3. **Similarity symmetry** — `similarityPercent(a, b)` must equal `similarityPercent(b, a)` for any strings a, b.
4. **Similarity bounds** — `similarityPercent` must always return a value in `[0, 100]`.
5. **Quality mapping monotonicity** — Higher similarity must never produce a lower quality rating (easy ≥ good ≥ hard ≥ again).
6. **Distractor uniqueness** — `generateOptions` must always return exactly 4 options with no duplicates.
7. **XP monotonicity** — `totalXp` must never decrease after applying session results.
8. **Streak consistency** — `currentStreak` must be ≤ `longestStreak` at all times.
9. **Due card correctness** — A card with `nextReviewAt` in the future must not appear in `getDueCards`.
10. **Forecast completeness** — `forecastDueCards` must return exactly 7 entries, one per day.

## Error Handling

| Scenario                                       | Handling                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `localStorage` unavailable (SSR, private mode) | `loadLearningState` returns safe defaults; `saveLearningState` is a no-op |
| Corrupted localStorage JSON                    | `try/catch` in `loadLearningState` returns defaults                       |
| Empty card set                                 | `StudySession` renders "no cards due" message                             |
| Import with malformed lines                    | `parseImportText` skips invalid lines and returns warnings array          |
| Missing card progress                          | `getDefaultProgress` initializes fresh SM-2/FSRS state                    |
| Zero-length answer in similarity               | `Math.max(..., 1)` prevents division by zero                              |

## Testing Strategy

### Unit tests (pure functions in `lib/learning-system.ts`)

- SM-2: ease factor clamping, interval progression, "again" reset behavior
- FSRS: difficulty/stability updates, interval calculation
- Levenshtein: known edit distances, empty strings, identical strings
- `similarityPercent`: bounds, symmetry, exact match = 100
- `qualityFromSimilarity`: boundary values (75, 90, 100)
- `generateOptions`: always 4 options, no duplicates, correct answer included
- `getDueCards`: cards past due date included, future cards excluded
- `applySessionResults`: XP accumulation, streak increment, achievement unlock

### Integration smoke tests

- Load page with study content → AdvancedLearningSystem renders
- Complete a flashcard session → summary shows correct counts
- Switch modes mid-session → index resets, no stale state
- Settings changes persist across page reload (localStorage round-trip)
- Import text file → cards appear in session

### Build verification

- `next build` or `tsc --noEmit` passes with no type errors
- No ESLint errors on modified files
