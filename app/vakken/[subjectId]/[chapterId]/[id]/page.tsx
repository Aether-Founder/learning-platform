'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useUser } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, Calendar, TrendingUp, Edit, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Subject = {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon: string;
  description?: string;
  teacher?: string;
  exam_relevance: string;
  created_at: string;
};

type Chapter = {
  id: string;
  name: string;
  number: number;
  description?: string;
  topics?: Topic[];
};

type Topic = {
  id: string;
  name: string;
  description?: string;
  mastery?: {
    mastery_percentage: number;
    status: string;
    last_reviewed_at: string;
    next_review_at: string;
  };
};

type Test = {
  id: string;
  title: string;
  test_date: string;
  risk_level: string;
  current_mastery: number;
};

type Grade = {
  id: string;
  grade: number;
  test_date: string;
  weight: number;
  notes?: string;
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    description: '',
    teacher: '',
    exam_relevance: 'normaal',
  });

  const [chapterForm, setChapterForm] = useState({
    name: '',
    number: 1,
    description: '',
  });

  const [testForm, setTestForm] = useState({
    title: '',
    test_date: '',
    weight_factor: 1,
    required_grade: 5.5,
    notes: '',
  });

  const [gradeForm, setGradeForm] = useState({
    grade: '',
    test_date: '',
    weight: 1,
    notes: '',
  });

  useEffect(() => {
    if (!user || !params.id) return;

    async function loadSubjectData() {
      try {
        // Load subject
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (subjectError || !subjectData) {
          setSubject(null);
          setLoading(false);
          return;
        }

        setSubject(subjectData);
        setEditForm({
          name: subjectData.name,
          code: subjectData.code || '',
          description: subjectData.description || '',
          teacher: subjectData.teacher || '',
          exam_relevance: subjectData.exam_relevance,
        });

        // Load chapters with topics and mastery
        const { data: chaptersData } = await supabase
          .from('subject_chapters')
          .select(`
            id,
            name,
            number,
            description,
            subject_topics (
              id,
              name,
              description,
              mastery_tracking (
                mastery_percentage,
                status,
                last_reviewed_at,
                next_review_at
              )
            )
          `)
          .eq('subject_id', params.id)
          .order('number');

        if (chaptersData) {
          const processedChapters = chaptersData.map((chapter: any) => ({
            ...chapter,
            topics: chapter.subject_topics?.map((topic: any) => ({
              ...topic,
              mastery: topic.mastery_tracking?.[0],
            })) || [],
          }));
          setChapters(processedChapters);
        }

        // Load tests
        const { data: testsData } = await supabase
          .from('subject_tests')
          .select('*')
          .eq('subject_id', params.id)
          .order('test_date');

        if (testsData) {
          setTests(testsData);
        }

        // Load grades
        const { data: gradesData } = await supabase
          .from('subject_grades')
          .select('*')
          .eq('subject_id', params.id)
          .order('test_date', { ascending: false });

        if (gradesData) {
          setGrades(gradesData);
        }
      } catch (error) {
        console.error('Error loading subject data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubjectData();
  }, [user, params.id, router]);

  const updateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: editForm.name,
          code: editForm.code || null,
          description: editForm.description || null,
          teacher: editForm.teacher || null,
          exam_relevance: editForm.exam_relevance,
        })
        .eq('id', subject.id);

      if (error) throw error;

      setSubject({
        ...subject,
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
        teacher: editForm.teacher,
        exam_relevance: editForm.exam_relevance,
      });
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  const addChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !chapterForm.name.trim()) return;

    try {
      const { error } = await supabase.from('subject_chapters').insert({
        subject_id: subject.id,
        name: chapterForm.name.trim(),
        number: chapterForm.number,
        description: chapterForm.description.trim() || null,
      });

      if (error) throw error;

      // Reload chapters
      const { data } = await supabase
        .from('subject_chapters')
        .select(`
          id,
          name,
          number,
          description,
          subject_topics (
            id,
            name,
            description,
            mastery_tracking (
              mastery_percentage,
              status,
              last_reviewed_at,
              next_review_at
            )
          )
        `)
        .eq('subject_id', subject.id)
        .order('number');

      if (data) {
        const processedChapters = data.map((chapter: any) => ({
          ...chapter,
          topics: chapter.subject_topics?.map((topic: any) => ({
            ...topic,
            mastery: topic.mastery_tracking?.[0],
          })) || [],
        }));
        setChapters(processedChapters);
      }

      setChapterForm({ name: '', number: chapters.length + 1, description: '' });
      setChapterOpen(false);
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  const addTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !testForm.title.trim() || !testForm.test_date) return;

    try {
      const { error } = await supabase.from('subject_tests').insert({
        subject_id: subject.id,
        title: testForm.title.trim(),
        test_date: testForm.test_date,
        weight_factor: testForm.weight_factor,
        required_grade: parseFloat(testForm.required_grade),
        notes: testForm.notes.trim() || null,
      });

      if (error) throw error;

      // Reload tests
      const { data } = await supabase
        .from('subject_tests')
        .select('*')
        .eq('subject_id', subject.id)
        .order('test_date');

      if (data) setTests(data);

      setTestForm({ title: '', test_date: '', weight_factor: 1, required_grade: 5.5, notes: '' });
      setTestOpen(false);
    } catch (error) {
      console.error('Error adding test:', error);
    }
  };

  const addGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !gradeForm.grade || !gradeForm.test_date) return;

    try {
      const { error } = await supabase.from('subject_grades').insert({
        subject_id: subject.id,
        grade: parseFloat(gradeForm.grade),
        test_date: gradeForm.test_date,
        weight: gradeForm.weight,
        notes: gradeForm.notes.trim() || null,
      });

      if (error) throw error;

      // Reload grades
      const { data } = await supabase
        .from('subject_grades')
        .select('*')
        .eq('subject_id', subject.id)
        .order('test_date', { ascending: false });

      if (data) setGrades(data);

      setGradeForm({ grade: '', test_date: '', weight: 1, notes: '' });
      setGradeOpen(false);
    } catch (error) {
      console.error('Error adding grade:', error);
    }
  };

  const calculateAverageMastery = () => {
    let total = 0;
    let count = 0;
    chapters.forEach(chapter => {
      chapter.topics?.forEach(topic => {
        if (topic.mastery?.mastery_percentage !== undefined) {
          total += topic.mastery.mastery_percentage;
          count++;
        }
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.grade, 0);
    return (sum / grades.length).toFixed(1);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="skeleton-line h-8 w-1/3 rounded"></div>
          <div className="skeleton-line h-4 w-2/3 rounded"></div>
        </div>
        <div className="mt-10 space-y-4">
          <div className="skeleton-line h-32 w-full rounded"></div>
          <div className="skeleton-line h-32 w-full rounded"></div>
        </div>
      </AppShell>
    );
  }

  if (!subject) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Vak"
          title={params.id || 'Vak'}
          description="Maak je eerste studyset om te beginnen"
        />
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Nog geen inhoud</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Maak je eerste studyset om te beginnen met leren.
          </p>
          <Button onClick={() => setChapterOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Maak je eerste studyset
          </Button>
        </div>
      </AppShell>
    );
  }

  const avgMastery = calculateAverageMastery();
  const avgGrade = calculateAverageGrade();

  return (
    <AppShell>
      <PageHeader
        eyebrow={subject.code || 'Vak'}
        title={subject.name}
        description={subject.description || 'Beheer je voortgang voor dit vak'}
        action={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Bewerken
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 py-8 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Meesterschap</span>
          </div>
          <p className="font-display text-2xl font-semibold">{avgMastery}%</p>
          <p className="text-xs text-muted-foreground mt-1">Gemiddeld</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Gemiddeld cijfer</span>
          </div>
          <p className="font-display text-2xl font-semibold">{avgGrade}</p>
          <p className="text-xs text-muted-foreground mt-1">{grades.length} cijfers</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Aankomende toetsen</span>
          </div>
          <p className="font-display text-2xl font-semibold">
            {tests.filter(t => new Date(t.test_date) >= new Date()).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Totaal {tests.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Hoofdstukken</span>
          </div>
          <p className="font-display text-2xl font-semibold">{chapters.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {chapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0)} onderwerpen
          </p>
        </div>
      </div>

      {/* Chapters */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Hoofdstukken</h2>
          <Button size="sm" onClick={() => setChapterOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Hoofdstuk toevoegen
          </Button>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen hoofdstukken. Voeg je eerste hoofdstuk toe.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">H{chapter.number}</span>
                    <span className="font-medium">{chapter.name}</span>
                  </div>
                  <Link href={`/vakken/${subject.id}/${chapter.id}`} className="text-sm text-primary hover:underline">
                    Details
                  </Link>
                </div>
                {chapter.topics && chapter.topics.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {chapter.topics.map((topic) => (
                      <div key={topic.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/50">
                        <span className="text-muted-foreground">{topic.name}</span>
                        {topic.mastery && (
                          <span className="text-xs text-muted-foreground">{topic.mastery.mastery_percentage}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tests */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Toetsen</h2>
          <Button size="sm" onClick={() => setTestOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Toets toevoegen
          </Button>
        </div>
        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen toetsen gepland.</p>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium">{test.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(test.test_date).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{test.risk_level}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grades */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Cijfers</h2>
          <Button size="sm" onClick={() => setGradeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cijfer toevoegen
          </Button>
        </div>
        {grades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen cijfers ingevoerd.</p>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium">{grade.grade}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(grade.test_date).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Gewicht: {grade.weight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Subject Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Vak bewerken</DialogTitle></DialogHeader>
          <form onSubmit={updateSubject} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Vaknaam</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="edit-code">Code</Label>
              <Input id="edit-code" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-teacher">Docent</Label>
              <Input id="edit-teacher" value={editForm.teacher} onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-relevance">Examenrelevantie</Label>
              <select id="edit-relevance" value={editForm.exam_relevance} onChange={(e) => setEditForm({ ...editForm, exam_relevance: e.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="laag">Laag</option>
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-description">Beschrijving</Label>
              <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuleren</Button>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={chapterOpen} onOpenChange={setChapterOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Hoofdstuk toevoegen</DialogTitle></DialogHeader>
          <form onSubmit={addChapter} className="space-y-4">
            <div>
              <Label htmlFor="chapter-name">Naam</Label>
              <Input id="chapter-name" value={chapterForm.name} onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="chapter-number">Nummer</Label>
              <Input id="chapter-number" type="number" value={chapterForm.number} onChange={(e) => setChapterForm({ ...chapterForm, number: parseInt(e.target.value) })} required />
            </div>
            <div>
              <Label htmlFor="chapter-description">Beschrijving</Label>
              <Textarea id="chapter-description" value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChapterOpen(false)}>Annuleren</Button>
              <Button type="submit">Toevoegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Test Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Toets toevoegen</DialogTitle></DialogHeader>
          <form onSubmit={addTest} className="space-y-4">
            <div>
              <Label htmlFor="test-title">Titel</Label>
              <Input id="test-title" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="test-date">Datum</Label>
              <Input id="test-date" type="date" value={testForm.test_date} onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="test-weight">Gewicht</Label>
              <Input id="test-weight" type="number" value={testForm.weight_factor} onChange={(e) => setTestForm({ ...testForm, weight_factor: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="test-required">Benodigd cijfer</Label>
              <Input id="test-required" type="number" step="0.1" value={testForm.required_grade} onChange={(e) => setTestForm({ ...testForm, required_grade: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="test-notes">Notities</Label>
              <Textarea id="test-notes" value={testForm.notes} onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTestOpen(false)}>Annuleren</Button>
              <Button type="submit">Toevoegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Cijfer toevoegen</DialogTitle></DialogHeader>
          <form onSubmit={addGrade} className="space-y-4">
            <div>
              <Label htmlFor="grade-value">Cijfer</Label>
              <Input id="grade-value" type="number" step="0.1" min="1" max="10" value={gradeForm.grade} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="grade-date">Datum</Label>
              <Input id="grade-date" type="date" value={gradeForm.test_date} onChange={(e) => setGradeForm({ ...gradeForm, test_date: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="grade-weight">Gewicht</Label>
              <Input id="grade-weight" type="number" value={gradeForm.weight} onChange={(e) => setGradeForm({ ...gradeForm, weight: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="grade-notes">Notities</Label>
              <Textarea id="grade-notes" value={gradeForm.notes} onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradeOpen(false)}>Annuleren</Button>
              <Button type="submit">Toevoegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
