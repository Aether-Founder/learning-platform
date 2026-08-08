'use client';

import { useState, useMemo, memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChevronDown, FileText, ImageIcon, Link, Presentation, StickyNote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { getSectionTitle, getSectionTitles } from '@/lib/section-title';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextbookQuestion {
  id: string;
  /** Display number, e.g. "1a", "1b", "3", "6a" */
  number: string;
  /** The question text (supports Markdown / LaTeX) */
  text: string;
}

export interface TextbookAnswer {
  /** Must match a TextbookQuestion id */
  questionId: string;
  /** Display number, e.g. "1a" */
  number: string;
  /** The answer text (supports Markdown / LaTeX) */
  answer: string;
}

export interface TextbookBlock {
  id: string;
  type: 'text' | 'questions' | 'image';
  /** Optional title for the block */
  title?: string;
  /** Only for type "text": the long reading content (Markdown / LaTeX) */
  content?: string;
  /** For type "text": optional image to display next to header */
  image?: string;
  /** For type "text": optional left image for dual-image layout */
  imageLeft?: string;
  /** For type "text": optional right image for dual-image layout */
  imageRight?: string;
  /** For type "text": caption for single image */
  caption?: string;
  /** For type "text": caption for left image */
  captionLeft?: string;
  /** For type "text": caption for right image */
  captionRight?: string;
  src?: string;
  alt?: string;
  /** Only for type "questions": optional intro sentence above the question list */
  intro?: string;
  /** Only for type "questions": the list of questions */
  questions?: TextbookQuestion[];
}

export interface TextbookSectionData {
  id: string;
  title: string | string[];
  titles?: string[];
  chapterTitles?: string[];
  /** Ordered list of content blocks (text and question blocks interleaved) */
  blocks: TextbookBlock[];
  /** Answers for all questions in this section — rendered at the bottom */
  answers: TextbookAnswer[];
  resources?: ContentResource[];
}

export interface ContentResource {
  id?: string;
  title: string;
  type: 'powerpoint' | 'pdf' | 'image' | 'docx' | 'link' | 'note';
  url?: string;
  text?: string;
  description?: string;
}

export type ViewMode =
  | 'book'
  | 'study'
  | 'simple'
  | 'samenvatting'
  | 'quiz'
  | 'alles-leren-2-dagen'
  | 'complete-oefentoets'
  | 'alle-leerdoelen-opdrachten'
  | 'vragenlijst';

interface TextbookSectionProps {
  section: TextbookSectionData;
  viewMode: ViewMode;
  bookmarks?: Set<string>;
  onToggleBookmark?: (blockId: string, title: string) => void;
  /** When true, show the answers panel at the bottom (book + simple modes) */
  showAnswers?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function processNewlines(text: string | undefined | null): string {
  if (!text) return '';
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

/** Build a lookup map from questionId → answer */
function buildAnswerMap(answers: TextbookAnswer[]): Map<string, TextbookAnswer> {
  if (!answers) return new Map();
  return new Map(answers.map((a) => [a.questionId, a]));
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function ResourceIcon({ type }: { type: ContentResource['type'] }) {
  const className = 'h-4 w-4';
  if (type === 'powerpoint') return <Presentation className={className} />;
  if (type === 'image') return <ImageIcon className={className} />;
  if (type === 'note') return <StickyNote className={className} />;
  if (type === 'link') return <Link className={className} />;
  return <FileText className={className} />;
}

const ResourcesPanel = memo(function ResourcesPanel({
  resources,
}: {
  resources?: ContentResource[];
}) {
  const items =
    resources?.filter((resource) => resource.title && (resource.url || resource.text)) ?? [];
  if (items.length === 0) return null;

  return (
    <div className="mt-10 rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-lg font-serif font-medium text-foreground">Bronnen</h3>
      <div className="space-y-4">
        {items.map((resource, index) => {
          const key = resource.id || `${resource.title}-${index}`;
          const canEmbedPowerPoint =
            resource.type === 'powerpoint' && resource.url && isAbsoluteUrl(resource.url);
          const officePreviewUrl = canEmbedPowerPoint
            ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resource.url!)}`
            : '';

          return (
            <div key={key} className="rounded-md border border-border bg-background p-3 space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted-foreground">
                  <ResourceIcon type={resource.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
                  )}
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target={isAbsoluteUrl(resource.url) ? '_blank' : '_self'}
                    rel={isAbsoluteUrl(resource.url) ? 'noopener noreferrer' : undefined}
                    className="text-xs text-primary underline underline-offset-2 shrink-0"
                  >
                    Open
                  </a>
                )}
              </div>

              {resource.type === 'note' && resource.text && (
                <MarkdownRenderer className="text-sm leading-relaxed">
                  {processNewlines(resource.text)}
                </MarkdownRenderer>
              )}

              {resource.type === 'image' && resource.url && (
                <img
                  src={resource.url}
                  alt={resource.title}
                  className="max-h-[480px] w-auto max-w-full rounded-md border border-border object-contain"
                />
              )}

              {resource.type === 'pdf' && resource.url && (
                <iframe
                  title={resource.title}
                  src={resource.url}
                  className="h-[520px] w-full rounded-md border border-border"
                />
              )}

              {canEmbedPowerPoint && (
                <iframe
                  title={resource.title}
                  src={officePreviewUrl}
                  className="h-[520px] w-full rounded-md border border-border"
                  allowFullScreen
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single collapsible question+answer row */
const QuestionRow = memo(function QuestionRow({
  question,
  answer,
}: {
  question: TextbookQuestion;
  answer?: TextbookAnswer;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <span className="font-mono text-sm font-medium text-muted-foreground min-w-[2.5rem] pt-0.5 flex-shrink-0">
          {question.number}
        </span>
        <MarkdownRenderer className="text-sm text-foreground leading-relaxed flex-1">
          {processNewlines(question.text)}
        </MarkdownRenderer>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border bg-secondary/30">
          {answer ? (
            <MarkdownRenderer className="text-sm text-foreground leading-relaxed">
              {processNewlines(answer.answer)}
            </MarkdownRenderer>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t('answer_not_provided_hint', 'Geen uitwerking beschikbaar.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/** Replaces both the static question list and the old AnswersPanel.
 *  Shows each question as a collapsible row; clicking reveals the answer. */
const QuestionsPanel = memo(function QuestionsPanel({ section }: { section: TextbookSectionData }) {
  const { t } = useTranslation();
  const answerMap = useMemo(() => buildAnswerMap(section.answers ?? []), [section.answers]);

  // Collect all question blocks in order
  const questionBlocks = section.blocks?.filter((b) => b.type === 'questions') || [];
  if (questionBlocks.length === 0) return null;

  // Use the first block's title if available, otherwise use translation
  const questionsTitle = questionBlocks[0]?.title || t('questions', 'Opdrachten');

  return (
    <div id={questionBlocks[0]?.id || `${section.id}-questions`} className="mt-8 scroll-mt-24">
      <div className="mb-4">
        <h3 className="text-xl font-serif font-medium text-foreground">{questionsTitle}</h3>
      </div>
      <div className="space-y-6">
        {questionBlocks.map((block) => (
          <div key={block.id}>
            {block.intro && (
              <div className="mb-3">
                <MarkdownRenderer className="text-sm text-muted-foreground leading-relaxed italic">
                  {processNewlines(block.intro)}
                </MarkdownRenderer>
              </div>
            )}
            <div className="space-y-2">
              {(block.questions ?? []).map((q) => (
                <QuestionRow key={q.id} question={q} answer={answerMap.get(q.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── BOOK MODE ────────────────────────────────────────────────────────────────

// Image positioning variables - adjust these to change image layout
const IMAGE_VERTICAL_OFFSET = 30; // px - moves all images down (positive) or up (negative)
const DUAL_IMAGE_HEIGHT = 200; // px - height for dual images (both left and right will have this height)

const BookMode = memo(function BookMode({
  section,
}: {
  section: TextbookSectionData;
  bookmarks?: Set<string>;
  onToggleBookmark?: (blockId: string, title: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Render only text blocks inline; questions are handled by QuestionsPanel below */}
      {section.blocks?.map((block) => {
        if (block.type === 'image' && block.src) {
          return (
            <figure key={block.id} id={block.id} className="scroll-mt-16">
              <img
                src={block.src}
                alt={block.alt || block.caption || ''}
                className="max-h-[520px] w-auto max-w-full rounded-lg border border-border object-contain"
              />
              {block.caption && (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        if (block.type !== 'text') return null;
        return (
          <article
            key={block.id}
            id={block.id}
            className="bg-card border border-border rounded-lg px-6 sm:px-8 pb-6 sm:pb-8 shadow-sm scroll-mt-16"
            style={{ paddingTop: '0.5rem' }}
          >
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <MarkdownRenderer className="text-[17px] leading-[1.75] text-foreground">
                  {processNewlines(block.content ?? '')}
                </MarkdownRenderer>
              </div>
              {block.imageLeft || block.imageRight ? (
                <div className="flex gap-2 flex-shrink-0 items-start">
                  {block.imageLeft && (
                    <div className="flex flex-col">
                      <img
                        src={block.imageLeft}
                        alt=""
                        className="object-contain mx-2 my-0"
                        style={{
                          height: `${DUAL_IMAGE_HEIGHT}px`,
                          width: 'auto',
                          marginTop: `${IMAGE_VERTICAL_OFFSET}px`,
                        }}
                      />
                      {block.captionLeft && (
                        <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                          {block.captionLeft}
                        </div>
                      )}
                    </div>
                  )}
                  {block.imageRight && (
                    <div className="flex flex-col">
                      <img
                        src={block.imageRight}
                        alt=""
                        className="object-contain mx-2 my-0"
                        style={{
                          height: `${DUAL_IMAGE_HEIGHT}px`,
                          width: 'auto',
                          marginTop: `${IMAGE_VERTICAL_OFFSET}px`,
                        }}
                      />
                      {block.captionRight && (
                        <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                          {block.captionRight}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                block.image && (
                  <div className="flex flex-col flex-shrink-0">
                    <img
                      src={block.image}
                      alt=""
                      className="max-w-[300px] object-contain mx-2 my-0"
                      style={{ marginTop: `${IMAGE_VERTICAL_OFFSET}px` }}
                    />
                    {block.caption && (
                      <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                        {block.caption}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </article>
        );
      })}

      <QuestionsPanel section={section} />
      <ResourcesPanel resources={section.resources} />
    </div>
  );
});

// ─── SIMPLE MODE ──────────────────────────────────────────────────────────────

const SimpleMode = memo(function SimpleMode({ section }: { section: TextbookSectionData }) {
  return (
    <article className="max-w-3xl mx-auto space-y-10">
      {/* Text blocks only */}
      {section.blocks?.map((block) => {
        if (block.type === 'image' && block.src) {
          return (
            <figure key={block.id} id={block.id} className="scroll-mt-16">
              <img
                src={block.src}
                alt={block.alt || block.caption || ''}
                className="max-h-[520px] w-auto max-w-full rounded-lg border border-border object-contain"
              />
              {block.caption && (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        if (block.type !== 'text') return null;
        return (
          <div key={block.id} id={block.id} className="scroll-mt-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <MarkdownRenderer className="text-[17px] leading-[1.75] text-foreground">
                  {processNewlines(block.content ?? '')}
                </MarkdownRenderer>
              </div>
              {block.imageLeft || block.imageRight ? (
                <div className="flex gap-2 flex-shrink-0 items-start">
                  {block.imageLeft && (
                    <div className="flex flex-col">
                      <img
                        src={block.imageLeft}
                        alt=""
                        className="object-contain mx-2 my-0"
                        style={{
                          height: `${DUAL_IMAGE_HEIGHT}px`,
                          width: 'auto',
                          marginTop: `${IMAGE_VERTICAL_OFFSET}px`,
                        }}
                      />
                      {block.captionLeft && (
                        <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                          {block.captionLeft}
                        </div>
                      )}
                    </div>
                  )}
                  {block.imageRight && (
                    <div className="flex flex-col">
                      <img
                        src={block.imageRight}
                        alt=""
                        className="object-contain mx-2 my-0"
                        style={{
                          height: `${DUAL_IMAGE_HEIGHT}px`,
                          width: 'auto',
                          marginTop: `${IMAGE_VERTICAL_OFFSET}px`,
                        }}
                      />
                      {block.captionRight && (
                        <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                          {block.captionRight}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                block.image && (
                  <div className="flex flex-col flex-shrink-0">
                    <img
                      src={block.image}
                      alt=""
                      className="max-w-[300px] object-contain mx-2 my-0"
                      style={{ marginTop: `${IMAGE_VERTICAL_OFFSET}px` }}
                    />
                    {block.caption && (
                      <div className="text-sm text-foreground text-left mx-2 whitespace-pre-line">
                        {block.caption}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}

      <QuestionsPanel section={section} />
      <ResourcesPanel resources={section.resources} />
    </article>
  );
});

export const TextbookSection = memo(function TextbookSection({
  section,
  viewMode,
  bookmarks,
  onToggleBookmark,
}: TextbookSectionProps) {
  useTranslation();
  const sectionTitles = getSectionTitles(section);
  const [mainTitle, ...extraTitles] = sectionTitles.length
    ? sectionTitles
    : [getSectionTitle(section)];

  return (
    <section id={section.id} className="space-y-8 mb-16">
      {/* Section title */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
          <span className="block">{mainTitle}</span>
          {extraTitles.map((title) => (
            <span key={title} className="mt-1 block text-xl sm:text-2xl text-muted-foreground">
              {title}
            </span>
          ))}
        </h2>
      </div>

      {viewMode === 'book' && (
        <BookMode section={section} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} />
      )}

      {viewMode === 'simple' && <SimpleMode section={section} />}

      {/* Study mode: hub is rendered once at page level via LearningPlatform */}
    </section>
  );
});
