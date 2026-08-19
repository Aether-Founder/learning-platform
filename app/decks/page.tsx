'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader, SearchField } from '@/components/AppShell';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { Plus, Trash2, Edit2, BookOpen, Brain, FileText, Target, LayoutGrid, Play, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = browserClient as any;

type StudySet = {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  slug: string;
  content_json: any;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  subject?: {
    id: string;
    name: string;
    color: string;
  };
};

type Subject = {
  id: string;
  name: string;
  color: string;
};

type Flashcard = {
  id: string;
  study_set_id: string;
  question: string;
  answer: string;
  number: string;
  difficulty?: string;
  order_index: number;
  metadata: any;
  created_at: string;
  updated_at: string;
};

export default function DecksPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [editingSet, setEditingSet] = useState<StudySet | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [setFormData, setSetFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
  });
  const [cardFormData, setCardFormData] = useState({
    question: '',
    answer: '',
  });

  useEffect(() => {
    fetchStudySets();
    fetchSubjects();
  }, []);

  const fetchStudySets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('study_sets')
      .select('*, subject:subjects(id, name, color)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch study sets:', error);
    } else {
      setStudySets(data || []);
    }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch subjects:', error);
    } else {
      setSubjects(data || []);
    }
  };

  const fetchCards = async (setId: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('study_set_id', setId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch cards:', error);
    } else {
      setCards(data || []);
    }
  };

  const handleCreateSet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('study_sets')
      .insert({
        user_id: user.id,
        title: setFormData.title,
        description: setFormData.description,
        subject_id: setFormData.subject_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create study set:', error);
    } else if (data) {
      setStudySets([data, ...studySets]);
      setShowSetDialog(false);
      resetSetForm();
    }
  };

  const handleUpdateSet = async () => {
    if (!editingSet) return;

    const { data, error } = await supabase
      .from('study_sets')
      .update({
        title: setFormData.title,
        description: setFormData.description,
      })
      .eq('id', editingSet.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update study set:', error);
    } else if (data) {
      setStudySets(studySets.map(s => s.id === editingSet.id ? data : s));
      setShowSetDialog(false);
      setEditingSet(null);
      resetSetForm();
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm('Weet je zeker dat je deze leerset wilt verwijderen? Alle kaarten worden ook verwijderd.')) return;

    const { error } = await supabase.from('study_sets').delete().eq('id', setId);
    if (error) {
      console.error('Failed to delete study set:', error);
    } else {
      setStudySets(studySets.filter(s => s.id !== setId));
      if (selectedSet?.id === setId) {
        setSelectedSet(null);
        setCards([]);
      }
    }
  };

  const handleCreateCard = async () => {
    if (!selectedSet) return;

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        study_set_id: selectedSet.id,
        question: cardFormData.question,
        answer: cardFormData.answer,
        number: String(cards.length + 1),
        order_index: cards.length,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create card:', error);
    } else if (data) {
      setCards([...cards, data]);
      setShowCardDialog(false);
      resetCardForm();
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Weet je zeker dat je deze kaart wilt verwijderen?')) return;

    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) {
      console.error('Failed to delete card:', error);
    } else {
      setCards(cards.filter(c => c.id !== cardId));
    }
  };

  const handleUpdateCard = async () => {
    if (!editingCard) return;

    const { data, error } = await supabase
      .from('flashcards')
      .update({
        question: cardFormData.question,
        answer: cardFormData.answer,
      })
      .eq('id', editingCard.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update card:', error);
    } else if (data) {
      setCards(cards.map(c => c.id === editingCard.id ? data : c));
      setShowCardDialog(false);
      setEditingCard(null);
      resetCardForm();
    }
  };

  const openCreateSetDialog = () => {
    router.push('/create/leerlijst');
  };

  const openCreateCardDialog = () => {
    setEditingCard(null);
    resetCardForm();
    setShowCardDialog(true);
  };

  const openEditSetDialog = (set: StudySet) => {
    router.push(`/leersets/edit/${set.id}`);
  };


  const openEditCardDialog = (card: Flashcard) => {
    setEditingCard(card);
    setCardFormData({
      question: card.question,
      answer: card.answer,
    });
    setShowCardDialog(true);
  };

  const selectSet = (set: StudySet) => {
    setSelectedSet(set);
    fetchCards(set.id);
  };

  const resetSetForm = () => {
    setSetFormData({ title: '', description: '', subject_id: '' });
  };

  const resetCardForm = () => {
    setCardFormData({ question: '', answer: '' });
  };

  const handleExportCSV = (set: StudySet) => {
    const csvContent = [
      ['Question', 'Answer'],
      ...cards.map(card => [card.question, card.answer])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${set.title.replace(/[^a-z0-9]/gi, '_')}_cards.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAnki = (set: StudySet) => {
    // Anki format: tab-separated with HTML
    const ankiContent = cards.map(card => 
      `${card.question.replace(/\n/g, '<br>')}\t${card.answer.replace(/\n/g, '<br>')}`
    ).join('\n');

    const blob = new Blob([ankiContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${set.title.replace(/[^a-z0-9]/gi, '_')}_anki.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const importedCards: any[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV (handle quoted strings)
      const matches = line.match(/("([^"]|"")*"|[^,]+)(,|$)/g);
      if (matches) {
        const question = matches[0]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
        const answer = matches[1]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
        
        if (question && answer) {
          importedCards.push({
            study_set_id: selectedSet?.id,
            question,
            answer,
            number: String(cards.length + importedCards.length + 1),
            order_index: cards.length + importedCards.length,
            metadata: {},
          });
        }
      }
    }

    if (importedCards.length > 0) {
      const { error } = await supabase.from('flashcards').insert(importedCards);
      if (error) {
        console.error('Failed to import cards:', error);
        alert('Import mislukt');
      } else {
        await fetchCards(selectedSet!.id);
        alert(`${importedCards.length} kaarten geïmporteerd`);
      }
    }
  };

  const filteredSets = studySets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const studyModes = [
    { id: 'flashcards', label: 'Flashcards', icon: Brain, color: 'bg-blue-500' },
    { id: 'learn', label: 'Leren', icon: BookOpen, color: 'bg-green-500' },
    { id: 'write', label: 'Schrijven', icon: FileText, color: 'bg-purple-500' },
    { id: 'test', label: 'Toets', icon: Target, color: 'bg-red-500' },
    { id: 'match', label: 'Match', icon: LayoutGrid, color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('decks_eyebrow')}
          title={t('decks_title')}
          description={t('decks_description')}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-6">
              <div className="skeleton-line h-5 w-3/4 rounded mb-3"></div>
              <div className="skeleton-line h-4 w-1/2 rounded mb-2"></div>
              <div className="skeleton-line h-4 w-1/3 rounded"></div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('decks_eyebrow')}
        title={t('decks_title')}
        description={t('decks_description')}
        action={
          <Button onClick={openCreateSetDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('decks_new')}
          </Button>
        }
      />

      <div className="mt-6">
        <SearchField 
          value={searchQuery} 
          onChange={setSearchQuery}
          placeholder={t('search_placeholder_sets')}
          className="max-w-md"
        />
      </div>

      {selectedSet ? (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <Button variant="ghost" onClick={() => setSelectedSet(null)} className="mb-2">
                ← Terug naar leersets
              </Button>
              <h2 className="font-display text-xl sm:text-2xl font-semibold">{selectedSet.title}</h2>
              {selectedSet.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedSet.description}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={openCreateCardDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Kaart toevoegen
              </Button>
              {selectedSet.subject && (
                <Link href={`/vakken/${selectedSet.subject.id}`}>
                  <Button variant="outline" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Bekijk in Vakken
                  </Button>
                </Link>
              )}
              <Button onClick={() => openEditSetDialog(selectedSet)} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Leerset bewerken
              </Button>
              <Button onClick={() => handleExportCSV(selectedSet)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={() => handleExportAnki(selectedSet)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Anki
              </Button>
              <label className="inline-flex">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportCSV(file);
                  }}
                />
              </label>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nog geen kaarten</p>
              <p className="text-sm text-muted-foreground mb-4">Voeg je eerste kaart toe om te beginnen met leren.</p>
              <Button onClick={() => setShowCardDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Eerste kaart maken
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">{cards.length} kaarten</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {cards.map((card, index) => (
                    <div key={card.id} className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditCardDialog(card)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="font-medium text-sm mb-2 line-clamp-2">{card.question}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{card.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium mb-4">Studeer modi</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {studyModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <Link
                        key={mode.id}
                        href={`/study/${selectedSet.id}/${mode.id}`}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                      >
                        <div className={`grid h-10 w-10 place-items-center rounded-full ${mode.color} text-white shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{mode.label}</p>
                          <p className="text-xs text-muted-foreground">{cards.length} kaarten</p>
                        </div>
                        <Play className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t('decks_empty')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('decks_empty_desc')}</p>
              <Button onClick={openCreateSetDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('decks_empty_cta')}
              </Button>
            </div>
          ) : (
            filteredSets.map((set) => (
              <div
                key={set.id}
                onClick={() => selectSet(set)}
                className="border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditSetDialog(set); }}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-secondary rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {set.subject && (
                  <div className="mb-2">
                    <span 
                      className="inline-block px-2 py-0.5 text-xs rounded-full"
                      style={{ 
                        backgroundColor: set.subject.color + '20',
                        color: set.subject.color 
                      }}
                    >
                      {set.subject.name}
                    </span>
                  </div>
                )}
                <h3 className="font-display text-lg font-semibold mb-2">{set.title}</h3>
                {set.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{set.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{set.view_count} keer bekeken</span>
                  <span>{new Date(set.updated_at).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Set Dialog */}
      <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSet ? 'Leerset bewerken' : 'Nieuwe leerset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="set-title">Titel</Label>
              <Input
                id="set-title"
                value={setFormData.title}
                onChange={(e) => setSetFormData({ ...setFormData, title: e.target.value })}
                placeholder="Bijv. Wiskunde H3"
              />
            </div>
            <div>
              <Label htmlFor="set-subject">Vak (optioneel)</Label>
              <select
                id="set-subject"
                value={setFormData.subject_id}
                onChange={(e) => setSetFormData({ ...setFormData, subject_id: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Geen vak</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="set-description">Beschrijving</Label>
              <Textarea
                id="set-description"
                value={setFormData.description}
                onChange={(e) => setSetFormData({ ...setFormData, description: e.target.value })}
                placeholder="Wat leer je in deze set?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={editingSet ? handleUpdateSet : handleCreateSet}>
              {editingSet ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Kaart bewerken' : 'Nieuwe kaart'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-question">Vraag</Label>
              <Textarea
                id="card-question"
                value={cardFormData.question}
                onChange={(e) => setCardFormData({ ...cardFormData, question: e.target.value })}
                placeholder="Stel je vraag..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="card-answer">Antwoord</Label>
              <Textarea
                id="card-answer"
                value={cardFormData.answer}
                onChange={(e) => setCardFormData({ ...cardFormData, answer: e.target.value })}
                placeholder="Het antwoord..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCardDialog(false); setEditingCard(null); resetCardForm(); }}>
              Annuleren
            </Button>
            <Button onClick={editingCard ? handleUpdateCard : handleCreateCard}>
              {editingCard ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
