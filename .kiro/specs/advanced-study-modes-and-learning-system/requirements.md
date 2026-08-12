# Requirements Document

## Introduction

This document specifies requirements for adding comprehensive study modes and learning features to a Next.js/TypeScript flashcard application. The system will provide four distinct study modes (Flashcard, Multiple Choice, Typing, and Matching), learning set management with spaced repetition, and a gamification system with achievements and progress tracking. All functionality will be local-only, storing data in browser storage without requiring authentication or cloud services.

## Glossary

- **Study_Mode**: An interactive learning interface that presents flashcard content in a specific format (Flashcard, Multiple Choice, Typing, or Matching)
- **Learning_Set**: A collection of flashcards organized by subject or topic, also called "Leerset"
- **Flashcard**: A learning unit containing a question (front) and answer (back), with optional rich content (images, audio, LaTeX)
- **SRS**: Spaced Repetition System - an algorithm that schedules card reviews based on performance to optimize long-term retention
- **SM2_Algorithm**: SuperMemo 2 algorithm for calculating optimal review intervals based on ease factor and repetition count
- **FSRS**: Free Spaced Repetition Scheduler - an alternative spaced repetition algorithm
- **Ease_Factor**: A multiplier (typically 1.3-2.5) that determines how quickly review intervals increase for a card
- **Response_Quality**: User's self-assessment of recall difficulty (Again, Hard, Good, Easy)
- **Levenshtein_Distance**: Edit distance metric measuring the minimum number of single-character edits needed to transform one string into another
- **Fuzzy_Matching**: Text comparison that accepts answers with minor spelling variations based on similarity threshold
- **Distractor**: An incorrect answer option in multiple choice questions
- **Cloze_Deletion**: A card type where parts of text are hidden for the user to fill in
- **Image_Occlusion**: A card type where parts of an image are hidden for the user to identify
- **XP**: Experience Points - numerical reward for completing study activities
- **Achievement**: A milestone or goal that rewards the user with XP when completed
- **Streak**: Consecutive days of study activity
- **Challenge**: A time-limited goal with specific criteria (speed, accuracy, volume, consistency)
- **Local_Storage**: Browser-based data persistence mechanism for storing application data without server communication
- **IndexedDB**: Browser-based database API for storing larger amounts of structured data locally

## Requirements

### Requirement 1: Flashcard Study Mode

**User Story:** As a student, I want to study using traditional flashcards with flip animations and spaced repetition responses, so that I can review material in a familiar format and track my recall quality.

#### Acceptance Criteria

1. WHEN a user selects Flashcard Mode for a Learning_Set, THE Study_Mode SHALL display the first Flashcard with only the front visible
2. WHEN a user clicks on a Flashcard, THE Study_Mode SHALL animate a 3D flip transition and reveal the back
3. WHEN a Flashcard back is revealed, THE Study_Mode SHALL display four response buttons labeled "Again", "Hard", "Good", and "Easy"
4. WHEN a user clicks a response button or presses keys 1-4, THE Study_Mode SHALL record the Response_Quality and advance to the next Flashcard
5. WHEN a user presses keyboard shortcuts (1=Again, 2=Hard, 3=Good, 4=Easy), THE Study_Mode SHALL register the corresponding Response_Quality
6. FOR ALL Flashcard interactions, THE Study_Mode SHALL track the time spent viewing each card
7. THE Flashcard flip animation SHALL complete within 600 milliseconds
8. WHEN a user completes all cards in a session, THE Study_Mode SHALL display summary statistics including total time and response distribution

### Requirement 2: Multiple Choice Study Mode

**User Story:** As a student, I want to answer multiple choice questions with auto-generated distractors, so that I can test my knowledge in a quiz format with immediate feedback.

#### Acceptance Criteria

1. WHEN a user selects Multiple Choice Mode for a Learning_Set, THE Study_Mode SHALL generate a question from the current Flashcard front
2. WHEN generating answer options, THE Study_Mode SHALL include the correct answer and three Distractors selected from similar cards in the Learning_Set
3. WHEN selecting Distractors, THE Study_Mode SHALL prioritize answers from cards with similar content based on text similarity
4. WHEN displaying answer options, THE Study_Mode SHALL randomize the position of the correct answer
5. WHEN a user selects an answer or presses keys A-D, THE Study_Mode SHALL provide immediate visual feedback with color coding (green for correct, red for incorrect)
6. WHEN a user selects an incorrect answer, THE Study_Mode SHALL highlight the correct answer in green
7. WHEN a user answers correctly on first attempt, THE Study_Mode SHALL map the response to "Good" quality
8. WHEN a user answers incorrectly, THE Study_Mode SHALL map the response to "Again" quality
9. FOR ALL answer selections, THE Study_Mode SHALL record the response time and accuracy

### Requirement 3: Typing Study Mode with Fuzzy Matching

**User Story:** As a student, I want to type answers and have them evaluated with fuzzy matching, so that minor spelling variations are accepted and I receive appropriate difficulty ratings.

#### Acceptance Criteria

1. WHEN a user selects Typing Mode for a Learning_Set, THE Study_Mode SHALL display the Flashcard front and an input field
2. WHEN a user submits a typed answer, THE Study_Mode SHALL calculate the Levenshtein_Distance between the typed answer and correct answer
3. WHEN calculating similarity, THE Study_Mode SHALL normalize both strings to lowercase and trim whitespace
4. WHEN similarity is 100%, THE Study_Mode SHALL map the response to "Easy" quality
5. WHEN similarity is between 90% and 99%, THE Study_Mode SHALL map the response to "Good" quality
6. WHEN similarity is between 75% and 89%, THE Study_Mode SHALL map the response to "Hard" quality
7. WHEN similarity is below 75%, THE Study_Mode SHALL map the response to "Again" quality
8. THE Fuzzy_Matching similarity threshold SHALL be configurable between 70% and 95%
9. WHEN a user submits an answer, THE Study_Mode SHALL display the correct answer and the calculated similarity percentage
10. FOR ALL typed answers, THE Study_Mode SHALL accept spelling variations that meet the similarity threshold

### Requirement 4: Matching Study Mode

**User Story:** As a student, I want to match multiple question-answer pairs simultaneously, so that I can practice associations and pattern recognition.

#### Acceptance Criteria

1. WHEN a user selects Matching Mode for a Learning_Set, THE Study_Mode SHALL display 4-6 Flashcard fronts in one column and their shuffled backs in another column
2. WHEN displaying answer options, THE Study_Mode SHALL randomize the order of answers independently from questions
3. WHEN a user clicks a question, THE Study_Mode SHALL highlight it as selected
4. WHEN a user clicks an answer while a question is selected, THE Study_Mode SHALL create a match and visually connect them
5. WHEN a match is correct, THE Study_Mode SHALL display positive visual feedback and lock the pair
6. WHEN a match is incorrect, THE Study_Mode SHALL display negative visual feedback and allow reselection
7. WHEN all pairs are correctly matched, THE Study_Mode SHALL display a completion celebration and summary statistics
8. THE Study_Mode SHALL track the number of attempts and time taken to complete all matches
9. WHEN a user completes matching with 80% or higher accuracy on first attempts, THE Study_Mode SHALL map performance to "Good" quality for all cards
10. WHEN a user completes matching with below 80% accuracy, THE Study_Mode SHALL map performance to "Hard" quality for all cards

### Requirement 5: Learning Set Management

**User Story:** As a student, I want to create and organize flashcard collections by subject, so that I can manage my study materials effectively.

#### Acceptance Criteria

1. THE Application SHALL allow users to create new Learning_Sets with a name and optional description
2. THE Application SHALL allow users to add Flashcards to a Learning_Set manually through a form interface
3. THE Application SHALL allow users to edit existing Flashcards within a Learning_Set
4. THE Application SHALL allow users to delete Flashcards from a Learning_Set
5. THE Application SHALL allow users to delete entire Learning_Sets
6. THE Application SHALL display a list of all Learning_Sets with card counts and last studied date
7. WHEN a user creates or modifies a Learning_Set, THE Application SHALL persist the changes to Local_Storage
8. THE Application SHALL organize Learning_Sets by subject or topic categories
9. THE Application SHALL allow users to reorder Flashcards within a Learning_Set

### Requirement 6: Text File Import for Learning Sets

**User Story:** As a student, I want to import flashcards from text files, so that I can quickly create Learning_Sets from existing study materials.

#### Acceptance Criteria

1. THE Application SHALL accept text file uploads in common formats (txt, csv)
2. WHEN parsing a text file, THE Application SHALL recognize question-answer pairs separated by a delimiter (tab, comma, or pipe)
3. WHEN parsing a text file, THE Application SHALL create a Flashcard for each valid question-answer pair
4. WHEN a text file contains invalid or malformed entries, THE Application SHALL skip those entries and log warnings
5. WHEN import is complete, THE Application SHALL display a summary showing the number of cards successfully imported and any errors
6. THE Application SHALL allow users to preview imported cards before adding them to a Learning_Set
7. WHEN importing cards, THE Application SHALL add them to an existing Learning_Set or create a new one

### Requirement 7: Rich Content Support in Flashcards

**User Story:** As a student, I want to include images, audio, and mathematical notation in my flashcards, so that I can study diverse content types.

#### Acceptance Criteria

1. THE Application SHALL allow users to add images to Flashcard fronts and backs via file upload or URL
2. THE Application SHALL allow users to add audio files to Flashcard fronts and backs via file upload
3. THE Application SHALL render LaTeX mathematical notation in Flashcard content using a LaTeX rendering library
4. WHEN a Flashcard contains an image, THE Application SHALL display it with appropriate sizing and aspect ratio
5. WHEN a Flashcard contains audio, THE Application SHALL display a play button and audio controls
6. WHEN a Flashcard contains LaTeX, THE Application SHALL render it as formatted mathematical notation
7. THE Application SHALL store image and audio data in IndexedDB to avoid Local_Storage size limits
8. WHEN a Flashcard contains multiple content types, THE Application SHALL display them in a readable layout

### Requirement 8: Basic Card Type Support

**User Story:** As a student, I want to create basic front-back flashcards, so that I can study simple question-answer pairs.

#### Acceptance Criteria

1. THE Application SHALL support Basic card type with separate front and back fields
2. WHEN creating a Basic card, THE Application SHALL require both front and back content
3. WHEN studying a Basic card, THE Study_Mode SHALL display the front first and reveal the back on interaction
4. THE Application SHALL store Basic cards with front and back properties in the data model

### Requirement 9: Cloze Deletion Card Type

**User Story:** As a student, I want to create fill-in-the-blank style cards with cloze deletions, so that I can practice recalling specific terms within context.

#### Acceptance Criteria

1. THE Application SHALL support Cloze_Deletion card type with text containing one or more hidden segments
2. WHEN creating a Cloze_Deletion card, THE Application SHALL allow users to mark text segments for hiding using a syntax (e.g., {{c1::hidden text}})
3. WHEN studying a Cloze_Deletion card, THE Study_Mode SHALL display the text with marked segments replaced by blanks
4. WHEN a user reveals the answer, THE Study_Mode SHALL show the complete text with hidden segments visible
5. THE Application SHALL support multiple cloze deletions in a single card (c1, c2, c3, etc.)
6. WHEN a card has multiple cloze deletions, THE Application SHALL create separate review instances for each deletion

### Requirement 10: Image Occlusion Card Type

**User Story:** As a student, I want to hide parts of images for study, so that I can practice identifying anatomical structures, diagrams, or labeled components.

#### Acceptance Criteria

1. THE Application SHALL support Image_Occlusion card type with an image and one or more hidden regions
2. WHEN creating an Image_Occlusion card, THE Application SHALL provide a tool to draw rectangular masks over image regions
3. WHEN studying an Image_Occlusion card, THE Study_Mode SHALL display the image with masked regions hidden or blurred
4. WHEN a user reveals the answer, THE Study_Mode SHALL remove the masks and show the complete image
5. THE Application SHALL allow users to add labels or text to each masked region
6. WHEN a card has multiple masked regions, THE Application SHALL create separate review instances for each region

### Requirement 11: SM-2 Algorithm Implementation

**User Story:** As a student, I want my review schedule optimized using the SM-2 algorithm, so that I review cards at optimal intervals for long-term retention.

#### Acceptance Criteria

1. THE SRS SHALL implement the SM2_Algorithm for calculating review intervals
2. WHEN a card is reviewed for the first time, THE SRS SHALL initialize its Ease_Factor to 2.5
3. WHEN a user responds "Again", THE SRS SHALL reset the card's repetition count to 0 and schedule it for review in 1 minute
4. WHEN a user responds "Hard", THE SRS SHALL multiply the Ease_Factor by 0.85 and schedule the next review at 1.2x the previous interval
5. WHEN a user responds "Good", THE SRS SHALL maintain the Ease_Factor and schedule the next review at the calculated interval (previous interval × Ease_Factor)
6. WHEN a user responds "Easy", THE SRS SHALL multiply the Ease_Factor by 1.15 and schedule the next review at 1.3x the calculated interval
7. THE SRS SHALL ensure Ease_Factor remains between 1.3 and 2.5
8. WHEN calculating intervals, THE SRS SHALL use the formula: new_interval = previous_interval × Ease_Factor
9. FOR ALL cards, THE SRS SHALL store the next review date, repetition count, and Ease_Factor

### Requirement 12: FSRS Algorithm Support

**User Story:** As a student, I want the option to use the FSRS algorithm for spaced repetition, so that I can benefit from modern scheduling research.

#### Acceptance Criteria

1. THE Application SHALL support FSRS as an alternative to SM2_Algorithm
2. THE Application SHALL allow users to select their preferred SRS algorithm (SM-2 or FSRS) in settings
3. WHEN FSRS is selected, THE SRS SHALL calculate review intervals using the FSRS formula based on card difficulty, stability, and retrievability
4. WHEN a user responds to a card, THE SRS SHALL update the card's difficulty and stability parameters according to FSRS rules
5. THE SRS SHALL maintain separate scheduling data for each algorithm to allow switching without data loss
6. WHEN switching algorithms, THE Application SHALL inform the user that scheduling will be recalculated

### Requirement 13: Review Scheduling and Due Cards

**User Story:** As a student, I want to see which cards are due for review, so that I can focus on cards that need reinforcement.

#### Acceptance Criteria

1. THE Application SHALL calculate which cards are due for review based on the current date and each card's next review date
2. THE Application SHALL display the count of due cards for each Learning_Set on the main interface
3. WHEN a user starts a study session, THE Study_Mode SHALL prioritize due cards over new cards
4. THE Application SHALL allow users to set a daily new card limit per Learning_Set
5. WHEN the new card limit is reached, THE Study_Mode SHALL only show due cards for review
6. THE Application SHALL display a forecast showing the number of cards due in the next 7 days
7. WHEN no cards are due, THE Application SHALL display a message indicating the next review date

### Requirement 14: XP and Level Progression System

**User Story:** As a student, I want to earn experience points and level up, so that I feel motivated and see my progress over time.

#### Acceptance Criteria

1. THE Application SHALL award XP for completing study activities (reviewing cards, completing sessions, maintaining streaks)
2. WHEN a user reviews a card, THE Application SHALL award 10 XP for "Easy", 7 XP for "Good", 5 XP for "Hard", and 2 XP for "Again"
3. WHEN a user completes a study session, THE Application SHALL award bonus XP based on session length (50 XP for 10+ cards, 100 XP for 25+ cards)
4. THE Application SHALL calculate user level based on total XP using a progressive formula (level = floor(sqrt(total_XP / 100)))
5. WHEN a user gains enough XP to level up, THE Application SHALL display a level-up notification with visual celebration
6. THE Application SHALL display current level, current XP, and XP needed for next level on the user interface
7. THE Application SHALL persist XP and level data in Local_Storage

### Requirement 15: Streak Tracking System

**User Story:** As a student, I want to track my study streaks, so that I stay motivated to study consistently.

#### Acceptance Criteria

1. THE Application SHALL track the current streak (consecutive days with at least one study session)
2. THE Application SHALL track the longest streak ever achieved
3. WHEN a user completes at least one study session on a day, THE Application SHALL increment the current streak
4. WHEN a user misses a day without studying, THE Application SHALL reset the current streak to 0
5. THE Application SHALL display both current streak and longest streak on the main interface
6. WHEN a user reaches a streak milestone (7, 30, 100, 365 days), THE Application SHALL award bonus XP (50, 200, 500, 1000 XP respectively)
7. THE Application SHALL persist streak data in Local_Storage with the last study date

### Requirement 16: Achievement System

**User Story:** As a student, I want to unlock achievements for reaching milestones, so that I have goals to work toward and feel accomplished.

#### Acceptance Criteria

1. THE Application SHALL define achievements across multiple categories (cards reviewed, sessions completed, streaks, perfect scores, speed)
2. THE Application SHALL assign each achievement a tier (Bronze, Silver, Gold, Platinum) with corresponding XP rewards (50, 100, 250, 500 XP)
3. WHEN a user meets achievement criteria, THE Application SHALL unlock the achievement and award the XP
4. THE Application SHALL display a notification when an achievement is unlocked
5. THE Application SHALL provide an achievements page showing all achievements with progress bars for incomplete ones
6. THE Application SHALL display achievement icons with visual distinction between locked and unlocked states
7. THE Application SHALL persist achievement progress and unlock status in Local_Storage
8. THE Application SHALL include at least 20 distinct achievements covering various study activities

### Requirement 17: Daily Challenge System

**User Story:** As a student, I want to complete daily challenges with bonus rewards, so that I have varied goals and extra motivation.

#### Acceptance Criteria

1. THE Application SHALL generate a new daily challenge each day from four challenge types (Speed, Accuracy, Volume, Consistency)
2. WHEN the challenge type is Speed, THE Application SHALL require completing N cards in under M seconds per card
3. WHEN the challenge type is Accuracy, THE Application SHALL require achieving X% correct responses in a session
4. WHEN the challenge type is Volume, THE Application SHALL require reviewing Y cards in a single day
5. WHEN the challenge type is Consistency, THE Application SHALL require studying for Z consecutive days
6. WHEN a user completes a daily challenge, THE Application SHALL award bonus XP (100-300 XP based on difficulty)
7. THE Application SHALL display the current daily challenge with progress on the main interface
8. THE Application SHALL reset the daily challenge at midnight local time
9. THE Application SHALL persist challenge progress in Local_Storage

### Requirement 18: Local Data Persistence

**User Story:** As a student, I want all my data stored locally in my browser, so that I can use the application without creating an account or requiring internet connectivity.

#### Acceptance Criteria

1. THE Application SHALL store all Learning_Sets, Flashcards, and study progress in Local_Storage
2. THE Application SHALL store large binary data (images, audio) in IndexedDB
3. THE Application SHALL store user statistics (XP, level, streaks, achievements) in Local_Storage
4. THE Application SHALL store SRS scheduling data (next review dates, ease factors) in Local_Storage
5. WHEN Local_Storage approaches capacity limits, THE Application SHALL display a warning to the user
6. THE Application SHALL provide a data export function to download all data as JSON
7. THE Application SHALL provide a data import function to restore data from a JSON file
8. THE Application SHALL not require authentication, user accounts, or server communication for core functionality

### Requirement 19: Statistics and Progress Visualization

**User Story:** As a student, I want to see statistics about my study habits and progress, so that I can understand my learning patterns and areas for improvement.

#### Acceptance Criteria

1. THE Application SHALL display total cards reviewed (all-time and per Learning_Set)
2. THE Application SHALL display total study time (all-time and per Learning_Set)
3. THE Application SHALL display response distribution (percentage of Again/Hard/Good/Easy responses)
4. THE Application SHALL display a retention rate calculated from card maturity and review success
5. THE Application SHALL display a calendar heatmap showing study activity over the past year
6. THE Application SHALL display a chart showing daily review counts for the past 30 days
7. THE Application SHALL display average session length and cards per session
8. THE Application SHALL persist all statistics in Local_Storage and update them after each study session

### Requirement 20: Study Session Configuration

**User Story:** As a student, I want to configure study session parameters, so that I can customize my learning experience.

#### Acceptance Criteria

1. THE Application SHALL allow users to select which Study_Mode to use for a session
2. THE Application SHALL allow users to set a card limit for a study session (e.g., review 20 cards)
3. THE Application SHALL allow users to set a time limit for a study session (e.g., study for 15 minutes)
4. THE Application SHALL allow users to choose between reviewing due cards only, new cards only, or a mix
5. THE Application SHALL allow users to enable or disable audio autoplay for cards with audio content
6. THE Application SHALL allow users to adjust the Fuzzy_Matching similarity threshold for Typing Mode
7. THE Application SHALL persist user preferences in Local_Storage
8. WHEN a time or card limit is reached, THE Application SHALL end the session and display summary statistics
