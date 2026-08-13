'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { DynamicIcon } from './DynamicIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/useTranslation';
import { getSectionTitle } from '@/lib/section-title';
import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v9m0 0l3-3m-3 3L5 8" />
      <path d="M3 13h10" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="8" height="9" rx="1" />
      <path d="M11 3H4a1 1 0 00-1 1v8" />
    </svg>
  );
}

interface ButtonConfig {
  url: string;
  text: string;
  icon: string;
  iconType?: 'name' | 'url';
  variant?: 'primary' | 'secondary';
  enabled?: boolean;
}

interface HeaderProps {
  siteMetadata: {
    title: string;
    description: string;
  };
  sections?: any[];
  buttons?: ButtonConfig[];
  showExportButtons?: boolean;
  showAnkiExport?: boolean;
  showFlashcardsExport?: boolean;
  showTranscriptExport?: boolean;
  showCopyTranscript?: boolean;
  showLanguageSwitcher?: boolean;
}

export function Header({
  siteMetadata,
  sections,
  buttons,
  showExportButtons = false,
  showAnkiExport = false,
  showFlashcardsExport = false,
  showTranscriptExport = false,
  showCopyTranscript = false,
  showLanguageSwitcher = false,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const hasExportActions =
    showExportButtons &&
    (showAnkiExport || showFlashcardsExport || showTranscriptExport || showCopyTranscript);

  const handleCopyTranscript = async () => {
    try {
      const transcriptContent = generateTranscript(sections || []);
      await navigator.clipboard.writeText(transcriptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateAnkiDeck = () => {
    if (!sections) return '';

    let ankiContent = '';
    sections.forEach((section) => {
      section.questions.forEach((question: any) => {
        const front = question.text;
        const back = question.answer || t('answer_not_provided', 'Answer not provided');
        ankiContent += `${front}\t${back}\n`;
      });
    });

    return ankiContent;
  };

  const generateFlashcards = () => {
    if (!sections) return '';

    let flashcardContent = '# Flashcards\n\n';
    sections.forEach((section) => {
      flashcardContent += `## ${getSectionTitle(section)}\n\n`;
      section.questions.forEach((question: any, index: number) => {
        flashcardContent += `### Q${index + 1}: ${question.text}\n\n`;
        flashcardContent += `**${t('answer')}:** ${question.answer || t('not_provided', 'Not provided')}\n\n---\n\n`;
      });
    });

    return flashcardContent;
  };

  const generateTranscript = (sectionsData: any[]) => {
    let transcript = `# ${siteMetadata.title}\n\n${siteMetadata.description}\n\n`;

    sectionsData.forEach((section) => {
      transcript += `## ${getSectionTitle(section)}\n\n`;
      if (section.timestamp) {
        transcript += `*${section.timestamp}*\n\n`;
      }

      section.questions.forEach((question: any) => {
        transcript += `### ${question.number}. ${question.text}\n\n`;
        if (question.answer) {
          transcript += `${question.answer}\n\n`;
        }
        transcript += `---\n\n`;
      });
    });

    return transcript;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="mb-3 w-full">
      {showLanguageSwitcher && (
        <div className="mb-5 flex items-center justify-end gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="ml-2 flex h-9 items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50"
          >
            Uitloggen
          </button>
        </div>
      )}

      <div className="w-full">
        <div className="mb-6 flex items-start gap-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-2 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md hover:bg-secondary/50 flex-shrink-0"
            title={t('back_to_main')}
            aria-label={t('back_to_main')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[36px] md:text-[48px] font-serif text-foreground leading-tight font-medium break-words">
              {siteMetadata.title}
            </h1>
            <p className="w-full text-[15px] text-muted-foreground mb-2 leading-relaxed">
              {siteMetadata.description}
            </p>
          </div>
        </div>
        <div className="flex flex-nowrap gap-2.5 mb-7 overflow-x-auto pb-1">
          {buttons &&
            buttons
              .filter((button) => button.enabled !== false)
              .map((button, index) => {
                const isPrimary = button.variant === 'primary';
                return (
                  <a
                    key={index}
                    href={button.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-[13px] rounded-[3px] transition-colors font-medium ${
                      isPrimary
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border bg-background text-foreground hover:bg-secondary'
                    }`}
                  >
                    <DynamicIcon
                      icon={button.icon}
                      iconType={button.iconType}
                      className="w-4 h-4"
                    />
                    {button.text}
                  </a>
                );
              })}
        </div>
      </div>

      {hasExportActions && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <span className="text-muted-foreground uppercase tracking-widest text-[11px] font-medium">
            {t('export')}
          </span>
          {showAnkiExport && (
            <button
              onClick={() => downloadFile(generateAnkiDeck(), 'flashcards.txt', 'text/plain')}
              className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {t('export_anki')} (.txt)
            </button>
          )}
          {showFlashcardsExport && (
            <button
              onClick={() => downloadFile(generateFlashcards(), 'flashcards.md', 'text/markdown')}
              className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {t('export_flashcards')} (.md)
            </button>
          )}
          {showTranscriptExport && (
            <button
              onClick={() =>
                downloadFile(generateTranscript(sections || []), 'transcript.md', 'text/markdown')
              }
              className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {t('export_transcript')} (.md)
            </button>
          )}
          {showCopyTranscript && (
            <button
              onClick={handleCopyTranscript}
              className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              {copied ? t('copied', 'Copied') : t('copy_transcript')}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
