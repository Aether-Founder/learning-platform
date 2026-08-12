'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useWorkspaceStore, type WorkspaceItem } from '@/store/useWorkspaceStore';
import { Folder, FileText, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '@/lib/i18n';

const supabase = browserClient as any;

function TreeItem({ item, level = 0 }: { item: WorkspaceItem; level?: number }) {
  const { t } = useTranslation();
  const { getChildren, toggleMapExpanded, expandedMaps, setSelectedId, selectedId } = useWorkspaceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const children = getChildren(item.id);
  const isExpanded = expandedMaps.has(item.id);
  const isSelected = selectedId === item.id;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: { item },
  });

  const handleRename = async () => {
    if (editName.trim() && editName !== item.name) {
      // Optimistic update
      useWorkspaceStore.getState().updateItemOptimistic(item.id, { name: editName.trim() });
      
      // Sync to DB
      await supabase
        .from('workspace_items')
        .update({ name: editName.trim(), updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(t('notes_delete_confirm', undefined, { name: item.name }))) {
      useWorkspaceStore.getState().deleteItemOptimistic(item.id);
      await supabase.from('workspace_items').delete().eq('id', item.id);
    }
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    paddingLeft: `${level * 16 + 8}px`,
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        {...listeners}
        {...attributes}
        onClick={() => {
          if (item.type === 'map') {
            toggleMapExpanded(item.id);
          } else {
            setSelectedId(item.id);
          }
        }}
        onDoubleClick={() => setIsEditing(true)}
        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary ${
          isSelected ? 'bg-secondary font-medium' : 'text-muted-foreground'
        }`}
      >
        {item.type === 'map' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          </>
        ) : (
          <>
            <span className="h-4 w-4 shrink-0" />
            <FileText className="h-4 w-4 shrink-0 text-gray-500" />
          </>
        )}

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditName(item.name);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 rounded border border-border bg-background px-1 text-sm outline-none focus:border-foreground"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{item.name}</span>
        )}

        <div className="hidden items-center gap-1 group-hover:flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-background/50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {item.type === 'map' && isExpanded && (
        <div className="border-l border-border ml-4">
          {children.map((child) => (
            <TreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const { getChildren, setItems, setLoading, setSelectedId, createItemOptimistic } = useWorkspaceStore();
  const rootItems = getChildren(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workspace_items')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to fetch workspace:', error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchWorkspace();
  }, [supabase, setItems, setLoading]);

  const handleCreateMap = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newItem = {
      user_id: user.id,
      name: t('notes_new_folder'),
      type: 'map' as const,
      parent_id: null,
      order_index: rootItems.length,
      content: {},
    };

    const tempId = createItemOptimistic(newItem);

    const { data, error } = await supabase
      .from('workspace_items')
      .insert(newItem)
      .select()
      .single();

    if (error) {
      useWorkspaceStore.getState().deleteItemOptimistic(tempId);
      console.error('Failed to create map:', error);
    } else if (data) {
      // Replace temp ID with real ID
      useWorkspaceStore.getState().deleteItemOptimistic(tempId);
      setItems([...useWorkspaceStore.getState().items.filter((i) => i.id !== tempId), data]);
    }
  };

  const handleCreatePage = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newItem = {
      user_id: user.id,
      name: t('notes_new_page'),
      type: 'page' as const,
      parent_id: null,
      order_index: rootItems.length,
      content: { type: 'doc', content: [] },
    };

    const tempId = createItemOptimistic(newItem);
    setSelectedId(tempId);

    const { data, error } = await supabase
      .from('workspace_items')
      .insert(newItem)
      .select()
      .single();

    if (error) {
      useWorkspaceStore.getState().deleteItemOptimistic(tempId);
      console.error('Failed to create page:', error);
    } else if (data) {
      useWorkspaceStore.getState().deleteItemOptimistic(tempId);
      setItems([...useWorkspaceStore.getState().items.filter((i) => i.id !== tempId), data]);
      setSelectedId(data.id);
    }
  };

  return (
    <aside className="w-64 border-r border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('notes_sidebar')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={handleCreateMap}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            title={t('notes_new_folder')}
          >
            <Folder className="h-4 w-4" />
          </button>
          <button
            onClick={handleCreatePage}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            title={t('notes_new_page')}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DndContext
        onDragEnd={({ active, over }) => {
          if (!over) return;
          const draggedItem = active.data.current?.item as WorkspaceItem | undefined;
          const targetItem = over.data.current?.item as WorkspaceItem | undefined;

          if (draggedItem && targetItem && targetItem.type === 'map') {
            // Move item into target map
            const siblings = getChildren(targetItem.id);
            const newIndex = siblings.length;
            
            useWorkspaceStore.getState().moveItemOptimistic(draggedItem.id, targetItem.id, newIndex);
            
            supabase
              .from('workspace_items')
              .update({
                parent_id: targetItem.id,
                order_index: newIndex,
                updated_at: new Date().toISOString(),
              })
              .eq('id', draggedItem.id);
          }
        }}
      >
        <div className="space-y-1">
          {rootItems.map((item) => (
            <TreeItem key={item.id} item={item} />
          ))}
        </div>
      </DndContext>
    </aside>
  );
}

function EditorPanel() {
  const { t } = useTranslation();
  const { getSelectedItem } = useWorkspaceStore();
  const item = getSelectedItem();

  if (!item) {
    return (
      <main className="flex-1 grid place-items-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">{t('notes_select_page')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-semibold mb-6">{item.name}</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">{t('notes_editor_placeholder')}</p>
        </div>
      </div>
    </main>
  );
}

export default function NotitiesPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('notes_eyebrow')}
        title={t('notes_title')}
        description={t('notes_description')}
      />

      <div className="flex h-[calc(100vh-280px)] min-h-[500px] border border-border rounded-lg overflow-hidden">
        <Sidebar />
        <EditorPanel />
      </div>
    </AppShell>
  );
}
