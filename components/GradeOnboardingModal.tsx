'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/lib/supabase/auth';
import { ALL_SUBJECTS } from '@/components/learning-platform/StandaloneLearningPlatform';

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
  confirmedYear: _confirmedYear,
  onComplete,
  onSkip,
}: {
  currentGrade?: string | null;
  currentTrack?: string | null;
  confirmedYear?: string | null;
  onComplete: (grade: string, track: string | null, subjects: string[]) => void;
  onSkip?: () => void;
}) {
  const schoolYear = getCurrentSchoolYear();
  const needsOnboarding = !currentGrade;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGrade, setSelectedGrade] = useState<string>(currentGrade || '');
  const [selectedTrack, setSelectedTrack] = useState<string>(currentTrack || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!needsOnboarding) return null;

  const handleNextOrSave = async () => {
    if (step === 1) {
      if (!selectedGrade) return;
      if (requiresProfile(selectedGrade)) {
        setStep(2);
        return;
      }
      // Lower grade: go to subject selection
      setStep(3);
    } else if (step === 2) {
      if (!selectedTrack) return;
      // Profile selected, go to subject selection
      setStep(3);
    } else if (step === 3) {
      // Save everything including subjects
      await saveProfile(selectedGrade, selectedTrack, selectedSubjects);
    }
  };

  const saveProfile = async (grade: string, track: string | null, subjects: string[]) => {
    setLoading(true);
    try {
      const updates: any = {
        grade_level: grade,
        grade_confirmed_year: schoolYear,
      };

      // Only include track if it's provided
      if (track) {
        updates.track = track;
      }

      const result = await updateUserProfile(updates);

      if (result.error) {
        console.error('Supabase error details:', result.error);
        throw new Error(result.error.message || 'Database update failed');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('user_grade_level', grade);
        localStorage.setItem('user_profile_track', track || '');
        localStorage.setItem('user_grade_confirmed_year', schoolYear);
        localStorage.setItem('user_selected_subjects', JSON.stringify(subjects));
      }

      // Call onComplete to notify parent component
      await onComplete(grade, track, subjects);
    } catch (e: any) {
      console.error('Failed to save grade onboarding:', e);
      const errorMessage = e?.message || 'Onbekende fout';
      alert(`Er ging iets mis bij het opslaan: ${errorMessage}`);
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
            {step === 1
              ? 'In welke klas zit je?'
              : step === 2
                ? 'Welk profiel heb je gekozen?'
                : 'Welke vakken heb je?'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 1
              ? 'Selecteer je huidige leerjaar om je vakken en Toetsweekvoorbereiding in te stellen.'
              : step === 2
                ? 'Kies je profiel voor de bovenbouw.'
                : 'Selecteer de vakken die je dit jaar volgt.'}
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
        ) : step === 2 ? (
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
        ) : (
          <div className="my-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedSubjects.length} vakken geselecteerd
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubjects([...ALL_SUBJECTS])}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Alles selecteren
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-60 overflow-y-auto p-1 border border-border rounded-lg bg-background">
              {ALL_SUBJECTS.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => {
                      setSelectedSubjects((prev) =>
                        prev.includes(subject)
                          ? prev.filter((s) => s !== subject)
                          : [...prev, subject]
                      );
                    }}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-foreground bg-secondary text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        isSelected ? 'border-foreground bg-foreground' : 'border-border'
                      }`}
                    >
                      {isSelected && <span className="text-[10px] text-background">✓</span>}
                    </span>
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Terug
            </button>
          ) : onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Overslaan
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={
              loading ||
              (step === 1
                ? !selectedGrade
                : step === 2
                  ? !selectedTrack
                  : selectedSubjects.length === 0)
            }
            onClick={handleNextOrSave}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Opslaan...' : step === 3 ? 'Opslaan' : 'Volgende'}
          </button>
        </div>
      </div>
    </div>
  );
}
