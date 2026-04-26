import { AnyCanvasEntity } from './canvas';

export interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  totalItems: number;
  itemName: string;
}

export interface NoteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, name: string) => void;
}

export interface NoteConfigPanelProps {
  selectedNoteEntity: AnyCanvasEntity;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedNoteStyle: (styleUpdates: Record<string, string | number>) => void;
  setIsNoteGalleryOpen: (open: boolean) => void;
}

export interface CanvasPdfItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isSepararActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onSplit: () => void;
  rootPath: string | null;
}

export interface CanvasNoteItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
}

export interface CanvasImageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  rootPath: string | null;
}

export interface CanvasSidebarProps {
  sideMenuMode: 'main' | 'notes';
  setSideMenuMode: (mode: 'main' | 'notes') => void;
  isSepararActive: boolean;
  setIsSepararActive: (active: boolean) => void;
  setIsNoteGalleryOpen: (open: boolean) => void;
  setIsPdfGalleryOpen: (open: boolean) => void;
  setIsImageGalleryOpen: (open: boolean) => void;
  selectedNoteEntity: AnyCanvasEntity | undefined;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedNoteStyle: (styleUpdates: Record<string, string | number>) => void;
}

export interface CanvasActionMenuProps {
  entity: AnyCanvasEntity;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  handleRotateStart: (e: React.MouseEvent) => void;
}
