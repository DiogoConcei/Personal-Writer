import { create } from 'zustand';

export interface Metadata {
  [key: string]: string;
}

interface ReferenceState {
  pinnedNotes: string[]; // paths das notas fixadas
  metadata: Record<string, Metadata>; // metadados por path
  
  // Actions
  pinNote: (path: string) => void;
  unpinNote: (path: string) => void;
  updateMetadata: (path: string, data: Metadata) => void;
  clearPins: () => void;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  pinnedNotes: [],
  metadata: {},

  pinNote: (path) => set((state) => ({
    pinnedNotes: state.pinnedNotes.includes(path) 
      ? state.pinnedNotes 
      : [...state.pinnedNotes, path]
  })),

  unpinNote: (path) => set((state) => ({
    pinnedNotes: state.pinnedNotes.filter(p => p !== path)
  })),

  updateMetadata: (path, data) => set((state) => ({
    metadata: { ...state.metadata, [path]: data }
  })),

  clearPins: () => set({ pinnedNotes: [] }),
}));
