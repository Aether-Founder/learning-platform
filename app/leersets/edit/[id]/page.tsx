'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudySetEditorView, type StudyCardItem } from '@/components/StudySetEditorView';
import { supabase as browserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/AppShell';

const supabase = browserClient as any;

export default function EditLeersetPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [setIsPublic, setSetIsPublic] = useState(true);
  const [cards, setCards] = useState<StudyCardItem[]>([]);

  useEffect(() => {
    if (!setId) return;

    async function loadDeck() {
      try {
        const { data: set, error: setError } = await supabase
          .from('study_sets')
          .select('*')
          .eq('id', setId)
          .single();

        if (setError || !set) {
          console.error('Failed to load set:', setError);
          router.push('/leersets');
          return;
        }

        setSetTitle(set.title || '');
        setSetDescription(set.description || '');
        setSetIsPublic(set.is_public ?? true);

        const { data: cardData, error: cardError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('study_set_id', setId)
          .order('order_index', { ascending: true });

        if (cardError) {
          console.error('Failed to load cards:', cardError);
        } else if (cardData) {
          setCards(
            cardData.map((c: any) => ({
              id: c.id,
              term: c.question || '',
              definition: c.answer || '',
              imageUrl: c.metadata?.imageUrl,
            }))
          );
        }
      } catch (err) {
        console.error('Error loading deck:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDeck();
  }, [setId, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-muted-foreground">Leerset laden...</div>
      </AppShell>
    );
  }

  return (
    <StudySetEditorView
      initialSetId={setId}
      initialTitle={setTitle}
      initialDescription={setDescription}
      initialIsPublic={setIsPublic}
      initialCards={cards}
    />
  );
}
