export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  modified_at: number;

  hasVirtualImages?: boolean;
  virtualImagesPath?: string;
  isVirtual?: boolean;
}
