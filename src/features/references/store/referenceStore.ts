import { create } from 'zustand';
import { PdfAsset, scanWorkspacePdfs } from '../../../tauri-bridge';

export interface Metadata {
  [key: string]: string;
}

interface ReferenceState {
  pinnedNotes: string[]; // paths das notas fixadas
  metadata: Record<string, Metadata>; // metadados por path
  
  // PDF Library state
  pdfs: PdfAsset[];
  activePdfPath: string | null;
  isLoadingPdfs: boolean;

  // Actions
  pinNote: (path: string) => void;
  unpinNote: (path: string) => void;
  updateMetadata: (path: string, data: Metadata) => void;
  clearPins: () => void;

  // PDF Actions
  fetchPdfs: (workspaceRoot: string) => Promise<void>;
  setActivePdf: (path: string | null) => void;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  pinnedNotes: [],
  metadata: {},
  pdfs: [],
  activePdfPath: null,
  isLoadingPdfs: false,

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

  fetchPdfs: async (workspaceRoot) => {
    set({ isLoadingPdfs: true });
    try {
      const pdfs = await scanWorkspacePdfs(workspaceRoot);
      set({ pdfs, isLoadingPdfs: false });
    } catch (error) {
      console.error('Erro ao buscar PDFs:', error);
      set({ isLoadingPdfs: false });
    }
  },

  setActivePdf: (path) => set({ activePdfPath: path }),
}));
