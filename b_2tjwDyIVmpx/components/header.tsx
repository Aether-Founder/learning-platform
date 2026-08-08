'use client';

import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SubstackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="18" height="4" rx="0.5" />
      <rect x="3" y="9" width="18" height="4" rx="0.5" />
      <path d="M3 15h18v6L12 17l-9 4v-6z" />
    </svg>
  );
}

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

export function Header() {
  const [copied, setCopied] = useState(false);

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText('Transcript content would be copied here...');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <header className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <h1 className="text-[26px] md:text-[32px] font-serif text-foreground leading-tight font-medium">
          Flashcards for Reiner Pope on Dwarkesh Podcast
        </h1>
        <div className="xl:hidden flex-shrink-0">
          <ThemeToggle />
        </div>
      </div>
      <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
        Wrote some practice problems to help myself and my audience retain Reiner&apos;s blackboard
        lecture.
      </p>

      <div className="flex flex-wrap gap-2.5 mb-7">
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-foreground text-primary-foreground text-[13px] rounded-[3px] hover:bg-foreground/90 transition-colors font-medium"
        >
          <YoutubeIcon className="w-4 h-4" />
          Watch on YouTube
        </a>
        <a
          href="https://substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-foreground text-primary-foreground text-[13px] rounded-[3px] hover:bg-foreground/90 transition-colors font-medium"
        >
          <SubstackIcon className="w-4 h-4" />
          Read on Substack
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <span className="text-muted-foreground uppercase tracking-widest text-[11px] font-medium">
          Export
        </span>
        <a
          href="#"
          className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Anki deck (.apkg)
        </a>
        <a
          href="#"
          className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Flashcards (.md)
        </a>
        <a
          href="#"
          className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Transcript (.md)
        </a>
        <button
          onClick={handleCopyTranscript}
          className="text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <CopyIcon className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy transcript'}
        </button>
      </div>
    </header>
  );
}
