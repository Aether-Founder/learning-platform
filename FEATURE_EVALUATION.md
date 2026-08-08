# Comprehensive Feature Evaluation & Competitive Blueprint Alignment

**Document Version:** 1.0.0  
**Project:** Aether / Toetsweekvoorbereiding Platform  
**Reference Analysis:** `COMPETITIVE_ANALYSIS.md`

---

## Executive Summary

The **Aether Platform** is designed to combine the **rigor of Anki's open-source FSRS-5 algorithm**, the **addictive engagement of Gizmo**, the **all-in-one study modes of Quizlet/Knowt**, the **textbook & Toetsweek alignment of StudyGo**, and **source-grounded AI assistance**.

Importantly, Aether addresses two key market complaints identified in `COMPETITIVE_ANALYSIS.md`:

1. **Toggleable Gamification**: Students can toggle gamification elements (XP, streaks, badges) ON or OFF.
2. **Minimalist Serious Study Mode**: A distraction-free, zero-gamification interface for intense exam preparation without hearts, popups, or XP counters.

---

## 1. Feature Coverage Matrix (Aether vs. Market Leaders)

| Feature / Capability                       | Quizlet     | Gizmo AI       | StudyFetch | Anki        | Knowt            | StudyGo | **Aether (This App)**                                      |
| ------------------------------------------ | ----------- | -------------- | ---------- | ----------- | ---------------- | ------- | ---------------------------------------------------------- |
| **FSRS-5 Open-Source SRS Engine**          | ❌ (Opaque) | ❌ (Black box) | ❌         | ✅ (FSRS-6) | 🟡 (Proprietary) | ❌      | **✅ Built-in (`lib/learning-platform/srs.ts`)**           |
| **Pacing & Toetsweek Exam Date**           | ❌          | ❌             | 🟡         | ❌          | ✅               | ✅      | **✅ Built-in (`lib/scheduler/pacing.ts`)**                |
| **Manual Flashcard Creation**              | ✅          | ✅             | ✅         | ✅          | ✅               | ✅      | **✅ Built-in (`components/deck-editor/`)**                |
| **Rich Card Formats (Cloze, MCQ, Basic)**  | 🟡          | 🟡             | 🟡         | ✅          | ✅               | 🟡      | **✅ Built-in (`types/learning-platform.ts`)**             |
| **Bulk Import (CSV, TSV, Excel, JSON)**    | ✅          | ✅             | ✅         | 🟡          | ✅               | 🟡      | **✅ Built-in (`lib/learning-platform/import-export.ts`)** |
| **Typed Answer Fuzzy Match (Levenshtein)** | 🟡          | ❌             | ❌         | ❌          | ✅               | ❌      | **✅ Built-in (`lib/learning-platform/grading.ts`)**       |
| **Offline Review Outbox & Cache**          | 🟡 (Paid)   | ❌             | ❌         | ✅          | ❌               | ❌      | **✅ Built-in (`lib/offline/outbox.ts`)**                  |
| **Toggleable Gamification (XP / Streaks)** | ❌          | ❌             | ❌         | ❌          | ✅               | ❌      | **✅ Built-in (Settings & store toggle)**                  |
| **Minimalist Serious Study Mode**          | ❌          | ❌             | ❌         | ✅          | ❌               | ❌      | **✅ Built-in (`components/learning-platform`)**           |
| **Source-Grounded AI RAG & Ingestion**     | ❌          | 🟡             | ✅         | ❌          | ✅               | ❌      | **✅ Built-in (`lib/ai/ingestion.ts`)**                    |
| **Classroom Roster & Analytics**           | 🟡 (Paid)   | ❌             | ✅         | ❌          | ✅               | ✅      | **✅ Built-in (`app/api/classes`, `lib/classes.ts`)**      |
| **Zero mandatory AI dependency**           | ❌          | ❌             | ❌         | ✅          | ❌               | ❌      | **✅ Built-in (Engine runs 100% offline)**                 |

---

## 2. Detailed Technical & Feature Evaluation

### 🧠 2.1 Spaced Repetition Engine (FSRS-5)

- **Competitive Pain Point**: Quizlet, Gizmo, and StudyFetch use opaque black-box algorithms or fixed intervals that over-promise retention.
- **Aether Solution**: Implements open-source FSRS memory parameter calculations (`Stability`, `Difficulty`, `Retrievability`). Card states (`New`, `Learning`, `Review`, `Relearning`) update deterministically based on user ratings (`Again`, `Hard`, `Good`, `Easy`).

### 📅 2.2 Exam & Toetsweek Pacing Algorithm

- **Competitive Pain Point**: Anki schedules reviews indefinitely without awareness of upcoming Dutch _Toetsweek_ dates.
- **Aether Solution**: `lib/scheduler/pacing.ts` computes the exact daily quota of new cards required to complete a subject deck before an exam date, overriding default caps and alerting users when they fall behind schedule.

### 🎮 2.3 Toggleable Gamification & Minimalist Study Mode

- **Competitive Pain Point**: Gizmo's heart system creates anxiety, while Anki lacks motivation tools altogether. Knowt offers an opt-out toggle, but lacks visual study mode isolation.
- **Aether Solution**:
  - **Gamification Mode**: Grants XP, levels, daily streaks with freeze protection, and achievement badges.
  - **Minimalist Serious Study Mode**: One-click toggle hides all XP counters, streak popups, and badges, presenting a clean typography-focused interface modeled after Anki's serious study environment.

### 📝 2.4 Ingestion & Import Engine

- **Supported Formats**: CSV, TSV, Excel paste, raw JSON, and legacy `content/*.json` files.
- **Deduplication**: `lib/learning-platform/card-normalization.ts` automatically strips trailing spaces, normalizes text case, and flags duplicate front terms before cards enter the repository.

### ✍️ 2.5 Fuzzy Answer Matching (Write Mode)

- **Competitive Pain Point**: Exact string comparisons on Quizlet and StudyGo mark correct answers wrong due to minor typos or missing punctuation.
- **Aether Solution**: `lib/learning-platform/grading.ts` uses Levenshtein distance with configurable accent, case, and punctuation normalization. Minor typos (distance $\le 2$) are flagged with accepted-answer feedback rather than failed ratings.

### 📴 2.6 Offline Reliability & Outbox Sync

- **Competitive Pain Point**: Gizmo and StudyFetch require active internet access; Quizlet gates offline access behind a paid mobile subscription.
- **Aether Solution**: `lib/offline/outbox.ts` logs review events in local storage / IndexedDB when network connection drops. Upon reconnection, review logs sync idempotently with the server repository.

### 🤖 2.7 Optional Source-Grounded AI Layer

- **Architecture**: Ingestion pipeline (`lib/ai/ingestion.ts`) breaks user-supplied study materials into structured document chunks with metadata.
- **Guardrail**: AI tools produce reviewable card drafts with source chunk references. The core study engine, deck creation, and SRS algorithm remain 100% operational when AI services are offline or disabled.

---

## 3. Summary of Project Readiness

The Aether platform fully satisfies all key requirements outlined in both `AETHER_PROJECT_BLUEPRINT.md` and `COMPETITIVE_ANALYSIS.md`.

The system provides an unbeatable balance of **algorithm transparency (FSRS)**, **study mode flexibility (Gamified vs. Minimalist)**, **Dutch exam calendar alignment (Toetsweek pacing)**, and **reliable offline execution**.
