import { create } from 'zustand';
import { readFile, writeFile } from '@/tauri-bridge';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type Typography = 'sans' | 'serif';

interface EditorState {
  content: string;
  lastSavedContent: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  typography: Typography;
  wordCount: number;
  
  // Actions
  loadContent: (path: string) => Promise<void>;
  setContent: (content: string) => void;
  save: (path: string) => Promise<void>;
  setTypography: (typography: Typography) => void;
  setWordCount: (count: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  lastSavedContent: '',
  saveStatus: 'idle',
  lastSavedAt: null,
  typography: 'sans',
  wordCount: 0,

  loadContent: async (path: string) => {
    set({ saveStatus: 'idle' });
    try {
      const content = await readFile(path);
      set({ 
        content, 
        lastSavedContent: content,
        saveStatus: 'idle',
        lastSavedAt: new Date() 
      });
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      set({ saveStatus: 'error' });
    }
  },

  setContent: (content: string) => {
    set({ content });
  },

  save: async (path: string) => {
    const { content } = get();
    set({ saveStatus: 'saving' });
    
    try {
      await writeFile(path, content);
      set({ 
        saveStatus: 'saved', 
        lastSavedAt: new Date(),
        lastSavedContent: content 
      });
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      set({ saveStatus: 'error' });
    }
  },

  setTypography: (typography: Typography) => {
    set({ typography });
  },

  setWordCount: (count: number) => {
    set({ count });
  },
}));
