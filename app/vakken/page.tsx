'use client';

import Link from 'next/link';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/useTranslation';
import { useEffect, useMemo, useState } from 'react';
import { GradeOnboardingModal } from '@/components/GradeOnboardingModal';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';

type Subject = {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon: string;
  description?: string;
  teacher?: string;
  exam_relevance: string;
  mastery_percentage?: number;
  status?: string;
  upcoming_tests?: number;
  average_grade?: number;
};

type SubjectForm = {
  name: string;
  code: string;
  color: string;
  description: string;
  teacher: string;
  exam_relevance: string;
};

const DEFAULT_SUBJECTS = ['Aardrijkskunde', 'BSM', 'Biologie', 'CKV', 'Decanaat', 'Duits algemeen', 'Economie', 'Engels', 'Frans', 'Geschiedenis', 'Informatica', 'KUMU', 'Kunst BV', 'LO', 'Levensbeschouwing', 'Mentoraat', 'Natuurkunde', 'Nederlands', 'Scheikunde', 'Wiskunde A', 'Wiskunde B', 'Wiskunde D'];
const REQUIRED_SUBJECTS = ['Nederlands', 'Levensbeschouwing', 'Maatschappijleer', 'Engels'];
const PROFILE_SUBJECTS: Record<string, string[]> = {
  'Natuur & Techniek': ['Natuurkunde', 'Scheikunde', 'Wiskunde B', 'Wiskunde D', 'Informatica'],
  'Natuur & Gezondheid': ['Biologie', 'Scheikunde', 'Wiskunde A', 'Natuurkunde'],
  'Economie & Maatschappij': ['Economie', 'Wiskunde A', 'Geschiedenis', 'Aardrijkskunde'],
  'Cultuur & Maatschappij': ['Geschiedenis', 'Aardrijkskunde', 'Frans', 'Duits algemeen', 'Kunst BV'],
};

function SubjectSkeleton() {
  return (
    <>
      <div className="space-y-3">
        <div className="skeleton-line h-8 w-1/3 rounded"></div>
        <div className="skeleton-line h-4 w-2/3 rounded"></div>
        <div className="skeleton-line h-4 w-1/2 rounded"></div>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className="subject-skeleton h-24 rounded-lg border border-border bg-card" />)}</div>
    </>
  );
}

function SubjectTile({ subject, onHide, onPrioritize }: { subject: Subject; onHide: () => void; onPrioritize: () => void }) {
  const [open, setOpen] = useState(false);
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'beheerst': return 'text-muted-foreground';
      case 'herhalen': return 'text-muted-foreground';
      case 'leren': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative" onContextMenu={(event) => { event.preventDefault(); setOpen(true); }}>
      <Link 
        href={`/vakken/${subject.id}`} 
        className="flex min-h-24 flex-col justify-between rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:bg-secondary"
      >
        <div className="flex items-start justify-between">
          <span className="text-lg font-medium">{subject.name}</span>
          {subject.mastery_percentage !== undefined && (
            <span className="text-sm font-semibold text-muted-foreground">{subject.mastery_percentage}%</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          {subject.status && (
            <span className={`text-xs ${getStatusColor(subject.status)}`}>{subject.status}</span>
          )}
          {subject.upcoming_tests !== undefined && subject.upcoming_tests > 0 && (
            <span className="text-xs text-muted-foreground">{subject.upcoming_tests} toetsen</span>
          )}
        </div>
      </Link>
      {open && <div className="absolute right-2 top-2 z-20 w-36 rounded-md border border-border bg-background p-1 text-xs shadow-lg" onMouseLeave={() => setOpen(false)}>
        <button type="button" onClick={() => { onPrioritize(); setOpen(false); }} className="w-full rounded px-2 py-1.5 text-left hover:bg-secondary">Bovenaan tonen</button>
        <button type="button" onClick={() => { onHide(); setOpen(false); }} className="w-full rounded px-2 py-1.5 text-left hover:bg-secondary">Verbergen</button>
      </div>}
    </div>
  );
}

export default function VakkenIndex() {
  const { t } = useTranslation();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile();
  const [ready, setReady] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [prioritized, setPrioritized] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<SubjectForm>({
    name: '',
    code: '',
    color: '#3b82f6',
    description: '',
    teacher: '',
    exam_relevance: 'normaal',
  });
  const [saving, setSaving] = useState(false);
  
  const preferenceKey = user ? `aether-subject-preferences:${user.id}` : 'aether-subject-preferences:guest';

  useEffect(() => {
    if (userLoading || profileLoading) return;
    try {
      const stored = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
      setHidden(Array.isArray(stored.hidden) ? stored.hidden : []);
      setPrioritized(Array.isArray(stored.prioritized) ? stored.prioritized : []);
    } catch { /* Use default catalog. */ }
    setSetupOpen(Boolean(user && localStorage.getItem(`aether-grade-setup-complete:${user.id}`) !== 'true' && !profile?.grade_level));
    setReady(true);
  }, [user, userLoading, profile?.grade_level, profileLoading, preferenceKey]);

  useEffect(() => { if (ready) localStorage.setItem(preferenceKey, JSON.stringify({ hidden, prioritized })); }, [hidden, prioritized, ready, preferenceKey]);

  const loadSubjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          slug,
          color,
          icon,
          description,
          teacher,
          exam_relevance,
          subject_chapters (
            subject_topics (
              mastery_tracking (
                mastery_percentage,
                status
              )
            )
          ),
          subject_tests (
            test_date
          ),
          subject_grades (
            grade
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const processedSubjects = data.map((subject: any) => {
          // Calculate average mastery
          let totalMastery = 0;
          let masteryCount = 0;
          subject.subject_chapters?.forEach((chapter: any) => {
            chapter.subject_topics?.forEach((topic: any) => {
              if (topic.mastery_tracking) {
                totalMastery += topic.mastery_tracking.mastery_percentage || 0;
                masteryCount++;
              }
            });
          });
          const avgMastery = masteryCount > 0 ? Math.round(totalMastery / masteryCount) : undefined;

          // Count upcoming tests
          const now = new Date();
          const upcomingTests = subject.subject_tests?.filter((test: any) => new Date(test.test_date) >= now).length || 0;

          // Calculate average grade
          const grades = subject.subject_grades?.map((g: any) => g.grade) || [];
          const avgGrade = grades.length > 0 ? (grades.reduce((a: number, b: number) => a + b, 0) / grades.length).toFixed(1) : undefined;

          return {
            ...subject,
            mastery_percentage: avgMastery,
            upcoming_tests: upcomingTests,
            average_grade: avgGrade,
          };
        });
        setSubjects(processedSubjects);
      } else {
        // No subjects in DB, use defaults
        const defaultSubjects = DEFAULT_SUBJECTS.map(name => ({
          id: name,
          name,
          color: '#3b82f6',
          icon: 'BookOpen',
          exam_relevance: 'normaal',
        }));
        setSubjects(defaultSubjects);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      // Fallback to defaults
      const defaultSubjects = DEFAULT_SUBJECTS.map(name => ({
        id: name,
        name,
        color: '#3b82f6',
        icon: 'BookOpen',
        exam_relevance: 'normaal',
      }));
      setSubjects(defaultSubjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [user]);

  const prioritizedByProfile = profile?.track ? PROFILE_SUBJECTS[profile.track] || [] : [];
  const visible = useMemo(() => subjects.filter((subject) => !hidden.includes(subject.name)), [subjects, hidden]);
  const selected = visible.filter((subject) => prioritized.includes(subject.name) || prioritizedByProfile.includes(subject.name) || REQUIRED_SUBJECTS.includes(subject.name));
  const display = showAll ? visible : selected;
  const complete = async (grade: string, track: string | null, subjects: string[]) => { 
    if (user) {
      localStorage.setItem(`aether-grade-setup-complete:${user.id}`, 'true');
      localStorage.setItem('user_selected_subjects', JSON.stringify(subjects));
      
      // Create selected subjects in the database
      for (const subjectName of subjects) {
        try {
          await supabase.from('subjects').insert({
            user_id: user.id,
            name: subjectName,
            slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
            color: '#3b82f6',
          });
        } catch (error) {
          console.error('Error creating subject:', subjectName, error);
        }
      }
    }
    setSetupOpen(false);
    // Reload subjects to show newly created ones
    if (user) {
      loadSubjects();
    }
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        user_id: user.id,
        name: form.name.trim(),
        color: form.color,
        icon: 'BookOpen',
        description: form.description.trim() || null,
        teacher: form.teacher.trim() || null,
        exam_relevance: form.exam_relevance,
      });

      if (error) throw error;

      // Reload subjects
      const { data } = await supabase.from('subjects').select('*').eq('user_id', user.id);
      if (data) {
        setSubjects(data.map((s: any) => ({
          ...s,
          mastery_percentage: undefined,
          upcoming_tests: 0,
          average_grade: undefined,
        })));
      }

      setCreateOpen(false);
      setForm({
        name: '',
        code: '',
        color: '#3b82f6',
        description: '',
        teacher: '',
        exam_relevance: 'normaal',
      });
    } catch (error) {
      console.error('Error creating subject:', error);
    } finally {
      setSaving(false);
    }
  };

  return <AppShell>
    <PageHeader 
      eyebrow={t('subjects_eyebrow')} 
      title={t('subjects_title')} 
      description={t('subjects_description')}
      action={
        user && (
          <div className="flex gap-2">
            <Button onClick={() => setSetupOpen(true)} variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Selecteer je vakken
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuw vak
            </Button>
          </div>
        )
      }
    />
    {loading ? <SubjectSkeleton /> : <>
      {display.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Geen vakken</h2>
          <p className="mt-2 text-sm text-muted-foreground">Voeg je eerste vak toe om te beginnen.</p>
          <Button className="mt-6" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuw vak
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((subject) => (
            <SubjectTile 
              key={subject.id} 
              subject={subject} 
              onHide={() => setHidden((current) => [...new Set([...current, subject.name])])} 
              onPrioritize={() => setPrioritized((current) => [...new Set([...current, subject.name])])} 
            />
          ))}
        </div>
      )}
      {!showAll && selected.length > 0 && selected.length < visible.length && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-8 w-full rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Alle vakken tonen</button>
      )}
      {showAll && hidden.length > 0 && (
        <button type="button" onClick={() => setHidden([])} className="mt-5 text-sm text-muted-foreground hover:text-foreground">Verborgen vakken herstellen</button>
      )}
    </>}
    {setupOpen && <GradeOnboardingModal currentGrade={profile?.grade_level} currentTrack={profile?.track} confirmedYear={profile?.grade_confirmed_year} onComplete={complete} onSkip={() => { complete('', '', []); setShowAll(true); }} />}
    
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Nieuw vak toevoegen</DialogTitle></DialogHeader>
        <form onSubmit={createSubject} className="space-y-4">
          <div>
            <Label htmlFor="subject-name">Vaknaam *</Label>
            <Input 
              id="subject-name" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required 
              placeholder="bijv. Wiskunde B"
            />
          </div>
          <div>
            <Label htmlFor="subject-code">Code</Label>
            <Input 
              id="subject-code" 
              value={form.code} 
              onChange={(e) => setForm({ ...form, code: e.target.value })} 
              placeholder="bijv. WISKB"
            />
          </div>
          <div>
            <Label htmlFor="subject-teacher">Docent</Label>
            <Input 
              id="subject-teacher" 
              value={form.teacher} 
              onChange={(e) => setForm({ ...form, teacher: e.target.value })} 
              placeholder="Naam van docent"
            />
          </div>
          <div>
            <Label htmlFor="subject-relevance">Examenrelevantie</Label>
            <select 
              id="subject-relevance" 
              value={form.exam_relevance} 
              onChange={(e) => setForm({ ...form, exam_relevance: e.target.value })}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="laag">Laag</option>
              <option value="normaal">Normaal</option>
              <option value="hoog">Hoog</option>
            </select>
          </div>
          <div>
            <Label htmlFor="subject-description">Beschrijving</Label>
            <Input 
              id="subject-description" 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              placeholder="Optionele beschrijving"
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Opslaan...' : 'Vak toevoegen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  </AppShell>;
}
