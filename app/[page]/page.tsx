'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { NestedSection } from '@/components/NestedSection';
import { SimpleMode } from '@/components/SimpleMode';
import { LearningPlatform } from '@/components/learning-platform/LearningPlatform';
import { TextbookSection } from '@/components/TextbookSection';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ThemeToggle } from '@/components/theme-toggle';
import { ContentSkeleton, SidebarSkeleton } from '@/components/ContentSkeleton';
import { Toetsweekplanning } from '@/components/Toetsweekplanning';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SummaryMode } from '@/components/SummaryMode';
import { QuizMode } from '@/components/QuizMode';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useTranslation } from '@/lib/useTranslation';
import { useBookmarks } from '@/hooks/useBookmarks';
import { getSectionTitle } from '@/lib/section-title';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

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

const SUPPORTED_MODES: ViewMode[] = [
  'book',
  'study',
  'simple',
  'samenvatting',
  'quiz',
  'alles-leren-2-dagen',
  'complete-oefentoets',
  'alle-leerdoelen-opdrachten',
  'vragenlijst',
];
const VISIBLE_MODES: ViewMode[] = [
  'simple',
  'study',
  'samenvatting',
  'quiz',
  'alles-leren-2-dagen',
  'complete-oefentoets',
  'alle-leerdoelen-opdrachten',
  'vragenlijst',
];
// How many sections to reveal per progressive step
const CHUNK_SIZE = 3;

function normalizeAvailableModes(modes: any): ViewMode[] {
  if (!Array.isArray(modes) || modes.length === 0) return VISIBLE_MODES;
  const normalized = modes
    .map((mode) => (mode === 'book' ? 'simple' : mode))
    .filter((mode): mode is ViewMode => VISIBLE_MODES.includes(mode));
  return Array.from(new Set(normalized.length ? normalized : VISIBLE_MODES));
}

function hasStudyMaterial(sections: any[], data: any): boolean {
  // Check for top-level learningSet
  if (data?.learningSet?.terms?.length) {
    return true;
  }
  return sections.some((section) => {
    const hasSectionSets =
      section.learningSet?.terms?.length ||
      section.learningSets?.some((set: any) => set.terms?.length);
    const hasParagraphSets = section.paragraphs?.some(
      (paragraph: any) =>
        paragraph.questions?.length ||
        paragraph.learningSet?.terms?.length ||
        paragraph.learningSets?.some((set: any) => set.terms?.length)
    );
    const hasQuestionBlocks = section.blocks?.some(
      (block: any) => block.type === 'questions' && block.questions?.length > 0
    );
    return Boolean(hasSectionSets || hasParagraphSets || hasQuestionBlocks);
  });
}

function ToetsweekplanningSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="absolute right-2 top-2 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8">
        <div className="mb-8 space-y-3">
          <div className="skeleton-line h-10 w-2/3 rounded" />
          <div className="skeleton-line h-4 w-1/2 rounded" />
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 shadow-sm sm:p-6">
          <div className="mb-5 skeleton-line h-7 w-2/3 rounded" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background/70 p-4">
                <div className="mx-auto skeleton-line h-8 w-10 rounded" />
                <div className="mx-auto mt-3 skeleton-line h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-1">
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton-line h-9 w-24 rounded-md" />
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="skeleton-line h-12 border-b border-border rounded-none" />
              <div className="space-y-3 p-4">
                <div className="skeleton-line h-4 w-3/4 rounded" />
                <div className="skeleton-line h-4 w-full rounded" />
                <div className="skeleton-line h-4 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function applyLoadedData(
  loadedData: any,
  queryMode: ViewMode | null,
  setData: (d: any) => void,
  setIsParagraphContent: (v: boolean) => void,
  setIsTextbookContent: (v: boolean) => void,
  setIsCustomContent: (v: boolean) => void,
  setAvailableModes: (m: ViewMode[]) => void,
  setViewMode: (m: ViewMode) => void,
  setVisibleSections: (n: number) => void,
  setIsLoading: (v: boolean) => void,
  initialChunk: number
) {
  setData(loadedData);

  const hasParagraphs = loadedData.sections?.some(
    (s: any) => s.paragraphs && s.paragraphs.length > 0
  );
  setIsParagraphContent(hasParagraphs);

  const hasTextbookBlocks =
    loadedData.contentFormat === 'textbook' ||
    loadedData.sections?.some((s: any) => s.blocks && s.blocks.length > 0);
  setIsTextbookContent(hasTextbookBlocks);

  const hasCustomContent = loadedData.contentFormat === 'custom' && loadedData.customComponent;
  setIsCustomContent(hasCustomContent);

  const pageAvailableModes = normalizeAvailableModes(loadedData.availableModes);
  setAvailableModes(pageAvailableModes);

  const normalizedQueryMode = queryMode === 'book' ? 'simple' : queryMode;
  const normalizedDefaultMode =
    loadedData.defaultViewMode === 'book' ? 'simple' : loadedData.defaultViewMode;
  const chosenMode =
    normalizedQueryMode && pageAvailableModes.includes(normalizedQueryMode)
      ? normalizedQueryMode
      : normalizedDefaultMode && pageAvailableModes.includes(normalizedDefaultMode)
        ? normalizedDefaultMode
        : 'simple';

  setViewMode(chosenMode);
  setVisibleSections(initialChunk);
  setIsLoading(false);
}

export default function Page({ params }: { params: { page: string } }) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [availableModes, setAvailableModes] = useState<ViewMode[]>(VISIBLE_MODES);
  const [isParagraphContent, setIsParagraphContent] = useState<boolean>(false);
  const [isTextbookContent, setIsTextbookContent] = useState<boolean>(false);
  const [isCustomContent, setIsCustomContent] = useState<boolean>(false);
  const [visibleSections, setVisibleSections] = useState<number>(CHUNK_SIZE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const progressiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { t } = useTranslation();
  const { bookmarks, toggleBookmark } = useBookmarks(params.page);

  const totalSections = useMemo(() => data?.sections?.length || 0, [data]);

  // ── Load view mode from localStorage / query param ──────────────────────────
  useEffect(() => {
    const savedMode = localStorage.getItem(`viewMode-${params.page}`) as ViewMode;
    const queryMode = searchParams.get('mode') as ViewMode | null;
    if (queryMode && SUPPORTED_MODES.includes(queryMode)) {
      setViewMode(queryMode === 'book' ? 'simple' : queryMode);
    } else if (savedMode && SUPPORTED_MODES.includes(savedMode)) {
      setViewMode(savedMode === 'book' ? 'simple' : savedMode);
    }
  }, [params.page, searchParams]);

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      if (!availableModes.includes(mode)) return;
      setViewMode(mode);
      localStorage.setItem(`viewMode-${params.page}`, mode);
    },
    [availableModes, params.page]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // ── Main data loader ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const cacheKey = `content-${params.page}`;
      const queryMode = searchParams.get('mode') as ViewMode | null;

      // 1. Try localStorage cache → instant first paint
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (!cancelled) {
            applyLoadedData(
              cached,
              queryMode,
              setData,
              setIsParagraphContent,
              setIsTextbookContent,
              setIsCustomContent,
              setAvailableModes,
              setViewMode,
              setVisibleSections,
              setIsLoading,
              CHUNK_SIZE
            );
          }
          // Still fetch fresh in background to keep cache up-to-date
          fetch(`/api/content/page/${params.page}`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((fresh) => {
              if (fresh && !cancelled) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
                applyLoadedData(
                  fresh,
                  queryMode,
                  setData,
                  setIsParagraphContent,
                  setIsTextbookContent,
                  setIsCustomContent,
                  setAvailableModes,
                  setViewMode,
                  setVisibleSections,
                  setIsLoading,
                  CHUNK_SIZE
                );
              }
            })
            .catch(() => {});
          return;
        }
      } catch {}

      // 2. No cache → fetch from API route
      try {
        const res = await fetch(`/api/content/page/${params.page}`, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const loadedData = await res.json();
        if (cancelled) return;

        // Persist to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(loadedData));
        } catch {}

        applyLoadedData(
          loadedData,
          queryMode,
          setData,
          setIsParagraphContent,
          setIsTextbookContent,
          setIsCustomContent,
          setAvailableModes,
          setViewMode,
          setVisibleSections,
          setIsLoading,
          CHUNK_SIZE
        );
      } catch (err) {
        console.error('Error loading data:', err);
        if (!cancelled) {
          setLoadError(true);
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [params.page, searchParams]);

  // ── Progressive rendering: reveal CHUNK_SIZE sections at a time ──────────────
  // Fires once whenever `data` arrives or `visibleSections` changes,
  // but only schedules the NEXT step — no cascading re-fires.
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    // Clear any pending timer from a previous render
    if (progressiveTimerRef.current) clearTimeout(progressiveTimerRef.current);

    progressiveTimerRef.current = setTimeout(() => {
      setVisibleSections((prev) => Math.min(prev + CHUNK_SIZE, totalSections));
    }, 50); // 50 ms between chunks — fast but yields to the browser

    return () => {
      if (progressiveTimerRef.current) clearTimeout(progressiveTimerRef.current);
    };
  }, [data?.sections, visibleSections, totalSections]);

  // ── Scroll-based early loading ───────────────────────────────────────────────
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollPosition >= documentHeight - 800) {
        setVisibleSections((prev) => Math.min(prev + CHUNK_SIZE, totalSections));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.sections, visibleSections, totalSections]);

  // ── Scroll spy ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.sections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      let activeId = '';

      const allElements: { id: string; offsetTop: number; endTop: number }[] = [];

      for (const section of data.sections) {
        const element = document.getElementById(section.id);
        if (element) {
          allElements.push({
            id: section.id,
            offsetTop: element.offsetTop,
            endTop: element.offsetTop + element.offsetHeight,
          });
        }

        section.blocks?.forEach((block: any) => {
          if (block.type === 'text' && block.content) {
            const h3Matches = block.content.match(/\{#([a-z0-9-]+)\}/g);
            if (h3Matches) {
              h3Matches.forEach((match: string) => {
                const idMatch = match.match(/\{#([a-z0-9-]+)\}/);
                if (idMatch) {
                  const subElement = document.getElementById(idMatch[1]);
                  if (subElement) {
                    const allHeadings = Array.from(document.querySelectorAll('h2[id], h3[id]'));
                    const currentIndex = allHeadings.findIndex((h) => h.id === idMatch[1]);
                    const nextHeading = currentIndex >= 0 ? allHeadings[currentIndex + 1] : null;
                    const endTop = nextHeading
                      ? (nextHeading as HTMLElement).offsetTop
                      : subElement.offsetTop + subElement.offsetHeight;
                    allElements.push({
                      id: idMatch[1],
                      offsetTop: subElement.offsetTop,
                      endTop,
                    });
                  }
                }
              });
            }
          }
        });
      }

      allElements.sort((a, b) => a.offsetTop - b.offsetTop);

      for (const elem of allElements) {
        if (scrollPosition >= elem.offsetTop && scrollPosition < elem.endTop) {
          activeId = elem.id;
          break;
        } else if (scrollPosition < elem.offsetTop) {
          break;
        } else {
          activeId = elem.id;
        }
      }

      setActiveSection(activeId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.sections]);

  const showSkeleton = isLoading || !data;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  if (showSkeleton && params.page === 'toetsweekplanning') {
    return <ToetsweekplanningSkeleton />;
  }

  return (
    <>
      {/* Outer wrapper is in normal flow — scrolls away with the page.
          Controls are absolute inside it so they sit exactly at top-right. */}
      <div className="relative w-full">
        {/* Controls: top-right corner, small margin from top edge */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <ThemeToggle />
          {!showSkeleton && !isCustomContent && (isParagraphContent || isTextbookContent) && (
            <ModeSwitcher
              currentMode={viewMode}
              availableModes={availableModes}
              onModeChange={handleModeChange}
            />
          )}
        </div>

        {/* Header — pushed down below the controls row */}
        <div
          className="w-full px-4 sm:px-6 lg:px-8 pt-14 pb-2"
          style={{ paddingRight: 'max(1rem, 280px)' }}
        >
          {showSkeleton ? (
            <div className="space-y-3">
              <div className="skeleton-line h-8 w-1/3 rounded"></div>
              <div className="skeleton-line h-4 w-2/3 rounded"></div>
            </div>
          ) : (
            <Header
              siteMetadata={data.siteMetadata}
              sections={data.sections}
              buttons={data.buttons}
              showExportButtons={data.showExportButtons}
              showAnkiExport={data.showAnkiExport}
              showFlashcardsExport={data.showFlashcardsExport}
              showTranscriptExport={data.showTranscriptExport}
              showCopyTranscript={data.showCopyTranscript}
              showLanguageSwitcher={false}
            />
          )}
        </div>
      </div>

      <div className="w-full border-t border-border"></div>

      <main className="min-h-screen bg-background">
        <div className="flex flex-col md:flex-row md:gap-8 mt-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sidebar — independently scrollable, does not propagate wheel to page */}
          <aside
            className={`md:block flex-shrink-0 transition-all duration-300 ease-out ${
              viewMode === 'study' || isCustomContent
                ? 'w-0 max-w-0 basis-0 opacity-0 -translate-x-4 pointer-events-none overflow-hidden'
                : 'xl:w-[280px] lg:w-[250px] md:w-[220px] max-w-none basis-auto opacity-100 translate-x-0'
            }`}
          >
            <div
              className="sticky top-5 flex flex-col"
              style={{ height: 'calc(100vh - 2.5rem)' }}
              onWheel={(e) => {
                // Prevent the page from scrolling when the wheel is over the sidebar
                e.stopPropagation();
              }}
            >
              <div className="p-5 pb-3 flex-shrink-0">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {t('table_of_contents', 'Inhoudsopgave')}
                </h2>
              </div>

              {/* Scrollable nav — takes all remaining height, scrollbar hidden */}
              <nav className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                <div className="space-y-1 px-2 pb-4">
                  {showSkeleton && <SidebarSkeleton />}
                  {!showSkeleton && data.sections && data.sections.length > 0 && (
                    <>
                      <div className="w-full text-left px-3 py-2 rounded-md text-[13px] font-medium text-foreground select-none cursor-default">
                        <span className="inline">
                          {data.siteMetadata?.title || getSectionTitle(data.sections[0])}
                        </span>
                      </div>

                      <div className="ml-2 space-y-0.5 pl-3">
                        {data.sections.map((section: any) => (
                          <div key={section.id} className="space-y-1">
                            <button
                              onClick={() => toggleSection(section.id)}
                              className={`w-full text-left px-2 py-1.5 rounded text-[12px] font-medium transition-colors hover:bg-secondary/50 flex items-center gap-2 ${
                                activeSection === section.id
                                  ? 'bg-secondary/50 text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  expandedSections.has(section.id) ? 'rotate-90' : ''
                                }`}
                              />
                              <span className="inline">{getSectionTitle(section)}</span>
                            </button>
                            {expandedSections.has(section.id) &&
                              section.blocks?.map((block: any) => {
                                const title =
                                  block.title ||
                                  block.content?.match(/^#+\s+(.+)$/m)?.[1] ||
                                  (block.type === 'questions' ? 'Opdrachten' : block.id);
                                return (
                                  <button
                                    key={block.id}
                                    onClick={() => {
                                      document
                                        .getElementById(block.id)
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className={`w-full text-left px-4 py-1 rounded text-[11px] transition-colors hover:bg-secondary/50 ml-6 ${
                                      activeSection === block.id
                                        ? 'bg-secondary/50 text-foreground'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <span className="inline">{title}</span>
                                  </button>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 px-5 py-10 min-w-0">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
              {showSkeleton ? (
                <ContentSkeleton />
              ) : isCustomContent ? (
                data.customComponent === 'Toetsweekplanning' && data.toetsen ? (
                  <Toetsweekplanning toetsen={data.toetsen} />
                ) : null
              ) : viewMode === 'quiz' ? (
                <QuizMode quiz={data.quiz} />
              ) : viewMode === 'samenvatting' ? (
                <SummaryMode summary={data.summary} />
              ) : data.modeContent &&
                [
                  'alles-leren-2-dagen',
                  'complete-oefentoets',
                  'alle-leerdoelen-opdrachten',
                  'vragenlijst',
                ].includes(viewMode) ? (
                (() => {
                  const modeData = data.modeContent?.find((m: any) => m.id === viewMode);
                  if (!modeData) return null;
                  // Ensure content is a string and replace any [object Object] with newlines
                  let contentString =
                    typeof modeData.content === 'string'
                      ? modeData.content
                      : String(modeData.content);
                  contentString = contentString.replace(/\[object Object\]/g, '\n');
                  return (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <h1 className="text-3xl font-bold mb-6">{modeData.title}</h1>
                      <MarkdownRenderer className="text-foreground leading-relaxed">
                        {contentString}
                      </MarkdownRenderer>
                    </div>
                  );
                })()
              ) : isTextbookContent ? (
                <>
                  {data.sections.slice(0, visibleSections).map((section: any, index: number) => {
                    if (viewMode === 'study') {
                      if (!hasStudyMaterial(data.sections, data)) return null;
                      return index === 0 ? (
                        <LearningPlatform
                          key="study-learning-platform"
                          pageId={params.page}
                          sections={data.sections}
                          enableImageLearning={data.enableImageLearning}
                          learningSet={data.learningSet}
                        />
                      ) : null;
                    }
                    return (
                      <div key={section.id}>
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-2xl font-serif text-foreground font-normal">
                            {getSectionTitle(section)}
                          </h2>
                          <Link
                            href={`/lessen?subject=${params.page}&chapter=${section.id}`}
                            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Les starten
                          </Link>
                        </div>
                        <TextbookSection
                          section={{
                            ...section,
                            resources:
                              index === 0
                                ? [...(data.resources ?? []), ...(section.resources ?? [])]
                                : section.resources,
                          }}
                          viewMode={viewMode}
                          bookmarks={bookmarks}
                          onToggleBookmark={toggleBookmark}
                        />
                      </div>
                    );
                  })}
                </>
              ) : isParagraphContent ? (
                data.sections.slice(0, visibleSections).map((section: any, index: number) => {
                  if (viewMode === 'study') {
                    if (!hasStudyMaterial(data.sections, data)) return null;
                    return index === 0 ? (
                      <LearningPlatform
                        key="study-learning-platform"
                        pageId={params.page}
                        sections={data.sections}
                      />
                    ) : null;
                  }
                  return (
                    <div key={section.id}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-serif text-foreground font-normal">
                          {getSectionTitle(section)}
                        </h2>
                        <Link
                          href={`/lessen?subject=${params.page}&chapter=${section.id}`}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Les starten
                        </Link>
                      </div>
                      <SimpleMode section={section} />
                    </div>
                  );
                })
              ) : (
                data.sections
                  .slice(0, visibleSections)
                  .map((section: any) => (
                    <NestedSection
                      key={section.id}
                      section={section}
                      showTimestamps={data.showTimestamps}
                    />
                  ))
              )}

              {/* Subtle progress indicator while more chunks are loading */}
              {!showSkeleton && visibleSections < totalSections && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </div>
            <Footer />
          </div>
        </div>
      </main>
      <ScrollToTop />
    </>
  );
}
