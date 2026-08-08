'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/lib/supabase/auth';

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const GRADES = [
  'VMBO 1',
  'VMBO 2',
  'VMBO 3',
  'VMBO 4',
  'HAVO 1',
  'HAVO 2',
  'HAVO 3',
  'HAVO 4',
  'HAVO 5',
  'VWO 1',
  'VWO 2',
  'VWO 3',
  'VWO 4',
  'VWO 5',
  'VWO 6',
] as const;

const PROFILES = [
  'Natuur & Techniek',
  'Natuur & Gezondheid',
  'Economie & Maatschappij',
  'Cultuur & Maatschappij',
] as const;

export function requiresProfile(grade: string): boolean {
  const upperGrades = ['HAVO 4', 'HAVO 5', 'VWO 4', 'VWO 5', 'VWO 6'];
  return upperGrades.includes(grade);
}

export function GradeOnboardingModal({
  currentGrade,
  currentTrack,
  confirmedYear,
  onComplete,
}: {
  currentGrade?: string | null;
  currentTrack?: string | null;
  confirmedYear?: string | null;
  onComplete: (grade: string, track: string | null) => void;
}) {
  const schoolYear = getCurrentSchoolYear();
  const needsOnboarding = !currentGrade || confirmedYear !== schoolYear;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGrade, setSelectedGrade] = useState<string>(currentGrade || '');
  const [selectedTrack, setSelectedTrack] = useState<string>(currentTrack || '');
  const [loading, setLoading] = useState(false);

  if (!needsOnboarding) return null;

  const handleNextOrSave = async () => {
    if (step === 1) {
      if (!selectedGrade) return;
      if (requiresProfile(selectedGrade)) {
        setStep(2);
        return;
      }
      // Lower grade: save without profile
      await saveProfile(selectedGrade, null);
    } else if (step === 2) {
      if (!selectedTrack) return;
      await saveProfile(selectedGrade, selectedTrack);
    }
  };

  const saveProfile = async (grade: string, track: string | null) => {
    setLoading(true);
    try {
      await updateUserProfile({
        grade_level: grade,
        track: track,
        grade_confirmed_year: schoolYear,
      } as any);

      if (typeof window !== 'undefined') {
        localStorage.setItem('user_grade_level', grade);
        localStorage.setItem('user_profile_track', track || '');
        localStorage.setItem('user_grade_confirmed_year', schoolYear);
      }

      onComplete(grade, track);
    } catch (e) {
      console.error('Failed to save grade onboarding:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            Schooljaar {schoolYear}
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {step === 1 ? 'In welke klas zit je?' : 'Welk profiel heb je gekozen?'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 1
              ? 'Selecteer je huidige leerjaar om je vakken en Toetsweekvoorbereiding in te stellen.'
              : 'Kies je profiel voor de bovenbouw.'}
          </p>
        </div>

        {step === 1 ? (
          <div className="my-6 grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                  selectedGrade === g
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background hover:border-foreground/40 hover:bg-secondary/50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
          <div className="my-6 space-y-2.5 max-h-60 overflow-y-auto">
            {PROFILES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedTrack(p)}
                className={`w-full rounded-lg border p-3.5 text-left text-sm font-medium transition-all ${
                  selectedTrack === p
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background hover:border-foreground/40 hover:bg-secondary/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Terug
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={loading || (step === 1 ? !selectedGrade : !selectedTrack)}
            onClick={handleNextOrSave}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? 'Opslaan...'
              : step === 1 && requiresProfile(selectedGrade)
                ? 'Volgende'
                : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
