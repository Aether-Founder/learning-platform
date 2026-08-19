'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Download, Trash2, CheckCircle, Clock, AlertCircle, Hammer } from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const supabase = browserClient as any;

const flashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  source_text: z.string().optional(),
});

const flashcardsArraySchema = z.array(flashcardSchema);

type QueueItem = {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_deck_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
};

export default function AdminArtisanPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [resultJson, setResultJson] = useState('');
  const [processing, setProcessing] = useState(false);

  const stats = {
    pending: queue.filter((i) => i.status === 'pending').length,
    processing: queue.filter((i) => i.status === 'processing').length,
    completedToday: queue.filter(
      (i) =>
        i.status === 'completed' &&
        new Date(i.updated_at).toDateString() === new Date().toDateString()
    ).length,
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from('artisan_queue')
      .select(
        `
        *,
        users!user_id (email)
      `
      )
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch queue:', error);
      toast.error('Kon wachtrij niet laden');
    } else if (data) {
      setQueue(
        data.map((item: any) => ({
          ...item,
          user_email: item.users?.email,
        }))
      );
    }
    setLoading(false);
  };

  const downloadFile = async (item: QueueItem) => {
    const { data, error } = await supabase.storage
      .from('artisan-inbox')
      .createSignedUrl(item.storage_path, 60);

    if (error) {
      toast.error('Kon download link niet maken');
      return;
    }

    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = item.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download gestart');
    }
  };

  const destroyOriginal = async (item: QueueItem) => {
    setProcessing(true);

    const { error: deleteError } = await supabase.storage
      .from('artisan-inbox')
      .remove([item.storage_path]);

    if (deleteError) {
      toast.error('Kon bestand niet vernietigen');
      setProcessing(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('artisan_queue')
      .update({ status: 'processing' })
      .eq('id', item.id);

    if (updateError) {
      toast.error('Kon status niet bijwerken');
    } else {
      toast.success('Origineel vernietigd');
      await fetchQueue();
    }

    setProcessing(false);
  };

  const openResultModal = (item: QueueItem) => {
    setSelectedItem(item);
    setResultJson('');
    setShowResultModal(true);
  };

  const deliverResult = async () => {
    if (!selectedItem) return;

    setProcessing(true);

    try {
      const parsedJson = JSON.parse(resultJson);
      const validatedFlashcards = flashcardsArraySchema.parse(parsedJson);

      // Create deck
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: selectedItem.user_id,
          name: `Artisan: ${selectedItem.file_name}`,
          description: 'Automatisch gegenereerd door Artisan',
        })
        .select()
        .single();

      if (deckError) {
        toast.error('Kon deck niet aanmaken');
        setProcessing(false);
        return;
      }

      // Insert cards
      const cards = validatedFlashcards.map((card) => ({
        deck_id: deckData.id,
        front: card.front,
        back: card.back,
        source_text: card.source_text || null,
      }));

      const { error: cardsError } = await supabase.from('cards').insert(cards);

      if (cardsError) {
        toast.error('Kon kaarten niet toevoegen');
        setProcessing(false);
        return;
      }

      // Update queue
      const { error: updateError } = await supabase
        .from('artisan_queue')
        .update({
          status: 'completed',
          result_deck_id: deckData.id,
          card_count: validatedFlashcards.length,
        })
        .eq('id', selectedItem.id);

      if (updateError) {
        toast.error('Kon wachtrij niet bijwerken');
      } else {
        toast.success('Resultaat geleverd!');
        setShowResultModal(false);
        await fetchQueue();
      }
    } catch (error) {
      toast.error('Ongeldig JSON formaat. Controleer de structuur.');
    }

    setProcessing(false);
  };

  const markAsFailed = async (item: QueueItem) => {
    setProcessing(true);

    const { error } = await supabase
      .from('artisan_queue')
      .update({ status: 'failed' })
      .eq('id', item.id);

    if (error) {
      toast.error('Kon status niet bijwerken');
    } else {
      toast.success('Gemarkeerd als mislukt');
      await fetchQueue();
    }

    setProcessing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}u ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Admin" title="De Werkplaats" description="Artisan wachtrij beheer" />

      <div className="mt-10 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">In Wachtrij</span>
            </div>
            <p className="font-display text-2xl font-semibold">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <Hammer className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">In Behandeling</span>
            </div>
            <p className="font-display text-2xl font-semibold">{stats.processing}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Vandaag Voltooid</span>
            </div>
            <p className="font-display text-2xl font-semibold">{stats.completedToday}</p>
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Wachtrij is leeg</h2>
            <p className="text-sm text-muted-foreground">Geen items om te verwerken.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Gebruiker</th>
                  <th className="text-left p-4 text-sm font-medium">Bestand</th>
                  <th className="text-left p-4 text-sm font-medium">Grootte</th>
                  <th className="text-left p-4 text-sm font-medium">Tijd</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-right p-4 text-sm font-medium">Acties</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-4">
                      <div className="text-sm font-medium">{item.user_email || 'Onbekend'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{item.file_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(item.file_size_bytes)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {getTimeElapsed(item.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : item.status === 'processing'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {item.status === 'pending'
                          ? 'Wachtend'
                          : item.status === 'processing'
                            ? 'In Behandeling'
                            : item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(item)}
                          title="Download lokaal"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => destroyOriginal(item)}
                          disabled={processing}
                          title="Vernietig origineel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openResultModal(item)}
                          title="Lever resultaat"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsFailed(item)}
                          disabled={processing}
                          title="Markeer als mislukt"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultaat Leveren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Plaatst JSON met flashcards of upload een .json bestand:
              </p>
              <Textarea
                value={resultJson}
                onChange={(e) => setResultJson(e.target.value)}
                placeholder={`[
  {
    "front": "Vraag 1",
    "back": "Antwoord 1",
    "source_text": "Optionele bron"
  },
  {
    "front": "Vraag 2",
    "back": "Antwoord 2"
  }
]`}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              JSON moet een array zijn van objecten met "front", "back", en optioneel "source_text"
              velden.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultModal(false)}>
              Annuleren
            </Button>
            <Button onClick={deliverResult} disabled={processing || !resultJson.trim()}>
              {processing ? 'Leveren...' : 'Leveren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
