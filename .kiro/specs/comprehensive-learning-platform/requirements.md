# Requirements Document

## Introduction

This document specifies requirements for a comprehensive learning platform that expands an existing Next.js/TypeScript flashcard application with five distinct learning modes, three gamification modules, a powerful configuration engine, and an analytics dashboard. The platform provides adaptive learning through spaced repetition, multiple question formats, and mastery tracking while maintaining engagement through game-based learning activities. All functionality operates locally in the browser without requiring authentication or server infrastructure.

## Glossary

- **Learning_Mode**: An interactive study interface with specific pedagogical approach (Enhanced Flashcard, Learn, Test, MCQ Only, Writing Only)
- **Gamification_Module**: A game-based learning activity that reinforces flashcard content through play (Match Game, Blast Game, Blocks Game)
- **Active_Study_Set**: The currently selected collection of flashcards for study or gameplay
- **Term**: The question or prompt side of a flashcard
- **Definition**: The answer or explanation side of a flashcard
- **Mastery_Status**: A term's learning state (Not Studied, Learning, Mastered)
- **Consecutive_Correct_Count**: Number of times a term has been answered correctly in succession
- **Spaced_Repetition**: Learning technique that schedules reviews at increasing intervals based on performance
- **MCQ**: Multiple Choice Question with one correct answer and three distractors
- **Written_Question**: Free-form text input question requiring exact or fuzzy-matched answer
- **True_False_Question**: Binary choice question derived from term-definition pairs
- **Levenshtein_Distance**: Edit distance metric measuring minimum single-character edits to transform one string into another
- **Smart_Grading**: Answer evaluation that accepts responses within a configurable Levenshtein distance threshold
- **Distractor**: An incorrect answer option in multiple choice questions
- **Study_Session**: A bounded learning activity with configured parameters and tracked outcomes
- **UserTermProgress**: Database record tracking mastery status and performance history for a specific term
- **StudySession**: Database record capturing session metadata, configuration, and aggregate results
- **Configuration_Engine**: System managing user preferences that control behavior across all modes and games
- **Mastery_Bucket**: Grouping of terms by mastery status for progress visualization
- **Progress_Bar**: Visual representation of mastery distribution (grey=Not Studied, yellow=Learning, green=Mastered)
- **Star_Functionality**: User-initiated marking of terms for priority review
- **Exam_Date**: User-configured target date that influences term prioritization in adaptive algorithms
- **Round_Length**: Configured number of terms to present in a single study session
- **Question_Format**: Configuration determining whether questions show Term→Definition or Definition→Term
- **Override_Grading**: Manual correction capability allowing users to mark answers as correct despite algorithm judgment
- **Canvas_Rendering**: HTML5 Canvas API used for game graphics and animations
- **Physics_Library**: External library providing collision detection and motion simulation for games
- **Block_Puzzle_Logic**: Game mechanic requiring flashcard answers to unlock block placement
- **Modal_Interceptor**: UI pattern that presents flashcard questions before allowing game actions

## Requirements

### Requirement 1: Enhanced Flashcard Mode with Keyboard Navigation

**User Story:** As a student, I want to navigate flashcards with keyboard shortcuts and swipe gestures while self-reporting my mastery, so that I can efficiently review material with minimal friction.

#### Acceptance Criteria

1. WHEN a user enters Enhanced Flashcard Mode, THE Learning_Mode SHALL display the first term from the Active_Study_Set
2. WHEN a user presses Space or clicks the card, THE Learning_Mode SHALL flip the card to reveal the definition with a 3D animation
3. WHEN a card is flipped, THE Learning_Mode SHALL display four mastery buttons labeled "Again", "Hard", "Good", and "Easy"
4. WHEN a user presses keys 1-4, THE Learning_Mode SHALL record the corresponding mastery level (1=Again, 2=Hard, 3=Good, 4=Easy) and advance to the next card
5. WHEN a user swipes left on a card, THE Learning_Mode SHALL record "Again" mastery and advance
6. WHEN a user swipes right on a card, THE Learning_Mode SHALL record "Good" mastery and advance
7. WHEN a user presses the left arrow key, THE Learning_Mode SHALL navigate to the previous card
8. WHEN a user presses the right arrow key, THE Learning_Mode SHALL navigate to the next card
9. THE card flip animation SHALL complete within 400 milliseconds
10. WHEN a user completes all cards in the session, THE Learning_Mode SHALL display summary statistics including mastery distribution and total time

### Requirement 2: Learn Mode with Adaptive Spaced Repetition

**User Story:** As a student, I want an adaptive learning mode that progresses from multiple choice to written questions based on my mastery, so that I build confidence before requiring full recall.

#### Acceptance Criteria

1. WHEN a user enters Learn Mode, THE Learning_Mode SHALL prioritize terms with Mastery_Status "Not Studied" or "Learning"
2. WHEN presenting a term with Consecutive_Correct_Count less than 2, THE Learning_Mode SHALL generate an MCQ
3. WHEN presenting a term with Consecutive_Correct_Count of 2 or 3, THE Learning_Mode SHALL generate a Written_Question
4. WHEN a user answers an MCQ correctly, THE Learning_Mode SHALL increment the term's Consecutive_Correct_Count
5. WHEN a user answers an MCQ incorrectly, THE Learning_Mode SHALL reset the term's Consecutive_Correct_Count to 0
6. WHEN a user answers a Written_Question correctly, THE Learning_Mode SHALL increment the term's Consecutive_Correct_Count
7. WHEN a term reaches Consecutive_Correct_Count of 4, THE Learning_Mode SHALL update its Mastery_Status to "Mastered"
8. WHEN a term is mastered, THE Learning_Mode SHALL schedule it for spaced repetition review based on the configured algorithm
9. THE Learning_Mode SHALL track time spent per question and store it in UserTermProgress
10. WHEN the configured Round_Length is reached, THE Learning_Mode SHALL end the session and display progress summary

### Requirement 3: Test Mode with Configurable Question Distribution

**User Story:** As a student, I want to simulate exam conditions with a configurable mix of question types and receive a grade at the end, so that I can assess my readiness.

#### Acceptance Criteria

1. WHEN a user enters Test Mode, THE Learning_Mode SHALL generate a test with the configured Round_Length number of questions
2. WHEN generating questions, THE Learning_Mode SHALL respect the configured question type distribution (MCQ percentage, Written percentage, True/False percentage)
3. WHEN generating True/False questions, THE Learning_Mode SHALL create statements from term-definition pairs with 50% true and 50% false
4. WHEN a user answers a question, THE Learning_Mode SHALL store the response but not provide immediate feedback
5. WHEN a user completes all questions, THE Learning_Mode SHALL calculate a percentage score based on correct answers
6. WHEN displaying test results, THE Learning_Mode SHALL show the score, time taken, and a breakdown of performance by question type
7. THE Learning_Mode SHALL allow users to review their answers with correct answers highlighted
8. THE Learning_Mode SHALL save the test session to the StudySession table with all responses
9. WHEN Exam_Date is configured, THE Learning_Mode SHALL prioritize terms that have not been reviewed recently
10. THE Learning_Mode SHALL not update Mastery_Status or Consecutive_Correct_Count during test sessions

### Requirement 4: Multiple Choice Only Mode

**User Story:** As a student, I want a rapid-fire multiple choice drill mode, so that I can quickly practice recognition and build familiarity with terms.

#### Acceptance Criteria

1. WHEN a user enters MCQ Only Mode, THE Learning_Mode SHALL generate MCQs for all terms in the Active_Study_Set
2. WHEN generating each MCQ, THE Learning_Mode SHALL include the correct answer and three Distractors selected from other terms
3. WHEN selecting Distractors, THE Learning_Mode SHALL prioritize definitions from the same study set
4. WHEN a user selects an answer, THE Learning_Mode SHALL provide immediate visual feedback (green for correct, red for incorrect)
5. WHEN a user answers incorrectly, THE Learning_Mode SHALL highlight the correct answer
6. WHEN a user answers correctly, THE Learning_Mode SHALL immediately advance to the next question
7. WHEN a user answers incorrectly and "Re-type answers on wrong" is enabled, THE Learning_Mode SHALL require typing the correct answer before advancing
8. THE Learning_Mode SHALL track accuracy percentage and average response time
9. WHEN the session ends, THE Learning_Mode SHALL display statistics including accuracy, speed, and terms needing review
10. THE Learning_Mode SHALL update UserTermProgress with correct/incorrect counts

### Requirement 5: Writing Only Mode with Exact Matching

**User Story:** As a student, I want a strict recall drill that requires exact answers, so that I can practice complete mastery without recognition cues.

#### Acceptance Criteria

1. WHEN a user enters Writing Only Mode, THE Learning_Mode SHALL display only the term with a text input field
2. WHEN a user submits an answer, THE Learning_Mode SHALL compare it to the correct definition using Smart_Grading
3. WHEN Smart_Grading is enabled and Levenshtein_Distance is within the configured threshold, THE Learning_Mode SHALL accept the answer as correct
4. WHEN Smart_Grading is disabled, THE Learning_Mode SHALL require exact string match (case-insensitive, whitespace-trimmed)
5. WHEN an answer is incorrect, THE Learning_Mode SHALL display the correct answer
6. WHEN "Re-type answers on wrong" is enabled and an answer is incorrect, THE Learning_Mode SHALL require the user to type the correct answer before advancing
7. WHEN a user types the correct answer after an error, THE Learning_Mode SHALL mark the term as incorrect for statistics but allow progression
8. THE Learning_Mode SHALL display a running accuracy percentage during the session
9. WHEN the session ends, THE Learning_Mode SHALL display statistics including accuracy, terms mastered, and terms needing review
10. THE Learning_Mode SHALL update UserTermProgress with performance data

### Requirement 6: Match Game with Timed Grid Clearing

**User Story:** As a student, I want to play a timed matching game that pairs terms with definitions, so that I can practice associations in a fun, competitive format.

#### Acceptance Criteria

1. WHEN a user starts Match Game, THE Gamification_Module SHALL display a grid of 12-16 cards (6-8 term-definition pairs) face down
2. WHEN a user clicks a card, THE Gamification_Module SHALL flip it face up and display its content
3. WHEN a user clicks a second card, THE Gamification_Module SHALL flip it face up
4. WHEN two flipped cards form a correct term-definition pair, THE Gamification_Module SHALL lock them in the matched state with visual feedback
5. WHEN two flipped cards do not match, THE Gamification_Module SHALL flip them face down after 1 second
6. THE Gamification_Module SHALL track elapsed time from first card flip to final match
7. WHEN all pairs are matched, THE Gamification_Module SHALL display completion time and offer to restart or return to menu
8. THE Gamification_Module SHALL track the user's best time for each study set
9. WHEN a new best time is achieved, THE Gamification_Module SHALL display a celebration notification
10. THE Gamification_Module SHALL update UserTermProgress to record game completion

### Requirement 7: Blast Game with Falling Definitions

**User Story:** As a student, I want to play a survival typing game where I type definitions before they reach the bottom, so that I can practice recall under time pressure.

#### Acceptance Criteria

1. WHEN a user starts Blast Game, THE Gamification_Module SHALL display a term at the top of the screen
2. WHEN the game starts, THE Gamification_Module SHALL spawn definitions falling from the top at a configured speed
3. WHEN a definition reaches the bottom of the screen, THE Gamification_Module SHALL deduct a life point
4. WHEN a user types a definition that matches a falling definition, THE Gamification_Module SHALL remove that definition and award points
5. WHEN matching typed input to falling definitions, THE Gamification_Module SHALL use Smart_Grading with the configured threshold
6. THE Gamification_Module SHALL increase falling speed every 10 correct answers
7. WHEN the user loses all life points (default 3), THE Gamification_Module SHALL end the game and display final score
8. THE Gamification_Module SHALL track high scores per study set
9. WHEN a new high score is achieved, THE Gamification_Module SHALL display a celebration notification
10. THE Gamification_Module SHALL use Canvas_Rendering or a Physics_Library for smooth animation

### Requirement 8: Blocks Game with Flashcard Gating

**User Story:** As a student, I want to play a block puzzle game where I must answer flashcard questions to place blocks, so that I combine strategic gameplay with learning.

#### Acceptance Criteria

1. WHEN a user starts Blocks Game, THE Gamification_Module SHALL display a Tetris-style game board and a preview of the next block
2. WHEN a block is ready to be placed, THE Gamification_Module SHALL display a Modal_Interceptor with a flashcard question
3. WHEN the flashcard question is an MCQ, THE Gamification_Module SHALL generate it with one correct answer and three Distractors
4. WHEN the flashcard question is a Written_Question, THE Gamification_Module SHALL require typed input with Smart_Grading
5. WHEN a user answers correctly, THE Gamification_Module SHALL allow the block to be placed and award points
6. WHEN a user answers incorrectly, THE Gamification_Module SHALL display the correct answer and allow block placement after a 2-second delay
7. THE Gamification_Module SHALL implement standard block puzzle mechanics (line clearing, gravity, game over on stack overflow)
8. WHEN a line is cleared, THE Gamification_Module SHALL award bonus points
9. THE Gamification_Module SHALL track high scores per study set
10. THE Gamification_Module SHALL update UserTermProgress with question performance data

### Requirement 9: Configuration Engine for Study Settings

**User Story:** As a student, I want to configure study parameters that apply across all modes, so that I can customize my learning experience to match my needs and preferences.

#### Acceptance Criteria

1. THE Configuration_Engine SHALL provide a settings interface accessible from all learning modes
2. THE Configuration_Engine SHALL allow users to set an Exam_Date that influences term prioritization
3. THE Configuration_Engine SHALL allow users to configure Round_Length (number of terms per session) between 5 and 100
4. THE Configuration_Engine SHALL allow users to toggle question types (MCQ, Written, True/False) for modes that support multiple types
5. THE Configuration_Engine SHALL allow users to select Question_Format (Answer with Term or Answer with Definition)
6. THE Configuration_Engine SHALL allow users to enable "Study starred only" filter to limit sessions to starred terms
7. THE Configuration_Engine SHALL allow users to enable "Shuffle terms" to randomize question order
8. THE Configuration_Engine SHALL allow users to configure Smart_Grading threshold (Levenshtein_Distance ≤ 2 for typos)
9. THE Configuration_Engine SHALL allow users to enable "Re-type answers on wrong answers" for reinforcement learning
10. THE Configuration_Engine SHALL persist all settings to browser local storage

### Requirement 10: Advanced Configuration Options

**User Story:** As a student, I want advanced configuration options including grading overrides and progress management, so that I have full control over my learning data.

#### Acceptance Criteria

1. THE Configuration_Engine SHALL provide an "Override grading" button during answer review that allows manual correction
2. WHEN a user clicks "Override grading", THE Configuration_Engine SHALL toggle the answer's correctness and update statistics
3. THE Configuration_Engine SHALL provide a "Reset progress" option that clears all UserTermProgress data
4. WHEN a user selects "Reset progress", THE Configuration_Engine SHALL display a confirmation dialog
5. WHEN reset is confirmed, THE Configuration_Engine SHALL delete all UserTermProgress records and reset Mastery_Status to "Not Studied"
6. THE Configuration_Engine SHALL provide a "Save options" button that exports all settings as a JSON file
7. THE Configuration_Engine SHALL provide an "Import options" button that loads settings from a JSON file
8. WHEN importing settings, THE Configuration_Engine SHALL validate the JSON structure and display errors for invalid files
9. THE Configuration_Engine SHALL provide a "Reset to defaults" option that restores factory settings
10. THE Configuration_Engine SHALL persist configuration changes immediately without requiring explicit save actions

### Requirement 11: Analytics Dashboard with Mastery Visualization

**User Story:** As a student, I want to see my progress visualized by mastery level, so that I can understand which terms need more practice.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display three Mastery_Buckets: "Not Studied" (grey), "Learning" (yellow), and "Mastered" (green)
2. THE Analytics_Dashboard SHALL count terms in each bucket based on Mastery_Status in UserTermProgress
3. THE Analytics_Dashboard SHALL display a Progress_Bar showing the proportion of terms in each mastery bucket
4. THE Analytics_Dashboard SHALL display the total number of terms in the Active_Study_Set
5. THE Analytics_Dashboard SHALL display the percentage of terms mastered
6. THE Analytics_Dashboard SHALL update in real-time as the user completes study sessions
7. THE Analytics_Dashboard SHALL allow users to click on a mastery bucket to filter and view terms in that category
8. WHEN viewing a mastery bucket, THE Analytics_Dashboard SHALL display term names and their Consecutive_Correct_Count
9. THE Analytics_Dashboard SHALL display the date each term was last reviewed
10. THE Analytics_Dashboard SHALL persist mastery data in the UserTermProgress table

### Requirement 12: Term-Level Tracking with Star Functionality

**User Story:** As a student, I want to track individual term performance and star important terms, so that I can prioritize difficult or high-value content.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a list of all terms in the Active_Study_Set with their current Mastery_Status
2. THE Analytics_Dashboard SHALL display each term's Consecutive_Correct_Count
3. THE Analytics_Dashboard SHALL display each term's total correct and incorrect answer counts
4. THE Analytics_Dashboard SHALL provide a star icon next to each term that can be toggled on/off
5. WHEN a user clicks a star icon, THE Analytics_Dashboard SHALL toggle the term's starred status
6. THE Analytics_Dashboard SHALL persist starred status in the UserTermProgress table
7. WHEN "Study starred only" is enabled in settings, THE Learning_Mode SHALL filter the Active_Study_Set to only starred terms
8. THE Analytics_Dashboard SHALL display the total number of starred terms
9. THE Analytics_Dashboard SHALL allow sorting terms by Mastery_Status, Consecutive_Correct_Count, or last review date
10. THE Analytics_Dashboard SHALL allow filtering terms by Mastery_Status

### Requirement 13: StudySession Table for Session History

**User Story:** As a student, I want my study sessions recorded with metadata and results, so that I can review my learning history and identify patterns.

#### Acceptance Criteria

1. THE Application SHALL create a StudySession record when a user starts a study session
2. THE StudySession record SHALL store session start time, end time, and duration
3. THE StudySession record SHALL store the learning mode used (Enhanced Flashcard, Learn, Test, MCQ Only, Writing Only)
4. THE StudySession record SHALL store the Round_Length and actual number of terms reviewed
5. THE StudySession record SHALL store aggregate statistics (total correct, total incorrect, accuracy percentage)
6. THE StudySession record SHALL store the configuration settings active during the session
7. THE StudySession record SHALL store a reference to the Active_Study_Set
8. WHEN a session ends, THE Application SHALL save the StudySession record to browser local storage or IndexedDB
9. THE Analytics_Dashboard SHALL display a history of recent study sessions with key metrics
10. THE Analytics_Dashboard SHALL allow users to view detailed results for any past session

### Requirement 14: UserTermProgress Table for Mastery Tracking

**User Story:** As a student, I want detailed progress tracking for each term, so that the system can adapt to my individual learning needs.

#### Acceptance Criteria

1. THE Application SHALL create a UserTermProgress record for each term when first studied
2. THE UserTermProgress record SHALL store the term's current Mastery_Status (Not Studied, Learning, Mastered)
3. THE UserTermProgress record SHALL store the Consecutive_Correct_Count
4. THE UserTermProgress record SHALL store total correct answer count and total incorrect answer count
5. THE UserTermProgress record SHALL store the date and time of last review
6. THE UserTermProgress record SHALL store the starred status (boolean)
7. THE UserTermProgress record SHALL store cumulative time spent studying the term
8. WHEN a user answers a question, THE Application SHALL update the corresponding UserTermProgress record
9. WHEN Consecutive_Correct_Count reaches 4, THE Application SHALL update Mastery_Status to "Mastered"
10. THE Application SHALL persist UserTermProgress records to browser local storage or IndexedDB

### Requirement 15: State Management for Active Study Set

**User Story:** As a student, I want the application to remember my current study set and position, so that I can resume where I left off.

#### Acceptance Criteria

1. THE Application SHALL maintain an Active_Study_Set reference in application state
2. THE Application SHALL persist the Active_Study_Set identifier to browser local storage
3. WHEN a user selects a study set, THE Application SHALL load it as the Active_Study_Set
4. WHEN a user starts a learning mode, THE Application SHALL use the Active_Study_Set as the source of terms
5. THE Application SHALL maintain a Current_Question_Index during study sessions
6. WHEN a user exits a session before completion, THE Application SHALL save the Current_Question_Index
7. WHEN a user resumes a session, THE Application SHALL restore the Current_Question_Index
8. THE Application SHALL clear the Current_Question_Index when a session completes
9. THE Application SHALL display the Active_Study_Set name in the application header
10. THE Application SHALL allow users to change the Active_Study_Set from a dropdown menu

### Requirement 16: State Management for User Settings

**User Story:** As a student, I want my preferences saved automatically, so that I don't need to reconfigure settings each time I study.

#### Acceptance Criteria

1. THE Application SHALL maintain a User_Settings object in application state
2. THE User_Settings object SHALL include all Configuration_Engine parameters
3. WHEN a user changes a setting, THE Application SHALL update the User_Settings object immediately
4. WHEN User_Settings changes, THE Application SHALL persist it to browser local storage
5. WHEN the application loads, THE Application SHALL restore User_Settings from browser local storage
6. WHEN no saved settings exist, THE Application SHALL initialize User_Settings with default values
7. THE Application SHALL validate User_Settings on load and reset invalid values to defaults
8. THE Application SHALL provide a settings panel accessible from all screens
9. THE Application SHALL apply User_Settings to all learning modes and games
10. THE Application SHALL export User_Settings as part of the data export function

### Requirement 17: Smart Grading Utility with Levenshtein Distance

**User Story:** As a student, I want my typed answers evaluated with tolerance for minor typos, so that I'm not penalized for small spelling mistakes.

#### Acceptance Criteria

1. THE Smart_Grading utility SHALL calculate Levenshtein_Distance between user input and correct answer
2. WHEN calculating distance, THE Smart_Grading utility SHALL normalize both strings to lowercase
3. WHEN calculating distance, THE Smart_Grading utility SHALL trim leading and trailing whitespace
4. WHEN Levenshtein_Distance is 0, THE Smart_Grading utility SHALL return 100% similarity
5. WHEN Levenshtein_Distance is ≤ the configured threshold (default 2), THE Smart_Grading utility SHALL accept the answer as correct
6. WHEN Levenshtein_Distance exceeds the threshold, THE Smart_Grading utility SHALL reject the answer as incorrect
7. THE Smart_Grading utility SHALL calculate similarity percentage as: 100 × (1 - distance / max_length)
8. THE Smart_Grading utility SHALL return both a boolean (correct/incorrect) and a similarity percentage
9. THE Smart_Grading utility SHALL handle empty strings by returning 0% similarity
10. THE Smart_Grading utility SHALL be used by Writing Only Mode, Learn Mode written questions, and Blast Game

### Requirement 18: Canvas-Based Rendering for Blast Game

**User Story:** As a developer, I want smooth animation for the Blast Game, so that falling definitions move fluidly and the game feels responsive.

#### Acceptance Criteria

1. THE Blast Game SHALL use HTML5 Canvas API for rendering game elements
2. THE Blast Game SHALL render at a minimum of 30 frames per second
3. WHEN a definition spawns, THE Blast Game SHALL create a game object with position, velocity, and text properties
4. WHEN updating game state, THE Blast Game SHALL apply velocity to position each frame
5. WHEN a definition is matched, THE Blast Game SHALL remove it from the render loop
6. THE Blast Game SHALL render the current term at the top of the canvas
7. THE Blast Game SHALL render the user's typed input below the term
8. THE Blast Game SHALL render life points as icons in the corner
9. THE Blast Game SHALL render the current score
10. THE Blast Game SHALL clear and redraw the canvas each frame

### Requirement 19: Block Puzzle Logic with Modal Interceptor

**User Story:** As a developer, I want the Blocks Game to pause for flashcard questions, so that learning is integrated into gameplay without disrupting the puzzle mechanics.

#### Acceptance Criteria

1. THE Blocks Game SHALL implement a game loop that pauses when a Modal_Interceptor is active
2. WHEN a new block is ready to spawn, THE Blocks Game SHALL pause the game loop and display the Modal_Interceptor
3. THE Modal_Interceptor SHALL display a flashcard question (MCQ or Written_Question based on configuration)
4. WHEN a user answers the question, THE Modal_Interceptor SHALL close and resume the game loop
5. WHEN a user answers correctly, THE Blocks Game SHALL allow immediate block placement
6. WHEN a user answers incorrectly, THE Blocks Game SHALL enforce a 2-second delay before allowing block placement
7. THE Blocks Game SHALL implement standard block rotation (arrow keys or WASD)
8. THE Blocks Game SHALL implement standard block movement (left/right arrow keys)
9. THE Blocks Game SHALL implement hard drop (down arrow or space bar)
10. THE Blocks Game SHALL detect completed lines and clear them with animation

### Requirement 20: Data Export and Import for Backup

**User Story:** As a student, I want to export and import my learning data, so that I can back up my progress and transfer it between devices.

#### Acceptance Criteria

1. THE Application SHALL provide an "Export Data" button in settings
2. WHEN a user clicks "Export Data", THE Application SHALL generate a JSON file containing all UserTermProgress records
3. THE exported JSON SHALL include all StudySession records
4. THE exported JSON SHALL include User_Settings
5. THE exported JSON SHALL include study set definitions and term content
6. THE Application SHALL trigger a file download with filename format "learning-data-YYYY-MM-DD.json"
7. THE Application SHALL provide an "Import Data" button in settings
8. WHEN a user selects a JSON file for import, THE Application SHALL validate the file structure
9. WHEN import validation succeeds, THE Application SHALL merge imported data with existing data
10. WHEN import validation fails, THE Application SHALL display an error message with details
