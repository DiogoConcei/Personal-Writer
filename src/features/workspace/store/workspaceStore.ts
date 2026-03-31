import { create } from 'zustand';
import { FileNode } from '@/tauri-bridge';

interface WorkspaceState {
  rootPath: string | null;
  files: FileNode[];
  activeFile: string | null;
  dashboardFilterPath: string | null;
  isLoading: boolean;
  
  // Actions
  setRootPath: (path: string) => Promise<void>;
  selectWorkspace: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  setActiveFile: (path: string | null) => void;
  setDashboardFilterPath: (path: string | null) => void;
  createFile: (name: string, parentPath?: string, initialContent?: string) => Promise<void>;
  createDirectory: (name: string, parentPath?: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
}

const STORAGE_KEY = 'hybrid-editor-root-path';

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: localStorage.getItem(STORAGE_KEY),
  files: [],
  activeFile: null,
  dashboardFilterPath: null,
  isLoading: false,

  setRootPath: async (path: string) => {
    localStorage.setItem(STORAGE_KEY, path);
    set({ rootPath: path, isLoading: true, dashboardFilterPath: null });
    try {
      const { createDirectory, listDirectory } = await import('@/tauri-bridge');
      const separator = path.includes('\\') ? '\\' : '/';
      const assetsPath = `${path}${separator}assets`;
      
      try {
        await createDirectory(assetsPath);
      } catch (e) {}

      const files = await listDirectory(path);
      const filteredFiles = files.filter(node => !node.name.startsWith('.'));
      const sortedFiles = filteredFiles.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
      set({ files: sortedFiles, isLoading: false });
    } catch (error) {
      console.error('Erro ao carregar workspace:', error);
      set({ files: [], isLoading: false });
    }
  },

  refreshFiles: async () => {
    const { rootPath } = get();
    if (!rootPath) return;
    
    set({ isLoading: true });
    try {
      const { listDirectory } = await import('@/tauri-bridge');
      const files = await listDirectory(rootPath);
      const filteredFiles = files.filter(node => !node.name.startsWith('.'));
      const sortedFiles = filteredFiles.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
      set({ files: sortedFiles, isLoading: false });
    } catch (error) {
      console.error('Erro ao atualizar arquivos:', error);
      set({ isLoading: false });
    }
  },

  setActiveFile: (path: string | null) => {
    set({ activeFile: path });
  },

  setDashboardFilterPath: (path: string | null) => {
    set({ dashboardFilterPath: path });
  },

  selectWorkspace: async () => {
    const { selectDirectory } = await import('@/tauri-bridge');
    const path = await selectDirectory();
    if (path) {
      const { setRootPath } = get();
      await setRootPath(path);
      set({ activeFile: null, dashboardFilterPath: null });
    }
  },

  createFile: async (name: string, parentPath?: string, initialContent: string = '') => {
    const { rootPath, refreshFiles } = get();
    const base = parentPath || rootPath;
    if (!base) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const separator = base.includes('\\') ? '\\' : '/';
    const fullPath = `${base}${separator}${fileName}`;

    try {
      const { writeFile } = await import('@/tauri-bridge');
      await writeFile(fullPath, initialContent);
      await refreshFiles();
      set({ activeFile: fullPath });
    } catch (error) {
      console.error('Erro ao criar arquivo:', error);
    }
  },

  createDirectory: async (name: string, parentPath?: string) => {
    const { rootPath, refreshFiles } = get();
    const base = parentPath || rootPath;
    if (!base) return;

    const separator = base.includes('\\') ? '\\' : '/';
    const fullPath = `${base}${separator}${name}`;

    try {
      const { createDirectory } = await import('@/tauri-bridge');
      await createDirectory(fullPath);
      await refreshFiles();
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
    }
  },

  deleteItem: async (path: string) => {
    const { activeFile, setActiveFile, refreshFiles } = get();
    try {
      const { deleteItem } = await import('@/tauri-bridge');
      await deleteItem(path);
      if (activeFile === path) setActiveFile(null);
      await refreshFiles();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
    }
  },

  renameItem: async (oldPath: string, newName: string) => {
    const { activeFile, setActiveFile, refreshFiles } = get();
    try {
      const { renameItem } = await import('@/tauri-bridge');
      const parentDir = oldPath.substring(0, oldPath.lastIndexOf(oldPath.includes('\\') ? '\\' : '/'));
      const separator = oldPath.includes('\\') ? '\\' : '/';
      
      let finalName = newName;
      if (oldPath.endsWith('.md') && !newName.endsWith('.md')) {
        finalName = `${newName}.md`;
      }
      
      const newPath = `${parentDir}${separator}${finalName}`;
      await renameItem(oldPath, newPath);
      
      if (activeFile === oldPath) setActiveFile(newPath);
      await refreshFiles();
    } catch (error) {
      console.error('Erro ao renomear item:', error);
    }
  },
}));
