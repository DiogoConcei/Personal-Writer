import { FileNode, ImageAsset, PdfAsset } from '@/tauri-bridge';

/**
 * Estado da Store de Workspace (File System e Root Path).
 */
export interface WorkspaceState {
  rootPath: string | null;
  files: FileNode[];
  activeFile: string | null;
  dashboardFilterPath: string | null;
  isLoading: boolean;
  isPathInvalid: boolean;
  cachedImages: ImageAsset[] | null;
  cachedPdfs: PdfAsset[] | null;
  isScanning: boolean;

  setRootPath: (path: string) => Promise<void>;
  validateWorkspace: () => Promise<void>;
  selectWorkspace: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  fetchChildren: (path: string) => Promise<void>;
  syncNode: (path: string) => Promise<void>;
  setActiveFile: (path: string | null) => void;
  setDashboardFilterPath: (path: string | null) => void;
  createFile: (name: string, parentPath?: string, initialContent?: string) => Promise<void>;
  createDirectory: (name: string, parentPath?: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  moveItem: (sourcePath: string, targetDirPath: string) => Promise<void>;
  scanWorkspace: () => Promise<void>;
  scanImages: () => Promise<void>;
  scanPdfs: () => Promise<void>;
  invalidateImageCache: () => void;
  invalidatePdfCache: () => void;
}
