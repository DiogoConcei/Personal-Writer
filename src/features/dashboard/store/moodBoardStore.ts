import { create } from 'zustand';
import { scanWorkspaceImages, ImageAsset } from '@/tauri-bridge/fs';

interface MoodBoardState {
  images: ImageAsset[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refresh: (workspaceRoot: string) => Promise<void>;
  clear: () => void;
}

export const useMoodBoardStore = create<MoodBoardState>((set) => ({
  images: [],
  isLoading: false,
  error: null,

  refresh: async (workspaceRoot) => {
    set({ isLoading: true, error: null });
    try {
      const images = await scanWorkspaceImages(workspaceRoot);
      set({ images, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clear: () => set({ images: [], isLoading: false, error: null }),
}));
