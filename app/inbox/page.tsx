'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Trash2, Inbox as InboxIcon } from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type InboxItem = {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inbox')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch items:', error);
    } else if (data) {
      setItems(data);
    }
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inbox')
      .insert({
        user_id: user.id,
        content: newItem.trim(),
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add item:', error);
    } else if (data) {
      setItems([data, ...items]);
      setNewItem('');
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('inbox').update({ completed: !completed }).eq('id', id);

    if (error) {
      console.error('Failed to update item:', error);
    } else {
      setItems(items.map((item) => (item.id === id ? { ...item, completed: !completed } : item)));
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('inbox').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete item:', error);
    } else {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const activeItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inbox"
        title="Inbox"
        description="Snel notities, taken en herinneringen"
      />

      <div className="mt-10 max-w-3xl mx-auto">
        {/* Add New Item */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
          className="flex gap-2 mb-8"
        >
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nieuwe taak, notitie of herinnering..."
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" />
            Toevoegen
          </Button>
        </form>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <InboxIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Inbox is leeg</h2>
            <p className="text-sm text-muted-foreground">
              Voeg je eerste taak, notitie of herinnering toe hierboven.
            </p>
          </div>
        ) : (
          <>
            {/* Active Items */}
            {activeItems.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-lg font-semibold mb-4">
                  Actief ({activeItems.length})
                </h2>
                <div className="space-y-3">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-foreground/20 transition-colors"
                    >
                      <button
                        onClick={() => toggleComplete(item.id, item.completed)}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-foreground/20 hover:border-foreground/40 flex items-center justify-center transition-colors"
                      >
                        {item.completed && <Check className="h-3 w-3" />}
                      </button>
                      <p className="flex-1 text-sm">{item.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">
                  Voltooid ({completedItems.length})
                </h2>
                <div className="space-y-3">
                  {completedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={() => toggleComplete(item.id, item.completed)}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-foreground/20 hover:border-foreground/40 flex items-center justify-center transition-colors bg-primary/10 border-primary"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <p className="flex-1 text-sm line-through text-muted-foreground">
                        {item.content}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
