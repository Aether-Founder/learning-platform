'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { useUser } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const supabase = browserClient as any;

type Lesson = {
  id: string;
  title: string;
  description: string;
  subject: string;
  chapter: string;
  content: any;
  created_at: string;
  updated_at: string;
};

export default function AdminLessonsPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    chapter: '',
    content: '',
  });

  // Check if user is admin (you can customize this logic)
  const isAdmin = user?.email === 'your-admin-email@example.com'; // Replace with your admin email

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    loadLessons();
  }, [isAdmin, router]);

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLesson(null);
    setFormData({ title: '', description: '', subject: '', chapter: '', content: '' });
    setShowDialog(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      subject: lesson.subject,
      chapter: lesson.chapter,
      content: JSON.stringify(lesson.content, null, 2),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze les wilt verwijderen?')) return;

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      await loadLessons();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const handleSave = async () => {
    try {
      const lessonData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        chapter: formData.chapter,
        content: JSON.parse(formData.content),
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lessons').insert([lessonData]);
        if (error) throw error;
      }

      setShowDialog(false);
      await loadLessons();
    } catch (error) {
      console.error('Failed to save lesson:', error);
      alert('Opslaan mislukt. Controleer of de content geldige JSON is.');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Lessen Beheer"
        description="Beheer lesinhoud en structuur"
        action={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Les
          </Button>
        }
      />

      <div className="mt-10">
        {loading ? (
          <div className="text-center text-muted-foreground">Laden...</div>
        ) : lessons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold">Geen lessen</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Maak je eerste les aan om te beginnen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>
                    <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                      <span>Vak: {lesson.subject}</span>
                      <span>•</span>
                      <span>Hoofdstuk: {lesson.chapter}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Les Bewerken' : 'Nieuwe Les'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Titel</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Les titel"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beschrijving</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Korte beschrijving van de les"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Vak</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Bijv. wiskunde-a"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hoofdstuk</label>
                <Input
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="Bijv. chapter-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Content (JSON)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder='{"sections": [...], "blocks": [...]}'
                rows={10}
                className="font-mono text-xs"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Voer de lesinhoud in als JSON formaat
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Annuleren
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
