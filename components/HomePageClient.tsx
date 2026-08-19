'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, BookOpen } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { AuthModal } from '@/components/AuthModal';
import { TestWeekWizard } from '@/components/TestWeekWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContentFile {
  pageName: string;
  title: string;
  description: string;
}

function TitleWithFlatDash({ title }: { title: string }) {
  const parts = title.split(' - ');

  if (parts.length === 1) return <>{title}</>;

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 && (
            <span className="mx-1 inline-block translate-y-[-0.02em] font-sans not-italic leading-none">
              -
            </span>
          )}
          {part}
        </span>
      ))}
    </>
  );
}

export function HomePageClient({ contentFiles }: { contentFiles: ContentFile[] }) {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTestWeekWizard, setShowTestWeekWizard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [testWeeks, setTestWeeks] = useState<any[]>([]);
  const [activeTestWeek, setActiveTestWeek] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    if (token && userId) {
      setIsLoggedIn(true);
      loadTestWeeks();
    }
  }, []);

  const loadTestWeeks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/testweeks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestWeeks(data.testWeeks);
        setActiveTestWeek(data.activeTestWeek);
      }
    } catch (error) {
      console.error('Failed to load test weeks:', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    setShowAuthModal(false);
    loadTestWeeks();
  };

  const handleGuestMode = () => {
    setShowAuthModal(false);
  };

  const handleTestWeekComplete = () => {
    setShowTestWeekWizard(false);
    loadTestWeeks();
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        onGuestMode={handleGuestMode}
      />
      <TestWeekWizard
        isOpen={showTestWeekWizard}
        onClose={() => setShowTestWeekWizard(false)}
        onComplete={handleTestWeekComplete}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl font-serif text-foreground font-medium text-center mb-4">
            {mounted ? t('home_title', 'Toetsweekvoorbereiding') : 'Toetsweekvoorbereiding'}
          </h1>
          <p className="text-muted-foreground text-center text-lg max-w-3xl mx-auto">
            {mounted
              ? t('home_subtitle', 'Kies hieronder een vak om te oefenen voor de toetsweek.')
              : 'Kies hieronder een vak om te oefenen voor de toetsweek.'}
          </p>
        </header>

        {isLoggedIn && (
          <div className="mb-8 p-6 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('hw_testweek')}</h2>
              <Button size="sm" onClick={() => setShowTestWeekWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('hw_new_testweek')}
              </Button>
            </div>

            {activeTestWeek ? (
              <div>
                <Link
                  href={`/testweek/${activeTestWeek.id}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{activeTestWeek.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeTestWeek.startDate).toLocaleDateString(dateLocale)} -{' '}
                      {new Date(activeTestWeek.endDate).toLocaleDateString(dateLocale)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {t('hw_subject_count', undefined, { n: activeTestWeek.subjects.length })}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                {testWeeks.length > 1 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">{t('hw_other_testweeks')}</p>
                    <div className="space-y-2">
                      {testWeeks
                        .filter((tw) => tw.id !== activeTestWeek.id)
                        .slice(0, 3)
                        .map((tw) => (
                          <Link
                            key={tw.id}
                            href={`/testweek/${tw.id}`}
                            className="block p-3 border border-border rounded hover:bg-secondary/50 transition-colors text-sm"
                          >
                            {tw.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('hw_no_testweek')}</p>
                <Button onClick={() => setShowTestWeekWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('hw_create_first')}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {contentFiles.map((content) => (
            <Link
              key={content.pageName}
              href={`/toetsweekvoorbereiding/${content.pageName}`}
              className="block min-h-[190px] p-6 border border-border rounded-lg transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground mb-2 font-serif">
                  <TitleWithFlatDash title={content.title} />
                </h2>
                <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{content.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
