import { create } from 'zustand';
import type { Json } from '@/types/database.types';

export type WorkspaceItemType = 'map' | 'page';

export interface WorkspaceItem {
  id: string;
  user_id: string;
  name: string;
  type: WorkspaceItemType;
  parent_id: string | null;
  order_index: number;
  content: Json;
  created_at: string;
  updated_at: string;
}

interface WorkspaceState {
  items: WorkspaceItem[];
  isLoading: boolean;
  selectedId: string | null;
  expandedMaps: Set<string>;
  
  // Actions
  setItems: (items: WorkspaceItem[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedId: (id: string | null) => void;
  toggleMapExpanded: (id: string) => void;
  
  // Local persistence helpers
  loadFromLocalStorage: () => void;
  
  // Optimistic updates
  createItemOptimistic: (item: Omit<WorkspaceItem, 'id' | 'created_at' | 'updated_at'>) => string;
  updateItemOptimistic: (id: string, updates: Partial<WorkspaceItem>) => void;
  deleteItemOptimistic: (id: string) => void;
  moveItemOptimistic: (id: string, newParentId: string | null, newIndex: number) => void;
  
  // Selectors
  getChildren: (parentId: string | null) => WorkspaceItem[];
  getSelectedItem: () => WorkspaceItem | null;
  
  // Content updates
  updateContent: (id: string, content: any) => void;
}

const STORAGE_KEY = 'aether_workspace_items';

function saveLocal(items: WorkspaceItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save workspace items to localStorage', e);
    }
  }
}

function getInitialLocalItems(): WorkspaceItem[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      /* fallback */
    }
  }
  return [];
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  items: getInitialLocalItems(),
  isLoading: false,
  selectedId: null,
  expandedMaps: new Set(),

  setItems: (items) => {
    saveLocal(items);
    set({ items });
  },

  loadFromLocalStorage: () => {
    const local = getInitialLocalItems();
    if (local.length > 0) {
      set({ items: local });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedId: (id) => set({ selectedId: id }),
  
  toggleMapExpanded: (id) => {
    const expanded = new Set(get().expandedMaps);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedMaps: expanded });
  },

  createItemOptimistic: (itemData) => {
    const id = crypto.randomUUID();
    const newItem: WorkspaceItem = {
      ...itemData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updatedItems = [...get().items, newItem];
    saveLocal(updatedItems);
    set({ items: updatedItems });
    return id;
  },

  updateItemOptimistic: (id, updates) => {
    const updatedItems = get().items.map((item) =>
      item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
    );
    saveLocal(updatedItems);
    set({ items: updatedItems });
  },

  deleteItemOptimistic: (id) => {
    const deleteRecursive = (itemId: string, currentItems: WorkspaceItem[]): WorkspaceItem[] => {
      const childrenIds = new Set(currentItems.filter((i) => i.parent_id === itemId).map((i) => i.id));
      let remaining = currentItems.filter((i) => i.id !== itemId && i.parent_id !== itemId);
      for (const childId of childrenIds) {
        remaining = deleteRecursive(childId, remaining);
      }
      return remaining;
    };

    const remainingItems = deleteRecursive(id, get().items);
    saveLocal(remainingItems);
    set({
      items: remainingItems,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  moveItemOptimistic: (id, newParentId, newIndex) => {
    const state = get();
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    const updatedItems = state.items.map((i) => {
      if (i.id === id) {
        return { ...i, parent_id: newParentId, order_index: newIndex, updated_at: new Date().toISOString() };
      }
      if (i.parent_id === newParentId && i.id !== id) {
        if (i.order_index >= newIndex) {
          return { ...i, order_index: i.order_index + 1, updated_at: new Date().toISOString() };
        } else if (item.parent_id === newParentId && i.order_index < item.order_index) {
          return { ...i, order_index: i.order_index - 1, updated_at: new Date().toISOString() };
        }
      }
      return i;
    });

    saveLocal(updatedItems);
    set({ items: updatedItems });
  },

  getChildren: (parentId) => {
    const { items } = get();
    return items
      .filter((item) => item.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  getSelectedItem: () => {
    const { items, selectedId } = get();
    return items.find((item) => item.id === selectedId) || null;
  },

  updateContent: (id, content) => {
    const updatedItems = get().items.map((item) =>
      item.id === id ? { ...item, content, updated_at: new Date().toISOString() } : item
    );
    saveLocal(updatedItems);
    set({ items: updatedItems });
  },
}));
