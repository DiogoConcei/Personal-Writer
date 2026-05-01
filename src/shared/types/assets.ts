export interface PdfData {
  path: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}

export interface ImageData {
  path: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export type SplitMode = 'amount' | 'single' | 'range';

/**
 * Representa uma coleção/pasta de imagens na galeria.
 */
export interface GalleryCollection {
  id: string;
  name: string;
  images: string[];
  parentId?: string;
}

/**
 * Alvos de navegação para a Galeria Híbrida.
 */
export type GalleryNavTarget = 
  | { type: 'virtual'; id: string } 
  | { type: 'physical'; path: string } 
  | null;

/**
 * Interface para os Breadcrumbs da Galeria.
 */
export interface GalleryBreadcrumb {
  label: string;
  target: GalleryNavTarget;
}

export interface GalleryModalsState {
  itemToDelete: any | null;
  folderToDelete: string | null;
  isInputModalOpen: boolean;
  pendingCollectionImages: string[];
}

export interface GallerySelectionState {
  isSelectionMode: boolean;
  selectedPaths: string[];
}
