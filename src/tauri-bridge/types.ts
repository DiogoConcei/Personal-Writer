export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  modified_at: number; // Unix timestamp em segundos
  
  // Virtual mirroring
  hasVirtualImages?: boolean;
  virtualImagesPath?: string;
  isVirtual?: boolean;
}
