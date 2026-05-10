import { CutPatch } from './canvas';

export interface PdfData {
  path: string;
  startPage: number;
  endPage: number;
  totalPages: number;
  patches?: CutPatch[];
}

export interface ImageData {
  path: string;
  naturalWidth?: number;
  naturalHeight?: number;
  isPending?: boolean; // Indica que o recorte está sendo carregado
  progress?: number;   // Progresso de 0 a 100
  patches?: CutPatch[];
}

export type SplitMode = 'amount' | 'single' | 'range';

export type GallerySection = 'geral' | 'collages' | 'editions';

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
