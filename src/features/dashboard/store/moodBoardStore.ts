import { create } from 'zustand';
import { readFile, writeFile, exists } from '@/tauri-bridge/fs';

export interface MoodBoardItem {
  id: string;
  path: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

interface MoodBoardState {
  items: MoodBoardItem[];
  isLoading: boolean;
  error: string | null;

  loadBoard: (rootPath: string) => Promise<void>;
  saveBoard: (rootPath: string) => Promise<void>;
  addItem: (item: Omit<MoodBoardItem, 'id' | 'zIndex'>) => void;
  updateItem: (id: string, updates: Partial<MoodBoardItem>) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;
}

export const useMoodBoardStore = create<MoodBoardState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadBoard: async (rootPath) => {
    set({ isLoading: true, error: null });
    const configPath = `${rootPath}/moodboard.json`;
    try {
      if (await exists(configPath)) {
        const content = await readFile(configPath);
        const items = JSON.parse(content);
        set({ items, isLoading: false });
      } else {
        set({ items: [], isLoading: false });
      }
    } catch (err) {
      console.error('Erro ao carregar moodboard.json:', err);
      set({ items: [], isLoading: false });
    }
  },

  saveBoard: async (rootPath) => {
    const configPath = `${rootPath}/moodboard.json`;
    try {
      const { items } = get();
      await writeFile(configPath, JSON.stringify(items, null, 2));
    } catch (err) {
      console.error('Erro ao salvar moodboard.json:', err);
    }
  },

  addItem: (itemData) => set((state) => {
    const newItem: MoodBoardItem = {
      ...itemData,
      id: crypto.randomUUID(),
      zIndex: state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) + 1 : 1
    };
    return { items: [...state.items, newItem] };
  }),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, ...updates } : item)
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  bringToFront: (id) => set((state) => {
    const maxZ = state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) : 0;
    return {
      items: state.items.map(item => item.id === id ? { ...item, zIndex: maxZ + 1 } : item)
    };
  }),
}));
