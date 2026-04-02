import { create } from 'zustand';
import { FileNode } from '@/tauri-bridge';
import { useUniverseStore } from '@/features/universe/store/universeStore';

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
  moveItem: (sourcePath: string, targetDirPath: string) => Promise<void>;
}

const STORAGE_KEY = 'hybrid-editor-root-path';

// Função auxiliar para mover nó na árvore (Otimista)
function moveNodeInTree(nodes: FileNode[], sourcePath: string, targetDirPath: string, newPath: string): FileNode[] {
  let draggedNode: FileNode | null = null;

  // 1. Remover o nó da origem
  const removeNode = (list: FileNode[]): FileNode[] => {
    return list.filter(node => {
      if (node.path === sourcePath) {
        draggedNode = { ...node, path: newPath }; // Guardamos o nó com o novo path
        return false;
      }
      if (node.children) {
        node.children = removeNode(node.children);
      }
      return true;
    });
  };

  const newNodes = removeNode([...nodes]);

  if (!draggedNode) return nodes;

  // 2. Inserir o nó no destino
  const insertNode = (list: FileNode[]): FileNode[] => {
    // Se o destino for a raiz do workspace
    const { rootPath } = useWorkspaceStore.getState();
    const normalize = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '');
    
    if (normalize(targetDirPath) === normalize(rootPath || '')) {
      return [...list, draggedNode!].sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
    }

    return list.map(node => {
      if (node.path === targetDirPath) {
        const newChildren = [...(node.children || []), draggedNode!].sort((a, b) => {
          if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
          return a.is_dir ? -1 : 1;
        });
        return { ...node, children: newChildren };
      }
      if (node.children) {
        return { ...node, children: insertNode(node.children) };
      }
      return node;
    });
  };

  return insertNode(newNodes);
}

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

      // Indexar Universo
      useUniverseStore.getState().indexWorkspace(sortedFiles);
    } catch (error) {
      console.error('Erro ao carregar workspace:', error);
      set({ files: [], isLoading: false });
    }
  },

  refreshFiles: async () => {
    const { rootPath } = get();
    if (!rootPath) return;
    
    try {
      const { listDirectory } = await import('@/tauri-bridge');
      const files = await listDirectory(rootPath);
      const filteredFiles = files.filter(node => !node.name.startsWith('.'));
      const sortedFiles = filteredFiles.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
      set({ files: sortedFiles });

      // Re-indexar Universo (silenciosamente)
      useUniverseStore.getState().indexWorkspace(sortedFiles);
    } catch (error) {
      console.error('Erro ao atualizar arquivos:', error);
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
      
      // Remover do índice
      useUniverseStore.getState().removeEntity(path);
      
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

      // Remover o caminho antigo do índice (o refreshFiles vai indexar o novo)
      useUniverseStore.getState().removeEntity(oldPath);

      await refreshFiles();
    } catch (error) {
      console.error('Erro ao renomear item:', error);
    }
  },

  moveItem: async (sourcePath: string, targetDirPath: string) => {
    const { files, activeFile, setActiveFile, refreshFiles } = get();
    const previousFiles = JSON.parse(JSON.stringify(files)); // Deep clone para backup

    try {
      const separator = sourcePath.includes('\\') ? '\\' : '/';
      const fileName = sourcePath.substring(sourcePath.lastIndexOf(separator) + 1);
      const newPath = `${targetDirPath}${separator}${fileName}`;

      if (sourcePath === newPath) return;

      // 1. Atualização Otimista
      const updatedFiles = moveNodeInTree(files, sourcePath, targetDirPath, newPath);
      set({ files: updatedFiles });

      // 2. Execução real
      const { renameItem } = await import('@/tauri-bridge');
      await renameItem(sourcePath, newPath);
      
      if (activeFile === sourcePath) setActiveFile(newPath);

      // Remover o caminho antigo do índice
      useUniverseStore.getState().removeEntity(sourcePath);
      
      // 3. Sincronização final silenciosa
      await refreshFiles();
    } catch (error) {
      console.error('Erro ao mover item (revertendo):', error);
      set({ files: previousFiles });
    }
  },
}));

