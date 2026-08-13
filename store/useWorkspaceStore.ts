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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  items: [],
  isLoading: true,
  selectedId: null,
  expandedMaps: new Set(),

  setItems: (items) => set({ items }),
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
    set((state) => ({ items: [...state.items, newItem] }));
    return id;
  },

  updateItemOptimistic: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      ),
    }));
  },

  deleteItemOptimistic: (id) => {
    // Recursively delete children
    const deleteRecursive = (itemId: string, items: WorkspaceItem[]): WorkspaceItem[] => {
      const children = items.filter((i) => i.parent_id === itemId);
      const remaining = items.filter((i) => i.id !== itemId && i.parent_id !== itemId);
      return children.flatMap((child) => deleteRecursive(child.id, remaining));
    };
    
    set((state) => ({
      items: deleteRecursive(id, state.items),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  moveItemOptimistic: (id, newParentId, newIndex) => {
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (!item) return state;

      // Update the moved item
      const updatedItems = state.items.map((i) => {
        if (i.id === id) {
          return { ...i, parent_id: newParentId, order_index: newIndex, updated_at: new Date().toISOString() };
        }
        // Adjust indices of siblings
        if (i.parent_id === newParentId && i.id !== id) {
          if (i.order_index >= newIndex) {
            return { ...i, order_index: i.order_index + 1, updated_at: new Date().toISOString() };
          } else if (item.parent_id === newParentId && i.order_index < item.order_index) {
            return { ...i, order_index: i.order_index - 1, updated_at: new Date().toISOString() };
          }
        }
        return i;
      });

      return { items: updatedItems };
    });
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
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, content, updated_at: new Date().toISOString() } : item
      ),
    }));
  },
}));
