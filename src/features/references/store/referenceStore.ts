import { create } from 'zustand';
import { scanWorkspacePdfs, copyFileToWorkspace, deleteItem } from '../../../tauri-bridge';
import { ReferenceState, PdfAsset } from '@/shared/types';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { open } from '@tauri-apps/plugin-dialog';

export const useReferenceStore = create<ReferenceState>((set, get) => ({
  pinnedNotes: [],
  metadata: {},
  pdfs: [],
  activePdfPath: null,
  isLoadingPdfs: false,
  referenceTab: 'backlinks',

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

  setReferenceTab: (tab) => set({ referenceTab: tab }),

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

  handleUpload: async (externalPaths?: string[]) => {
    const rootPath = useWorkspaceStore.getState().rootPath;
    const addNotification = useUIStore.getState().addNotification;
    
    if (!rootPath) return [];
    
    try {
      let pathsToImport: string[] = [];

      if (externalPaths && externalPaths.length > 0) {
        pathsToImport = externalPaths;
      } else {
        const selected = await open({
          multiple: true,
          filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
        });
        if (selected) {
          pathsToImport = Array.isArray(selected) ? selected : [selected];
        }
      }

      if (pathsToImport.length === 0) return [];

      set({ isLoadingPdfs: true });
      const importedPaths: string[] = [];
      for (const path of pathsToImport) {
        const relPath = await copyFileToWorkspace(path, rootPath, 'docs');
        importedPaths.push(relPath);
      }
      
      addNotification(`${pathsToImport.length} documento(s) importado(s)`, 'success');
      await get().fetchPdfs(rootPath);
      return importedPaths;
    } catch (err) {
      console.error('[referenceStore] Erro no upload:', err);
      addNotification('Erro ao importar documentos', 'error');
      set({ isLoadingPdfs: false });
      return [];
    }
  },

  handleDelete: async (pdf: PdfAsset) => {
    const rootPath = useWorkspaceStore.getState().rootPath;
    const addNotification = useUIStore.getState().addNotification;
    
    try {
      await deleteItem(pdf.full_path);
      addNotification('Documento excluído com sucesso', 'success');
      if (rootPath) {
        await get().fetchPdfs(rootPath);
      }
      return true;
    } catch (err) {
      console.error('[referenceStore] Erro ao excluir PDF:', err);
      addNotification('Erro ao excluir documento', 'error');
      return false;
    }
  },
}));
