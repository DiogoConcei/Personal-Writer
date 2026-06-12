import { CutPatch } from './canvas';

export interface ImageAsset {
  name: string;
  path: string;
  full_path: string;
  modified_at: number;
  width: number;
  height: number;
}

export interface PdfAsset {
  name: string;
  path: string;
  full_path: string;
  modified_at: number;
}

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
  isCrop?: boolean; // Indica se é uma imagem originada de um recorte/colagem
}

export type SplitMode = 'amount' | 'single' | 'range';

export type GallerySection = 'geral' | 'collages' | 'editions';

/**
 * Item genérico para exibição na galeria (Imagem, PDF ou Coleção).
 */
export type GalleryItem =
  | { type: 'collection'; data: GalleryCollection }
  | { type: 'image'; data: ImageAsset }
  | { type: 'pdf'; data: PdfAsset };

/**
 * Props para o componente VirtualMasonry.
 */
export interface VirtualMasonryProps<T> {
  items: T[];
  columnWidth: number;
  gap: number;
  renderItem: (item: T, style: React.CSSProperties, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
  getItemHeight: (item: T, actualWidth: number) => number;
  buffer?: number;
}

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
  itemToDelete: ImageAsset | null;
  folderToDelete: string | null;
  isInputModalOpen: boolean;
  pendingCollectionImages: string[];
}

export interface GallerySelectionState {
  isSelectionMode: boolean;
  selectedPaths: string[];
}

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export interface SectionTabsProps {
  activeSection: GallerySection;
  onSectionChange: (section: GallerySection) => void;
}

/**
 * União de tipos de assets suportados pela galeria unificada.
 */
export type MediaAsset = ImageAsset | PdfAsset;

export interface AssetGalleryProps {
  pickerMode?: boolean;
  onSelect?: (path: string) => void;
  onClose?: () => void;
  disableOrganization?: boolean;
  assetType?: 'image' | 'pdf' | 'all';
}

export interface ImageViewerProps {
  path: string;
  onBack?: () => void;
}

export interface PdfThumbnailProps {
  fileUrl: string;
  width?: number;
  pageNumber?: number;
  onLoadSuccess?: (data: { numPages: number }) => void;
}

/**
 * Estado da Store de Galeria (Asset Gallery).
 */
export interface GalleryState {
  collections: GalleryCollection[];
  isLoading: boolean;

  loadCollections: () => Promise<void>;
  saveCollections: () => Promise<void>;
  createCollection: (name: string, images: string[], parentId?: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<GalleryCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (id: string, imagePaths: string[]) => Promise<void>;
  removeFromCollection: (id: string, imagePath: string) => Promise<void>;
  registerCollage: (imagePath: string) => Promise<void>;
}
