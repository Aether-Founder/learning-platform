'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase as browserClient } from '@/lib/supabase/client';
import {
  Globe,
  Lock,
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  ArrowLeftRight,
  Search,
  Keyboard,
  X,
} from 'lucide-react';


const supabase = browserClient as any;

export interface StudyCardItem {
  id: string;
  term: string;
  definition: string;
  imageUrl?: string;
}

export interface StudySetEditorViewProps {
  initialSetId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialIsPublic?: boolean;
  initialCards?: StudyCardItem[];
  onSaved?: (setId: string) => void;
  isModal?: boolean;
  onCancel?: () => void;
}

export function StudySetEditorView({
  initialSetId,
  initialTitle = '',
  initialDescription = '',
  initialIsPublic = true,
  initialCards = [],
  onSaved,
  isModal = false,
  onCancel,
}: StudySetEditorViewProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [cards, setCards] = useState<StudyCardItem[]>(() => {
    if (initialCards && initialCards.length > 0) return initialCards;
    return [
      { id: crypto.randomUUID(), term: '', definition: '' },
      { id: crypto.randomUUID(), term: '', definition: '' },
    ];
  });
  const [saving, setSaving] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialDescription) setDescription(initialDescription);
    if (initialIsPublic !== undefined) setIsPublic(initialIsPublic);
    if (initialCards && initialCards.length > 0) setCards(initialCards);
  }, [initialTitle, initialDescription, initialIsPublic, initialCards]);

  const addCard = () => {
    setCards((prev) => [...prev, { id: crypto.randomUUID(), term: '', definition: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) {
      setCards([{ id: crypto.randomUUID(), term: '', definition: '' }]);
      return;
    }
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: keyof StudyCardItem, value: string) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSwapAll = () => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        term: card.definition,
        definition: card.term,
      }))
    );
  };

  const handleClearAll = () => {
    setCards([
      { id: crypto.randomUUID(), term: '', definition: '' },
      { id: crypto.randomUUID(), term: '', definition: '' },
    ]);
    setShowClearConfirm(false);
  };

  const handleImageUpload = (cardIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateCard(cardIndex, 'imageUrl', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportTextParse = () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n');
    const newCards: StudyCardItem[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      let term = '';
      let definition = '';

      if (line.includes('\t')) {
        const parts = line.split('\t');
        term = parts[0]?.trim() || '';
        definition = parts.slice(1).join('\t').trim() || '';
      } else if (line.includes(';')) {
        const parts = line.split(';');
        term = parts[0]?.trim() || '';
        definition = parts.slice(1).join(';').trim() || '';
      } else if (line.includes(',')) {
        const parts = line.split(',');
        term = parts[0]?.trim() || '';
        definition = parts.slice(1).join(',').trim() || '';
      } else if (line.includes('-')) {
        const parts = line.split('-');
        term = parts[0]?.trim() || '';
        definition = parts.slice(1).join('-').trim() || '';
      } else {
        term = line.trim();
      }

      if (term || definition) {
        newCards.push({ id: crypto.randomUUID(), term, definition });
      }
    }

    if (newCards.length > 0) {
      setCards((prev) => {
        const emptyFiltered = prev.filter((c) => c.term.trim() || c.definition.trim());
        return [...emptyFiltered, ...newCards];
      });
      setImportText('');
      setShowImportDialog(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Vul a.u.b. een titel in.');
      return;
    }

    const validCards = cards.filter((c) => c.term.trim() || c.definition.trim());
    if (validCards.length === 0) {
      alert('Voeg ten minste 1 kaart toe met een term of definitie.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Je moet ingelogd zijn om een set op te slaan.');
        setSaving(false);
        return;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

      let targetSetId = initialSetId;

      if (initialSetId) {
        const { error: updateError } = await supabase
          .from('study_sets')
          .update({
            title: title.trim(),
            description: description.trim(),
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialSetId);

        if (updateError) throw updateError;

        await supabase.from('flashcards').delete().eq('study_set_id', initialSetId);

        const cardInserts = validCards.map((card, idx) => ({
          study_set_id: initialSetId,
          question: card.term.trim(),
          answer: card.definition.trim(),
          number: String(idx + 1),
          order_index: idx,
          metadata: card.imageUrl ? { imageUrl: card.imageUrl } : {},
        }));

        const { error: cardError } = await supabase.from('flashcards').insert(cardInserts);
        if (cardError) throw cardError;
      } else {
        const { data: newSet, error: insertError } = await supabase
          .from('study_sets')
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            slug: slug || `set-${Date.now()}`,
            content_json: {},
            is_public: isPublic,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        targetSetId = newSet.id;

        const cardInserts = validCards.map((card, idx) => ({
          study_set_id: newSet.id,
          question: card.term.trim(),
          answer: card.definition.trim(),
          number: String(idx + 1),
          order_index: idx,
          metadata: card.imageUrl ? { imageUrl: card.imageUrl } : {},
        }));

        const { error: cardError } = await supabase.from('flashcards').insert(cardInserts);
        if (cardError) throw cardError;
      }

      if (onSaved && targetSetId) {
        onSaved(targetSetId);
      } else {
        router.push('/decks');
      }
    } catch (err: any) {
      console.error('Failed to save deck:', err);
      alert('Opslaan mislukt: ' + (err.message || 'Onbekende fout'));
    } finally {
      setSaving(false);
    }
  };

  const filteredCards = cards.filter((card) => {
    if (!cardSearchQuery.trim()) return true;
    const q = cardSearchQuery.toLowerCase();
    return card.term.toLowerCase().includes(q) || card.definition.toLowerCase().includes(q);
  });

  const content = (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 pt-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {initialSetId ? 'Kaartenset bewerken' : 'Nieuwe kaartenset maken'}
          </h1>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {isPublic ? (
              <>
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>Openbaar</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Privé</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isModal && onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Annuleren
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-lg shadow-md shadow-indigo-950/20"
          >
            {saving ? 'Opslaan...' : initialSetId ? 'Bijwerken' : 'Aanmaken'}
          </Button>
        </div>
      </div>

      {/* Set Details Inputs */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all focus-within:border-indigo-500/50">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="border-none bg-transparent text-lg font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-1"
          />
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all focus-within:border-indigo-500/50">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vul een beschrijving in.."
            rows={2}
            className="resize-none border-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-1"
          />
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/50 py-3">
        {/* Left tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="gap-1.5 text-xs font-medium border-border/70 bg-card hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Importeren
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDiagramModal(true)}
            className="gap-1.5 text-xs font-medium border-border/70 bg-card hover:bg-secondary relative"
          >
            <Plus className="h-3.5 w-3.5" />
            Diagram toevoegen
            <span className="ml-1 inline-flex items-center rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
            </span>
          </Button>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>Suggesties</span>
            <button
              type="button"
              role="switch"
              aria-checked={suggestionsEnabled}
              onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                suggestionsEnabled ? 'bg-indigo-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  suggestionsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1">
            {showSearchInput ? (
              <div className="relative flex items-center">
                <Input
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  placeholder="Zoek in kaarten..."
                  className="h-8 w-40 text-xs pl-7 pr-7 border-border bg-card"
                  autoFocus
                />
                <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <button
                  type="button"
                  onClick={() => {
                    setCardSearchQuery('');
                    setShowSearchInput(false);
                  }}
                  className="absolute right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearchInput(true)}
                title="Zoeken"
                className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSwapAll}
              title="Termen en definities omwisselen"
              className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              title="Sneltoetsen"
              className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Keyboard className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              title="Alle kaarten wissen"
              className="grid h-8 w-8 place-items-center rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards List Stack */}
      <div className="space-y-4">
        {filteredCards.map((card, index) => {
          const originalIndex = cards.findIndex((c) => c.id === card.id);
          const cardNum = originalIndex !== -1 ? originalIndex + 1 : index + 1;

          return (
            <div
              key={card.id}
              className="group rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-border"
            >
              {/* Card Row Top Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                <span className="text-sm font-semibold text-muted-foreground">{cardNum}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                    title="Slepen"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCard(originalIndex)}
                    className="text-muted-foreground/50 hover:text-red-400 transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Inputs Grid */}
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                {/* Term Box */}
                <div className="space-y-1.5">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3 min-h-[85px] transition-all focus-within:border-indigo-500/50 focus-within:bg-background">
                    <Textarea
                      value={card.term}
                      onChange={(e) => updateCard(originalIndex, 'term', e.target.value)}
                      placeholder="Vul term in"
                      rows={2}
                      className="w-full resize-none border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1">
                    TERM
                  </p>
                </div>

                {/* Definition Box */}
                <div className="space-y-1.5">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3 min-h-[85px] transition-all focus-within:border-indigo-500/50 focus-within:bg-background">
                    <Textarea
                      value={card.definition}
                      onChange={(e) => updateCard(originalIndex, 'definition', e.target.value)}
                      placeholder="Vul definitie in"
                      rows={2}
                      className="w-full resize-none border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1">
                    DEFINITIE
                  </p>
                </div>

                {/* Image Upload Area */}
                <div className="flex flex-col justify-start">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[card.id] = el;
                    }}
                    onChange={(e) => handleImageUpload(originalIndex, e)}
                  />

                  {card.imageUrl ? (
                    <div className="relative group/img h-[85px] w-[95px] rounded-lg border border-border overflow-hidden bg-background">
                      <img src={card.imageUrl} alt="Card image" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateCard(originalIndex, 'imageUrl', '')}
                        className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[card.id]?.click()}
                      className="flex h-[85px] w-[95px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/80 bg-background/30 text-muted-foreground hover:border-indigo-500/50 hover:bg-background/80 hover:text-foreground transition-all"
                    >
                      <ImageIcon className="h-5 w-5 stroke-[1.5]" />
                      <span className="text-[11px] font-medium">Afbeelding</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={addCard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/60 p-6 text-sm font-semibold text-foreground hover:border-indigo-500/60 hover:bg-card transition-all shadow-sm group"
        >
          <Plus className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Kaart toevoegen</span>
        </button>
      </div>

      {/* Import Modal */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-xl" aria-describedby={undefined}>

          <DialogHeader>
            <DialogTitle>Kaarten importeren</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Plak hier je tekst (bijv. gekopieerd uit Excel, Word of Quizlet). Gebruik tabs, komma’s of
              puntkomma’s om termen en definities te scheiden.
            </p>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Term 1\tDefinitie 1\nTerm 2\tDefinitie 2\nTerm 3;Definitie 3`}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleImportTextParse} disabled={!importText.trim()}>
              Importeren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diagram Lock Modal */}
      <Dialog open={showDiagramModal} onOpenChange={setShowDiagramModal}>
        <DialogContent className="max-w-md text-center" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex justify-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-500/20 text-amber-400 mb-2">
                <Lock className="h-6 w-6" />
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <h3 className="text-lg font-semibold">Diagrammen toevoegen</h3>
            <p className="text-xs text-muted-foreground">
              Met diagrammen kun je afbeeldingen voorzien van interactieve hotspots om te oefenen.
              Deze functie is beschikbaar voor Premium accounts.
            </p>
          </div>
          <DialogFooter className="justify-center sm:justify-center">
            <Button onClick={() => setShowDiagramModal(false)}>Begrepen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shortcuts Modal */}
      <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Handige sneltoetsen</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Volgende veld</span>
              <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Tab</kbd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Vorige veld</span>
              <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Shift + Tab</kbd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Term/Definitie omwisselen</span>
              <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Alt + S</kbd>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShortcutsModal(false)}>Sluiten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirm Modal */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>

          <DialogHeader>
            <DialogTitle>Alle kaarten wissen?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Weet je zeker dat je alle ingevulde kaarten wilt wissen? Dit kan niet ongedaan worden gemaakt.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Wissen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isModal) {
    return content;
  }

  return <AppShell>{content}</AppShell>;
}
