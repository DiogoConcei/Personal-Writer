import { ReactNode } from 'react';
import { ImageAsset, GalleryBreadcrumb, GalleryNavTarget } from './assets';

export interface DocumentModalProps {
  documents: string[];
  onClose: () => void;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  onAddMore?: () => void;
}

export interface ImageGalleryProps {
  onSelect: (src: string) => void;
  onClose: () => void;
  disableOrganization?: boolean;
  largeModal?: boolean;
}

export interface GalleryDragGhostProps {
  draggedItem: ImageAsset | null;
  dragPosition: { x: number; y: number };
  rootPath: string | null;
  selectedCount: number;
  dropTargetLabel: string | null;
}

export interface GalleryHeaderProps {
  breadcrumbs: GalleryBreadcrumb[];
  activeTarget: GalleryNavTarget;
  isSelectionMode: boolean;
  isScanning: boolean;
  isProcessing: boolean;
  disableOrganization: boolean;
  onTargetClick: (target: GalleryNavTarget, callback?: () => void) => void;
  onToggleSelectionMode: () => void;
  onOpenInputModal: () => void;
  onRefresh: () => void;
  onUpload: () => void;
  onClose: () => void;
}

export interface GalleryItemProps {
  type: 'image' | 'folder' | 'collection';
  id: string;
  label: string;
  imageItem?: ImageAsset;
  rootPath: string | null;
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isSelectionMode?: boolean;
  disableOrganization?: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export interface GallerySelectionBarProps {
  count: number;
  onClear: () => void;
  onGroup: () => void;
}
