# UI & Styling Guide - Complete Copy & Paste Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure](#file-structure)
4. [Core Components](#core-components)
5. [Styling System](#styling-system)
6. [Color Scheme](#color-scheme)
7. [Typography](#typography)
8. [Layout Patterns](#layout-patterns)
9. [Component Library](#component-library)
10. [Internationalization](#internationalization)
11. [Copy & Paste Instructions](#copy--paste-instructions)

---

## 🎯 Project Overview

This is a modern, responsive web application built with Next.js that features:
- **Multi-mode viewing**: Document, Interactive, and Simple modes
- **Interactive content cards**: With flip animations and keyboard controls
- **Hierarchical navigation**: Sections and sub-sections with scroll spy
- **Internationalization**: English/Dutch language support
- **Dark/Light themes**: With smooth transitions
- **Bookmark system**: For tracking important content
- **Math rendering**: KaTeX for mathematical expressions
- **Export functionality**: Multiple format support

---

## 🛠 Technology Stack

### Frontend Framework
```tsx
// Next.js 14+ with App Router
import { useState, useEffect, useMemo } from 'react';
```

### Styling
```tsx
// Tailwind CSS with custom design system
import { cn } from '@/lib/utils';
```

### Icons
```tsx
// Lucide React Icons
import { ChevronLeft, Globe, Sun, Moon } from 'lucide-react';
```

### Markdown & Math
```tsx
// React Markdown with KaTeX support
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
```

### Internationalization
```tsx
// Custom CSV-based i18n system
import { useTranslation } from '@/lib/i18n';
```

---

## 📁 File Structure

```
project-root/
├── app/
│   ├── [page]/
│   │   └── page.tsx              # Main page component
│   ├── layout.tsx                  # Root layout with providers
│   └── globals.css                  # Global styles and CSS variables
├── components/
│   ├── header.tsx                 # Main header with navigation
│   ├── LanguageSwitcher.tsx         # Language selector dropdown
│   ├── ThemeToggle.tsx              # Dark/light mode toggle
│   ├── ModeSwitcher.tsx            # View mode switcher
│   ├── MarkdownRenderer.tsx          # Markdown + KaTeX renderer
│   ├── ParagraphSection.tsx           # Paragraph-based content
│   ├── InteractiveMode.tsx               # Interactive card mode
│   ├── SimpleMode.tsx               # Simple text view
│   ├── BookmarksSidebar.tsx           # Bookmark management
│   ├── LoadingSpinner.tsx            # Loading states
│   └── DynamicIcon.tsx              # Icon rendering component
├── lib/
│   ├── i18n.ts                     # Internationalization system
│   └── utils.ts                     # Utility functions
├── locales/
│   ├── en.csv                       # English translations
│   └── nl.csv                       # Dutch translations
├── content/
│   ├── document.json                    # Sample document content
│   └── math-paragraphs.json         # Math study content
└── styles/
    └── components.json                # Component styling config
```

---

## 🧩 Core Components

### Header Component
```tsx
// Complete header with navigation and controls
<Header 
  siteMetadata={siteMetadata}
  sections={sections}
  buttons={buttons}
  showExportButtons={false}
  showLanguageSwitcher={true}
/>

// Props interface
interface HeaderProps {
  siteMetadata: {
    title: string;
    description: string;
  };
  sections?: any[];
  buttons?: ButtonConfig[];
  showExportButtons?: boolean;
  showAnkiExport?: boolean;
  showCardsExport?: boolean;
  showTranscriptExport?: boolean;
  showCopyTranscript?: boolean;
  showLanguageSwitcher?: boolean;
}
```

### Language Switcher
```tsx
// Dropdown language selector with flags
<LanguageSwitcher />

// Usage
const { t, currentLanguage, changeLanguage } = useTranslation();
```

### Theme Toggle
```tsx
// Dark/light mode switcher
<ThemeToggle />

// Uses next-themes for state management
const { theme, setTheme } = useTheme();
```

### Mode Switcher
```tsx
// View mode selector (Document/Interactive/Simple)
<ModeSwitcher 
  currentMode={viewMode}
  onModeChange={setViewMode}
/>
```

---

## 🎨 Styling System

### CSS Variables (globals.css)
```css
:root {
  /* Light mode colors */
  --background: 222.2 84% 95.1%;
  --foreground: 222.2 84% 4.9%;
  --card: 222.2 84% 95.1%;
  --border: 214.3 31.8% 91.4%;
  --muted: 210 40% 98%;
  --accent: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  
  /* Typography */
  --font-inter: 'Inter', sans-serif;
  --font-cormorant: 'Cormorant Garamond', serif;
}

.dark {
  /* Dark mode colors */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --border: 217.2 32.6% 17.5%;
  --muted: 215 27.9% 16.9%;
  --accent: 210 40% 98%;
  --primary: 210 40% 98%;
}
```

### Tailwind Configuration
```js
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        accent: 'hsl(var(--accent))',
        primary: 'hsl(var(--primary))',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-cormorant)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

---

## 🎨 Color Scheme

### Primary Colors
```css
/* Light Mode */
--background: 222.2 84% 95.1%;    /* Very light blue */
--foreground: 222.2 84% 4.9%;     /* Dark blue-gray */
--card: 222.2 84% 95.1%;         /* Same as background */
--border: 214.3 31.8% 91.4%;      /* Light gray border */
--muted: 210 40% 98%;             /* Muted gray */
--accent: 222.2 47.4% 11.2%;     /* Blue accent */
--primary: 222.2 47.4% 11.2%;     /* Primary blue */

/* Dark Mode */
--background: 222.2 84% 4.9%;      /* Dark blue-gray */
--foreground: 210 40% 98%;           /* Light gray text */
--card: 222.2 84% 4.9%;           /* Dark card background */
--border: 217.2 32.6% 17.5%;      /* Dark border */
--muted: 215 27.9% 16.9%;          /* Dark muted */
--accent: 210 40% 98%;             /* Light accent */
--primary: 210 40% 98%;             /* Light primary */
```

### Color Usage Patterns
```tsx
// Background colors
className="bg-background"      // Main background
className="bg-card"            // Card backgrounds
className="bg-secondary"        // Secondary backgrounds
className="bg-muted"           // Muted backgrounds

// Text colors
className="text-foreground"      // Main text
className="text-muted-foreground" // Muted text
className="text-primary"         // Primary text

// Border colors
className="border-border"        // Standard borders
className="border-border/50"      // Faded borders
```

---

## ✏️ Typography

### Font System
```css
/* Font variables */
--font-inter: 'Inter', sans-serif;     /* UI and controls */
--font-cormorant: 'Cormorant Garamond', serif; /* Headings and content */
```

### Typography Classes
```tsx
// Headings
className="font-serif text-foreground font-normal"
className="text-2xl font-serif text-foreground font-normal mb-4 mt-6"

// Body text
className="font-sans text-foreground leading-relaxed"
className="text-sm text-muted-foreground"

// Code
className="font-mono text-sm bg-muted px-1 py-0.5 rounded"
```

---

## 📐 Layout Patterns

### Responsive Grid System
```tsx
// Main layout container
<div className="xl:flex xl:gap-8 mt-8">
  {/* Sidebar */}
  <aside className="xl:w-[280px] hidden xl:block">
    {/* Content */}
  </aside>
  
  {/* Main content */}
  <div className="flex-1 px-5 py-10">
    {/* Content */}
  </div>
</div>

// Content width constraints
<div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
  {/* Constrained content */}
</div>

// Header layout
<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
  <div className="flex-1">
    {/* Main header content */}
  </div>
  <div className="flex items-center gap-3 lg:gap-4">
    {/* Controls */}
  </div>
</div>
```

### Flex Patterns
```tsx
// Horizontal alignment
<div className="flex items-center gap-3">
  {/* Aligned horizontally */}
</div>

// Vertical alignment
<div className="flex flex-col gap-4">
  {/* Stacked vertically */}
</div>

// Justified layout
<div className="flex justify-between items-center">
  {/* Space between */}
</div>
```

---

## 🧩 Component Library

### Button Variants
```tsx
// Primary button
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
  Primary Button
</button>

// Secondary button
<button className="border border-border bg-background hover:bg-secondary transition-colors px-3 py-2 rounded-md">
  Secondary Button
</button>

// Icon button
<button className="p-2 text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md">
  <Icon className="w-4 h-4" />
</button>
```

### Card Components
```tsx
// Standard card
<div className="bg-card border border-border rounded-lg p-6 shadow-sm">
  {/* Card content */}
</div>

// Interactive card
<div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  {/* Interactive content */}
</div>
```

### Input Components
```tsx
// Text input
<input className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />

// Dropdown
<div className="relative">
  <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition-colors">
    {/* Button content */}
  </button>
  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg">
    {/* Dropdown content */}
  </div>
</div>
```

---

## 🌍 Internationalization

### Translation System Setup
```tsx
// Translation hook
import { useTranslation } from '@/lib/i18n';

const { t, currentLanguage, changeLanguage } = useTranslation();

// Usage
<h1>{t('welcome_message')}</h1>
<button onClick={() => changeLanguage('nl')}>Switch to Dutch</button>
```

### CSV Translation Files
```csv
// locales/en.csv
id,text
welcome_message,Welcome to our application
sections,Sections
bookmarks,Bookmarks
interactive_mode,Interactive Mode
simple_mode,Simple Mode
language,Language
english,English
dutch,Dutch

// locales/nl.csv  
id,text
welcome_message,Welkom bij onze applicatie
sections,Secties
bookmarks,Bladwijzers
interactive_mode,Interactieve Modus
simple_mode,Eenvoudige Modus
language,Taal
english,Engels
dutch,Nederlands
```

### Language Switcher Implementation
```tsx
export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        <Globe className="w-4 h-4" />
        <span>{currentLang?.name}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full bg-card border border-border rounded-md shadow-lg">
          {languages.map(lang => (
            <button onClick={() => changeLanguage(lang.code)}>
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📚 Content Structure

### JSON Content Format
```json
{
  "siteMetadata": {
    "title": "Document Title",
    "description": "Comprehensive content material"
  },
  "showTimestamps": false,
  "showExportButtons": false,
  "defaultViewMode": "document",
  "buttons": [
    {
      "url": "https://example.com",
      "text": "Watch on YouTube",
      "icon": "youtube",
      "iconType": "name",
      "variant": "primary",
      "enabled": true
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "paragraphs": [
        {
          "id": "para-1-1",
          "title": "Paragraph Title",
          "content": "Content with **markdown** and $math$ expressions",
          "questions": [
            {
              "id": "q1-1-1",
              "number": "1.1",
              "question": "Question text",
              "answer": "Answer with $x^2$ math",
              "type": "inline",
              "difficulty": "easy"
            }
          ]
        }
      ]
    }
  ]
}
```

### Math Rendering
```tsx
// Markdown with KaTeX
<MarkdownRenderer className="prose prose-sm max-w-none">
  Content with $inline math$ and $$display math$$
</MarkdownRenderer>

// Math configuration
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {content}
</ReactMarkdown>
```

---

## 🎯 Copy & Paste Instructions

### Step 1: Project Setup

#### 1.1 Initialize New Project
```bash
# Create new Next.js project
npx create-next-app@latest your-app --typescript --tailwind --eslint

# Navigate to project
cd your-app

# Install dependencies
npm install lucide-react next-themes react-markdown remark-gfm remark-math rehype-katex
```

#### 1.2 Configure Tailwind
```js
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        accent: 'hsl(var(--accent))',
        primary: 'hsl(var(--primary))',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-cormorant)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

#### 1.3 Global Styles
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'katex/dist/katex.min.css';

:root {
  --background: 222.2 84% 95.1%;
  --foreground: 222.2 84% 4.9%;
  --card: 222.2 84% 95.1%;
  --border: 214.3 31.8% 91.4%;
  --muted: 210 40% 98%;
  --accent: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  --font-inter: 'Inter', sans-serif;
  --font-cormorant: 'Cormorant Garamond', serif;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --border: 217.2 32.6% 17.5%;
  --muted: 215 27.9% 16.9%;
  --accent: 210 40% 98%;
  --primary: 210 40% 98%;
}

/* KaTeX styling */
.katex {
  font-size: 1em;
}

.katex-display {
  margin: 1em 0;
}

.katex-inline {
  display: inline;
}

.katex .base {
  display: inline-block;
}

.dark .katex {
  color: #F9FAFB;
}

.dark .katex .mord {
  color: #F9FAFB;
}
```

### Step 2: Core Files

#### 2.1 Layout File
```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Content Platform",
  description: "Interactive content with multiple viewing modes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 2.2 Utility Functions
```tsx
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 2.3 Internationalization Setup
```tsx
// lib/i18n.ts
export type Language = 'en' | 'nl';

export interface Translation {
  [key: string]: string;
}

class I18n {
  private translations: Record<Language, Translation> = {} as Record<Language, Translation>;
  private currentLanguage: Language = 'en';

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations(): Promise<void> {
    // Load English translations
    const enResponse = await fetch('/locales/en.csv');
    const enText = await enResponse.text();
    this.translations.en = this.parseCSV(enText);

    // Load Dutch translations
    const nlResponse = await fetch('/locales/nl.csv');
    const nlText = await nlResponse.text();
    this.translations.nl = this.parseCSV(nlText);
  }

  private parseCSV(csvText: string): Translation {
    const lines = csvText.split('\n');
    const translations: Translation = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, ...textParts] = line.split(',');
        const text = textParts.join(',').replace(/"/g, '').trim();
        if (id && text) {
          translations[id.trim()] = text;
        }
      }
    }
    
    return translations;
  }

  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
  }

  public t(id: string, fallback?: string): string {
    const translation = this.translations[this.currentLanguage]?.[id];
    return translation || fallback || id;
  }
}

// Hook for React components
export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage());

  const changeLanguage = (language: Language) => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
  };

  const t = (id: string, fallback?: string) => {
    return i18n.t(id, fallback);
  };

  return { t, currentLanguage, changeLanguage };
}

export const i18n = new I18n();
```

### Step 3: Component Implementation

#### 3.1 Header Component
```tsx
// components/Header.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  siteMetadata: {
    title: string;
    description: string;
  };
  showLanguageSwitcher?: boolean;
}

export function Header({ siteMetadata, showLanguageSwitcher = false }: HeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md hover:bg-secondary/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-[40px] md:text-[48px] font-serif text-foreground leading-tight font-medium">
                {siteMetadata.title}
              </h1>
              <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
                {siteMetadata.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          {showLanguageSwitcher && <LanguageSwitcher />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

#### 3.2 Theme Toggle
```tsx
// components/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-7 h-7" />;
  }

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-md bg-secondary/80">
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className={`p-1.5 rounded transition-colors ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {theme === "light" ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
```

#### 3.3 Language Switcher
```tsx
// components/LanguageSwitcher.tsx
"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { useTranslation, Language } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: t('english'), flag: '🇬🇧' },
    { code: 'nl', name: t('dutch'), flag: '🇳🇱' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.flag} {currentLang?.name}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-20 min-w-[140px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  changeLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left ${
                  currentLanguage === language.code ? 'bg-secondary text-foreground' : 'text-foreground'
                }`}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

#### 3.4 Markdown Renderer
```tsx
// components/MarkdownRenderer.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
        [remarkMath, { singleDollarTextMath: true }],
      ]}
      rehypePlugins={[rehypeKatex]}
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-serif prose-headings:text-foreground prose-headings:font-normal",
        "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6",
        "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5",
        "prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4",
        "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground prose-em:italic",
        "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto",
        "prose-blockquote:border-l-border prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
        "prose-ul:text-foreground prose-ul:space-y-2",
        "prose-ol:text-foreground prose-ol:space-y-2",
        "prose-li:text-foreground",
        "prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:no-underline",
        "prose-table:border-border prose-th:border-border prose-td:border-border",
        "prose-th:text-foreground prose-td:text-foreground",
        "prose-img:border-border prose-img:rounded-lg prose-img:shadow-sm",
        "prose-hr:border-border",
        "dark:prose-invert",
        className
      )}
    >
      {children}
    </ReactMarkdown>
  );
}
```

### Step 4: Main Page Implementation

#### 4.1 Page Component Structure
```tsx
// app/[page]/page.tsx
"use client";

import { Header } from "@/components/header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useTranslation } from "@/lib/i18n";

export default function Page({ params }: { params: { page: string } }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load content
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/content/${params.page}.json`);
        const content = await response.json();
        setData(content);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [params.page]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">{t('content_not_found')}</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="w-full p-5 py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <Header 
                siteMetadata={data.siteMetadata}
                showLanguageSwitcher={true}
              />
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Additional controls */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-screen bg-background">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {data.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-12">
              <h2 className="text-2xl font-serif text-foreground font-normal mb-6 mt-8">
                {section.title}
              </h2>
              
              {section.paragraphs?.map((paragraph) => (
                <div key={paragraph.id} id={paragraph.id} className="mb-8">
                  <h3 className="text-xl font-serif text-foreground font-normal mb-4 mt-6">
                    {paragraph.title}
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer>
                      {paragraph.content}
                    </MarkdownRenderer>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
```

### Step 5: Content Files

#### 5.1 Sample Content Structure
```json
// content/document.json
{
  "siteMetadata": {
    "title": "Mathematics Guide",
    "description": "Comprehensive mathematics material with interactive features"
  },
  "showTimestamps": false,
  "showExportButtons": false,
  "defaultViewMode": "document",
  "buttons": [
    {
      "url": "https://youtube.com/watch?v=example",
      "text": "Watch on YouTube",
      "icon": "youtube",
      "iconType": "name",
      "variant": "primary",
      "enabled": true
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "title": "Introduction to Algebra",
      "paragraphs": [
        {
          "id": "para-1-1",
          "title": "Basic Concepts",
          "content": "Algebra is the foundation of higher mathematics. It deals with **variables** and **expressions**. For example, the expression $3x + 5$ represents three times an unknown quantity plus five.",
          "questions": [
            {
              "id": "q1-1-1",
              "number": "1.1",
              "question": "What is a variable in algebra?",
              "answer": "A **variable** is a symbol (usually a letter) that represents an unknown or changing quantity. For example, in $y = 2x + 3$, both $y$ and $x$ are variables.",
              "type": "inline",
              "difficulty": "easy"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 5.2 Translation Files
```csv
// locales/en.csv
id,text
app_title,Content Platform
welcome,Welcome
sections,Sections
bookmarks,Bookmarks
interactive_mode,Interactive Mode
simple_mode,Simple Mode
document_mode,Document Mode
language,Language
english,English
dutch,Dutch
content_not_found,Content not found
loading,Loading...

// locales/nl.csv
id,text
app_title,Inhoud Platform
welcome,Welkom
sections,Secties
bookmarks,Bladwijzers
interactive_mode,Interactieve Modus
simple_mode,Eenvoudige Modus
document_mode,Document Modus
language,Taal
english,Engels
dutch,Nederlands
content_not_found,Inhoud niet gevonden
loading,Laden...
```

---

## 🚀 Deployment Instructions

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
vercel --prod
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Content Platform
```

---

## 🎨 Customization Guide

### Adding New Colors
```css
:root {
  --custom-color: 210 40% 50%;
  --custom-light: 210 40% 90%;
  --custom-dark: 210 40% 10%;
}

/* Usage */
.className="bg-custom-color"
.className="text-custom-light"
.className="border-custom-dark"
```

### Custom Typography
```css
:root {
  --font-custom: 'Your Custom Font', sans-serif;
}

/* Usage */
className="font-custom"
```

### Component Variations
```tsx
// Custom button variant
<button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
  Custom Button
</button>
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small screens */
md: 768px   /* Medium screens */  
lg: 1024px  /* Large screens */
xl: 1280px  /* Extra large screens */
```

### Mobile-First Patterns
```tsx
// Mobile first, then enhance for larger screens
<div className="block sm:hidden">
  {/* Mobile only */}
</div>
<div className="hidden sm:block lg:hidden">
  {/* Tablet only */}
</div>
<div className="hidden lg:block">
  {/* Desktop only */}
</div>
```

---

## 🔧 Development Tips

### Performance Optimization
```tsx
// Use React.memo for expensive components
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* heavy rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return data.reduce(/* complex calculation */);
}, [data]);

// Lazy load components
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

### Accessibility
```tsx
// Semantic HTML
<header>
  <nav>
  <main>
    <section>
      <article>
        <aside>
          <footer>

// ARIA labels
<button aria-label="Toggle dark mode" title="Switch to dark mode">
  <button aria-expanded={isOpen} aria-haspopup="menu">

// Keyboard navigation
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 🎯 Complete Copy Package

### All Files to Copy
```
your-project/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── [page]/
│       └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── ThemeToggle.tsx
│   ├── LanguageSwitcher.tsx
│   └── MarkdownRenderer.tsx
├── lib/
│   ├── utils.ts
│   └── i18n.ts
├── locales/
│   ├── en.csv
│   └── nl.csv
├── content/
│   └── your-content.json
├── tailwind.config.js
├── package.json
└── README.md
```

### Quick Start Commands
```bash
# 1. Copy all files from above structure
# 2. Run npm install
npm install lucide-react next-themes react-markdown remark-gfm remark-math rehype-katex clsx tailwind-merge

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

---

## 📚 Additional Resources

### Useful Libraries
- **Lucide React**: Modern icon library
- **Next Themes**: Theme management
- **React Markdown**: Markdown rendering
- **KaTeX**: Mathematical notation
- **Tailwind CSS**: Utility-first CSS

### Design Inspiration
- **shadcn/ui**: Component design patterns
- **Tailwind UI**: Pre-built components
- **Headless UI**: Unstyled components

### Performance Tools
- **React DevTools**: Component debugging
- **Lighthouse**: Performance auditing
- **Bundle Analyzer**: Package size optimization

---

*This guide provides everything needed to recreate a modern web application UI and styling system. Copy the relevant sections and adapt them to your specific needs!*
