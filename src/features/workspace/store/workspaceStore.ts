import { create } from 'zustand';
import { FileNode } from '@/tauri-bridge';
import { WorkspaceState } from '@/shared/types';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { normalizePath, getSeparator, getParentPath } from '@/shared/utils/path';

const STORAGE_KEY = 'hybrid-editor-root-path';
const HIDDEN_ITEMS = ['assets', 'docs', 'murais', 'mesa.json', 'moodboard.json'];

function updatePathsRecursively(node: FileNode, newPath: string): FileNode {
  const separator = getSeparator(newPath);
  const updatedNode = { ...node, path: newPath };

  if (updatedNode.children) {
    updatedNode.children = updatedNode.children.map(child => {
      const childNewPath = `${newPath}${separator}${child.name}`;
      return updatePathsRecursively(child, childNewPath);
    });
  }

  return updatedNode;
}

function moveNodeInTree(nodes: FileNode[], sourcePath: string, targetDirPath: string, newPath: string): FileNode[] {
  let draggedNode: FileNode | null = null;

  const removeNode = (list: FileNode[]): FileNode[] => {
    return list.reduce((acc: FileNode[], node) => {
      if (node.path === sourcePath) {
        draggedNode = updatePathsRecursively(node, newPath);
        return acc;
      }
      if (node.children) {
        const newChildren = removeNode(node.children);
        acc.push({ ...node, children: newChildren });
      } else {
        acc.push(node);
      }
      return acc;
    }, []);
  };

  const newNodes = removeNode([...nodes]);

  if (!draggedNode) return nodes;

  const insertNode = (list: FileNode[]): FileNode[] => {
    const { rootPath } = useWorkspaceStore.getState();

    if (normalizePath(targetDirPath) === normalizePath(rootPath || '')) {
      return [...list, draggedNode!].sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return a.is_dir ? -1 : 1;
      });
    }

    return list.map(node => {
      if (node.path === targetDirPath) {
        const currentChildren = node.children || [];

        const filteredChildren = currentChildren.filter(c => c.path !== newPath);
        const newChildren = [...filteredChildren, draggedNode!].sort((a, b) => {
          if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
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

function injectChildren(nodes: FileNode[], targetPath: string, children: FileNode[]): FileNode[] {
  return nodes.map(node => {
    if (node.path === targetPath) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: injectChildren(node.children, targetPath, children) };
    }
    return node;
  });
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: localStorage.getItem(STORAGE_KEY),
  files: [],
  activeFile: null,
  dashboardFilterPath: null,
  isLoading: false,
  isPathInvalid: false,
  cachedImages: null,
  cachedPdfs: null,
  isScanning: false,

  scanImages: async () => {
    const { rootPath, cachedImages } = get();
    if (!rootPath || cachedImages !== null) return;

    set({ isScanning: true });
    try {
      const { scanWorkspaceImages } = await import('@/tauri-bridge');
      const images = await scanWorkspaceImages(rootPath);
      set({ cachedImages: images });
    } catch (error) {
      console.error('Erro ao escanear imagens:', error);
      set({ cachedImages: [] });
    } finally {
      set({ isScanning: false });
    }
  },

  scanPdfs: async () => {
    const { rootPath, cachedPdfs } = get();
    if (!rootPath || cachedPdfs !== null) return;

    set({ isScanning: true });
    try {
      const { scanWorkspacePdfs } = await import('@/tauri-bridge');
      const pdfs = await scanWorkspacePdfs(rootPath);
      set({ cachedPdfs: pdfs });
    } catch (error) {
      console.error('Erro ao escanear PDFs:', error);
      set({ cachedPdfs: [] });
    } finally {
      set({ isScanning: false });
    }
  },

  invalidateImageCache: () => {
    set({ cachedImages: null });
  },

  invalidatePdfCache: () => {
    set({ cachedPdfs: null });
  },

  setRootPath: async (path: string) => {
    localStorage.setItem(STORAGE_KEY, path);
    set({ rootPath: path, isLoading: true, dashboardFilterPath: null, isPathInvalid: false, cachedImages: null, cachedPdfs: null });
    try {
      const { createDirectory, listDirectory, exists } = await import('@/tauri-bridge');

      const pathExists = await exists(path);
      if (!pathExists) {
        set({ isPathInvalid: true, isLoading: false, files: [] });
        return;
      }

      const separator = getSeparator(path);
      const assetsPath = `${path}${separator}assets`;

      try {
        await createDirectory(assetsPath);
      } catch (e) {}

      const files = await listDirectory(path);
      const filteredFiles = files.filter(node =>
        !node.name.startsWith('.') &&
        !HIDDEN_ITEMS.includes(node.name.toLowerCase())
      );
      const sortedFiles = filteredFiles.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return a.is_dir ? -1 : 1;
      });

      set({ files: sortedFiles, isLoading: false });
      useUniverseStore.getState().indexWorkspace(sortedFiles);
    } catch (error) {
      console.error('Erro ao carregar workspace:', error);
      set({ files: [], isLoading: false });
    }
  },

  validateWorkspace: async () => {
    const { rootPath } = get();
    if (!rootPath) return;

    try {
      const { exists } = await import('@/tauri-bridge');
      const pathExists = await exists(rootPath);
      if (!pathExists) {
        set({ isPathInvalid: true, files: [] });
      } else {
        set({ isPathInvalid: false });
        if (get().files.length === 0) await get().setRootPath(rootPath);
      }
    } catch (error) {
      console.error('Erro ao validar workspace:', error);
      set({ isPathInvalid: true });
    }
  },

  refreshFiles: async () => {
    const { rootPath, files } = get();
    if (!rootPath) return;

    try {
      const { listDirectory } = await import('@/tauri-bridge');
      const rootFiles = await listDirectory(rootPath);
      const filteredFiles = rootFiles.filter(node =>
        !node.name.startsWith('.') &&
        !HIDDEN_ITEMS.includes(node.name.toLowerCase())
      );

      const preserveChildren = (newList: FileNode[], oldList: FileNode[]): FileNode[] => {
        return newList.map(newNode => {
          const oldNode = oldList.find(o => o.path === newNode.path);
          if (oldNode && oldNode.children) {
            return { ...newNode, children: preserveChildren(newNode.children || [], oldNode.children) };
          }
          return newNode;
        }).sort((a, b) => {
          if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          return a.is_dir ? -1 : 1;
        });
      };

      const finalFiles = preserveChildren(filteredFiles, files);
      set({ files: finalFiles });
      useUniverseStore.getState().indexWorkspace(finalFiles);
    } catch (error) {
      console.error('Erro ao atualizar arquivos:', error);
    }
  },

  fetchChildren: async (path: string) => {
    const { files } = get();
    try {
      const { listDirectory } = await import('@/tauri-bridge');
      const children = await listDirectory(path);
      const sortedChildren = children.filter(n =>
        !n.name.startsWith('.') &&
        !HIDDEN_ITEMS.includes(n.name.toLowerCase())
      ).sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return a.is_dir ? -1 : 1;
      });

      const updatedFiles = injectChildren(files, path, sortedChildren);
      set({ files: updatedFiles });
    } catch (error) {
      console.error('Erro ao carregar filhos:', error);
    }
  },

  syncNode: async (path: string) => {
    const { rootPath } = get();

    if (normalizePath(path) === normalizePath(rootPath || '')) {
      await get().refreshFiles();
    } else {
      await get().fetchChildren(path);
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
    const { rootPath, syncNode } = get();
    const base = parentPath || rootPath;
    if (!base) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const separator = getSeparator(base);
    const filePath = `${base}${separator}${fileName}`;

    try {
      const { writeFile } = await import('@/tauri-bridge');
      await writeFile(filePath, initialContent);
      await syncNode(base);
      set({ activeFile: filePath });
    } catch (error) {
      console.error('Erro ao criar arquivo:', error);
    }
  },

  createDirectory: async (name: string, parentPath?: string) => {
    const { rootPath, syncNode } = get();
    const base = parentPath || rootPath;
    if (!base) return;

    const separator = getSeparator(base);
    const dirPath = `${base}${separator}${name}`;

    try {
      const { createDirectory } = await import('@/tauri-bridge');
      await createDirectory(dirPath);
      await syncNode(base);
    } catch (error) {
      console.error('Erro ao criar diretório:', error);
    }
  },

  deleteItem: async (path: string) => {
    const { rootPath, syncNode, activeFile, setActiveFile } = get();
    try {
      const parentPath = getParentPath(path, rootPath);

      const { deleteItem } = await import('@/tauri-bridge');
      await deleteItem(path);
      if (activeFile === path) setActiveFile(null);

      useUniverseStore.getState().removeEntity(path);
      get().invalidateImageCache();
      if (parentPath) await syncNode(parentPath);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
    }
  },

  renameItem: async (oldPath: string, newName: string) => {
    const { rootPath, syncNode, activeFile, setActiveFile } = get();
    try {
      const parentPath = getParentPath(oldPath, rootPath);

      const { renameItem } = await import('@/tauri-bridge');
      let finalName = newName.endsWith('.md') || !oldPath.endsWith('.md') ? newName : `${newName}.md`;
      const separator = getSeparator(oldPath);
      const newPath = `${parentPath}${separator}${finalName}`;

      await renameItem(oldPath, newPath);
      if (activeFile === oldPath) setActiveFile(newPath);

      useUniverseStore.getState().removeEntity(oldPath);
      get().invalidateImageCache();
      if (parentPath) await syncNode(parentPath);
    } catch (error) {
      console.error('Erro ao renomear item:', error);
    }
  },

  moveItem: async (sourcePath: string, targetDirPath: string) => {
    const { rootPath, files, activeFile, setActiveFile, syncNode } = get();
    const previousFiles = JSON.parse(JSON.stringify(files));

    try {
      const separator = getSeparator(sourcePath);
      const fileName = sourcePath.substring(sourcePath.lastIndexOf(separator) + 1);
      const newPath = `${targetDirPath}${separator}${fileName}`;

      if (sourcePath === newPath) return;

      const sourceParentPath = getParentPath(sourcePath, rootPath);

      const updatedFiles = moveNodeInTree(files, sourcePath, targetDirPath, newPath);
      set({ files: updatedFiles });

      const { renameItem } = await import('@/tauri-bridge');
      await renameItem(sourcePath, newPath);

      if (activeFile === sourcePath) {
        setActiveFile(newPath);
      } else if (activeFile && activeFile.startsWith(sourcePath + separator)) {
        const relativePart = activeFile.substring(sourcePath.length);
        setActiveFile(`${newPath}${relativePart}`);
      }

      useUniverseStore.getState().removeEntity(sourcePath);
      get().invalidateImageCache();

      await new Promise(resolve => setTimeout(resolve, 100));

      if (sourceParentPath) await syncNode(sourceParentPath);
      await syncNode(targetDirPath);

    } catch (error) {
      console.error('Erro ao mover item (revertendo):', error);
      set({ files: previousFiles });
    }
  },

  scanWorkspace: async () => {
    await get().refreshFiles();
  }
}));
