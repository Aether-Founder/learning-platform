'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { ChevronRight, ChevronDown, BookOpen, Video, FileText, Code, CheckCircle, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const supabase = browserClient as any;

type LessonBlock = {
  id: string;
  type: 'text' | 'questions' | 'code' | 'video' | 'image';
  content?: string;
  title?: string;
  intro?: string;
  questions?: Array<{
    id: string;
    number: string;
    text: string;
  }>;
  code?: string;
  language?: string;
  url?: string;
};

type LessonSection = {
  id: string;
  title: string;
  blocks: LessonBlock[];
  answers?: Array<{
    questionId: string;
    answer: string;
  }>;
};

type Lesson = {
  siteMetadata: {
    title: string;
    description: string;
  };
  contentFormat: string;
  defaultViewMode: string;
  availableModes: string[];
  sections: LessonSection[];
};

export default function LessenPage() {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAnswers, setShowAnswers] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'study' | 'advanced'>('simple');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      // Load lesson JSON files from content directory
      const lessonFiles = [
        'wiskunde-vergelijkingen-ongelijkheden.json',
        'biologie-hoofdstuk-4-5.json',
        'geschiedenis-h4.json',
        'natuurkunde-elektriciteit.json',
        'scheikunde.json',
      ];

      const loadedLessons: Lesson[] = [];
      
      for (const file of lessonFiles) {
        try {
          const response = await fetch(`/content/${file}`);
          if (response.ok) {
            const lesson = await response.json();
            loadedLessons.push(lesson);
          }
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
        }
      }

      setLessons(loadedLessons);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getBlockIcon = (type: LessonBlock['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'questions':
        return <CheckCircle className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderBlock = (block: LessonBlock, sectionAnswers?: any[]) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {block.content || ''}
            </ReactMarkdown>
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-4">
            {block.title && <h3 className="font-semibold">{block.title}</h3>}
            {block.intro && <p className="text-sm text-muted-foreground">{block.intro}</p>}
            <div className="space-y-3">
              {block.questions?.map((question) => {
                const answer = sectionAnswers?.find(a => a.questionId === question.id);
                return (
                  <div key={question.id} className="border-l-2 border-border pl-4">
                    <p className="font-medium text-sm">{question.number}. {question.text}</p>
                    {showAnswers && answer && (
                      <div className="mt-2 p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground mb-1">Antwoord:</p>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {answer.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="relative">
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{block.code}</code>
            </pre>
            {block.language && (
              <span className="absolute top-2 right-2 text-xs text-muted-foreground">
                {block.language}
              </span>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Video player</p>
          </div>
        );

      case 'image':
        return (
          <div className="bg-secondary rounded-lg p-8 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Afbeelding</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('lessons_eyebrow')}
          title={t('lessons_title')}
          description={t('lessons_description')}
        />
        <div className="mt-10 text-center text-sm text-muted-foreground">Laden...</div>
      </AppShell>
    );
  }

  if (selectedLesson) {
    return (
      <AppShell>
        <div className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <button
              onClick={() => setSelectedLesson(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Terug naar lessen
            </button>
            <h1 className="font-display text-2xl font-semibold">{selectedLesson.siteMetadata.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedLesson.siteMetadata.description}</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Weergave:</span>
            {selectedLesson.availableModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {mode === 'simple' ? 'Eenvoudig' : mode === 'study' ? 'Studeren' : 'Gevorderd'}
              </button>
            ))}
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`ml-auto px-3 py-1.5 text-sm rounded-md transition-colors ${
                showAnswers
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {showAnswers ? 'Antwoorden verbergen' : 'Antwoorden tonen'}
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {selectedLesson.sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <h2 className="font-semibold">{section.title}</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {section.blocks.length} {section.blocks.length === 1 ? 'blok' : 'blokken'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      {section.blocks.map((block) => (
                        <div key={block.id} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getBlockIcon(block.type)}
                            <span className="capitalize">{block.type}</span>
                          </div>
                          {renderBlock(block, section.answers)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('lessons_eyebrow')}
        title={t('lessons_title')}
        description={t('lessons_description')}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{t('lessons_empty')}</p>
            <p className="text-sm text-muted-foreground">{t('lessons_empty_desc')}</p>
          </div>
        ) : (
          lessons.map((lesson, index) => (
            <div
              key={index}
              onClick={() => setSelectedLesson(lesson)}
              className="border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 line-clamp-2">
                {lesson.siteMetadata.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {lesson.siteMetadata.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{lesson.sections.length} secties</span>
                <span>{lesson.contentFormat}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
