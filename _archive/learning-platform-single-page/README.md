# Learning Platform - Single Page Archive

This folder contains the original single-page learning platform implementation.

**Date Archived:** August 3, 2026  
**Reason:** Refactoring to multi-route structure for better scalability and professional UX

## Original Structure

- **app/learning-platform/page.tsx** - Single page route
- **components/learning-platform/StandaloneLearningPlatform.tsx** - Main component with all screens in state

## What Changed

The learning platform was refactored from a single-page app with state-based navigation to a proper multi-route Next.js app with separate pages for:
- Dashboard/Overview
- Subjects/Folders
- Study Sets (with modes)
- Calendar
- Lessons
- Profile

This provides:
- Better URL structure
- Browser history support
- Shareable links
- Better code organization
- Industry-standard architecture (like Quizlet, Anki)

## How to Reference

All the original functionality is preserved. Refer to this archive when:
- Understanding the original logic
- Migrating features
- Comparing implementations
