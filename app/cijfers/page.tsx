'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge, Panel, Tabs } from '@/components/ui-kit';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';

const supabase = browserClient as any;

type Grade = {
  id: string;
  user_id: string;
  subject_id?: string;
  subject_name: string;
  teacher_name?: string;
  test_name: string;
  grade: number;
  weight: number;
  period?: number;
  test_date?: string;
  target_grade?: number;
  created_at: string;
  updated_at: string;
};

const VIEWS = ['vakken', 'matrix', 'periodes'] as const;
type View = (typeof VIEWS)[number];

export default function CijfersPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('vakken');
  const [period, setPeriod] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    teacher_name: '',
    test_name: '',
    grade: '',
    weight: '1.0',
    period: '',
    test_date: '',
    target_grade: '',
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch grades:', error);
    } else {
      setGrades(data || []);
    }
    setLoading(false);
  };

  const handleCreateGrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('grades')
      .insert({
        user_id: user.id,
        subject_name: formData.subject_name,
        teacher_name: formData.teacher_name || null,
        test_name: formData.test_name,
        grade: parseFloat(formData.grade),
        weight: parseFloat(formData.weight),
        period: formData.period ? parseInt(formData.period) : null,
        test_date: formData.test_date || null,
        target_grade: formData.target_grade ? parseFloat(formData.target_grade) : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create grade:', error);
    } else if (data) {
      setGrades([data, ...grades]);
      setShowDialog(false);
      resetForm();
    }
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade) return;

    const { data, error } = await supabase
      .from('grades')
      .update({
        subject_name: formData.subject_name,
        teacher_name: formData.teacher_name || null,
        test_name: formData.test_name,
        grade: parseFloat(formData.grade),
        weight: parseFloat(formData.weight),
        period: formData.period ? parseInt(formData.period) : null,
        test_date: formData.test_date || null,
        target_grade: formData.target_grade ? parseFloat(formData.target_grade) : null,
      })
      .eq('id', editingGrade.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update grade:', error);
    } else if (data) {
      setGrades(grades.map(g => g.id === editingGrade.id ? data : g));
      setShowDialog(false);
      setEditingGrade(null);
      resetForm();
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Weet je zeker dat je dit cijfer wilt verwijderen?')) return;

    const { error } = await supabase.from('grades').delete().eq('id', gradeId);
    if (error) {
      console.error('Failed to delete grade:', error);
    } else {
      setGrades(grades.filter(g => g.id !== gradeId));
    }
  };

  const openCreateDialog = () => {
    setEditingGrade(null);
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({
      subject_name: grade.subject_name,
      teacher_name: grade.teacher_name || '',
      test_name: grade.test_name,
      grade: grade.grade.toString(),
      weight: grade.weight.toString(),
      period: grade.period?.toString() || '',
      test_date: grade.test_date || '',
      target_grade: grade.target_grade?.toString() || '',
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      subject_name: '',
      teacher_name: '',
      test_name: '',
      grade: '',
      weight: '1.0',
      period: '',
      test_date: '',
      target_grade: '',
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    if (grades.length === 0) {
      return {
        average: null,
        highest: null,
        lowest: null,
        insufficient: 0,
        subjectCount: 0,
      };
    }

    const allGrades = grades.map(g => g.grade);
    const average = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
    const highest = Math.max(...allGrades);
    const lowest = Math.min(...allGrades);
    const insufficient = allGrades.filter(g => g < 5.5).length;
    const subjects = new Set(grades.map(g => g.subject_name)).size;

    return {
      average: average.toFixed(1),
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      insufficient,
      subjectCount: subjects,
    };
  };

  const stats = calculateStats();

  // Filter grades by period
  const filteredGrades = period === 0 
    ? grades 
    : grades.filter(g => g.period === period);

  // Group by subject
  const gradesBySubject = filteredGrades.reduce((acc, grade) => {
    if (!acc[grade.subject_name]) {
      acc[grade.subject_name] = [];
    }
    acc[grade.subject_name].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  const viewLabels: Record<View, string> = {
    vakken: t('grades_tab_subjects'),
    matrix: t('grades_tab_all'),
    periodes: t('grades_tab_periods'),
  };
  const tabs = VIEWS.map((value) => ({ value, label: viewLabels[value] }));

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('grades_eyebrow')}
          title={t('grades_title')}
          description={t('grades_description')}
        />
        <div className="mt-10 text-center text-sm text-muted-foreground">Laden...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('grades_eyebrow')}
        title={t('grades_title')}
        description={t('grades_description')}
        action={
          <div className="text-right">
            <p className="font-display text-5xl font-semibold leading-none tabular-nums">
              {stats.average || '-,-'}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('grades_average')}
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Tabs tabs={tabs} value={view} onChange={setView} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t('grades_period')}
          </span>
          {([0, 1, 2, 3, 4] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              {p === 0 ? t('grades_all') : `P${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-b border-border pb-8 sm:grid-cols-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_subjects')}</p>
          <p className="mt-1 font-display text-3xl font-semibold">{stats.subjectCount}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_highest')}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{stats.highest || '-,-'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.highest && parseFloat(stats.highest) >= 7 ? (
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" /> Goed
              </span>
            ) : (
              '-'
            )}
          </p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_lowest')}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{stats.lowest || '-,-'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.lowest && parseFloat(stats.lowest) < 5.5 ? (
              <span className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" /> Onvoldoende
              </span>
            ) : (
              '-'
            )}
          </p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t('grades_failing')}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">{stats.insufficient}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('grades_failing_desc')}</p>
        </Panel>
      </div>

      <div className="pt-8">
        {view === 'vakken' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t('grades_col_subject')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_teacher')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_tests')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_progress')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_target')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_avg')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(gradesBySubject).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {t('grades_empty')}
                    </td>
                  </tr>
                ) : (
                  Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
                    const subjectAvg = subjectGrades.reduce((sum, g) => sum + g.grade * g.weight, 0) / 
                                       subjectGrades.reduce((sum, g) => sum + g.weight, 0);
                    const targetAvg = subjectGrades
                      .filter(g => g.target_grade)
                      .reduce((sum, g) => sum + (g.target_grade || 0), 0) / 
                      subjectGrades.filter(g => g.target_grade).length || 0;
                    const progress = targetAvg ? ((subjectAvg / targetAvg) * 100).toFixed(0) : null;

                    return (
                      <tr key={subjectName} className="hover:bg-secondary/50">
                        <td className="px-5 py-4 font-medium">{subjectName}</td>
                        <td className="px-5 py-4 text-muted-foreground">{subjectGrades[0].teacher_name || '-'}</td>
                        <td className="px-5 py-4 text-muted-foreground">{subjectGrades.length} {t('grades_count', undefined, { n: subjectGrades.length, m: subjectGrades.length })}</td>
                        <td className="px-5 py-4">
                          {progress !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(progress)))}%` }}
                                />
                              </div>
                              <span className="text-xs">{progress}%</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">{targetAvg ? targetAvg.toFixed(1) : '-'}</td>
                        <td className="px-5 py-4 text-right font-medium">{subjectAvg.toFixed(1)}</td>
                        <td className="px-5 py-4">
                          <Button variant="ghost" size="sm" onClick={() => {/* TODO: Open subject detail */}}>
                            {t('grades_open')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'matrix' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t('grades_col_subject')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_teacher')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_test')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_date')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_period')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_weight')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_grade')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {t('grades_empty')}
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-secondary/50">
                      <td className="px-5 py-4 font-medium">{grade.subject_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{grade.teacher_name || '-'}</td>
                      <td className="px-5 py-4">{grade.test_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {grade.test_date ? new Date(grade.test_date).toLocaleDateString('nl-NL') : '-'}
                      </td>
                      <td className="px-5 py-4">
                        {grade.period ? <Badge>P{grade.period}</Badge> : '-'}
                      </td>
                      <td className="px-5 py-4 text-right">{grade.weight}</td>
                      <td className="px-5 py-4 text-right font-medium">
                        <span className={grade.grade < 5.5 ? 'text-red-600' : ''}>{grade.grade.toFixed(1)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditDialog(grade)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-secondary"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'periodes' && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((p) => {
              const periodGrades = grades.filter(g => g.period === p);
              if (periodGrades.length === 0) return null;
              
              const periodAvg = periodGrades.reduce((sum, g) => sum + g.grade * g.weight, 0) / 
                               periodGrades.reduce((sum, g) => sum + g.weight, 0);
              
              return (
                <div key={p} className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl font-semibold">{t('grades_period_row', undefined, { p })}</h3>
                    <Badge>{periodGrades.length} {t('grades_count', undefined, { n: periodGrades.length, m: periodGrades.length })}</Badge>
                  </div>
                  <div className="space-y-2">
                    {periodGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{grade.subject_name}</span>
                        <span className={`font-medium ${grade.grade < 5.5 ? 'text-red-600' : ''}`}>
                          {grade.grade.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('grades_average')}</span>
                      <span className="font-display text-2xl font-semibold">{periodAvg.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {[1, 2, 3, 4].every(p => grades.filter(g => g.period === p).length === 0) && (
              <p className="col-span-2 text-center text-sm text-muted-foreground">{t('grades_empty')}</p>
            )}
          </div>
        )}
      </div>

      <Button 
        className="fixed bottom-8 right-8 shadow-lg" 
        size="lg"
        onClick={openCreateDialog}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('grades_add')}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrade ? 'Cijfer bewerken' : 'Nieuw cijfer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="grade-subject">Vak</Label>
              <Input
                id="grade-subject"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                placeholder="Bijv. Wiskunde"
              />
            </div>
            <div>
              <Label htmlFor="grade-teacher">Docent</Label>
              <Input
                id="grade-teacher"
                value={formData.teacher_name}
                onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                placeholder="Bijv. mw. Jansen"
              />
            </div>
            <div>
              <Label htmlFor="grade-test">Toets</Label>
              <Input
                id="grade-test"
                value={formData.test_name}
                onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                placeholder="Bijv. Hertoets Paragraaf 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade-value">Cijfer (1-10)</Label>
                <Input
                  id="grade-value"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="7.5"
                />
              </div>
              <div>
                <Label htmlFor="grade-weight">Weging</Label>
                <Input
                  id="grade-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade-period">Periode</Label>
                <select
                  id="grade-period"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selecteer...</option>
                  <option value="1">P1</option>
                  <option value="2">P2</option>
                  <option value="3">P3</option>
                  <option value="4">P4</option>
                </select>
              </div>
              <div>
                <Label htmlFor="grade-date">Datum</Label>
                <Input
                  id="grade-date"
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grade-target">Streefcijfer</Label>
              <Input
                id="grade-target"
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.target_grade}
                onChange={(e) => setFormData({ ...formData, target_grade: e.target.value })}
                placeholder="7.0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={editingGrade ? handleUpdateGrade : handleCreateGrade}>
              {editingGrade ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
