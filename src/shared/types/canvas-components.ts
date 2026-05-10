import { AnyCanvasEntity } from './canvas';

export type CanvasModalType = 'image' | 'pdf' | 'note' | 'split' | 'focus';

export interface SplittingItem {
  id: string;
  name: string;
  total: number;
  initialPage?: number;
}

export interface CanvasModalsState {
  openModal: CanvasModalType | null;
  splittingItem: SplittingItem | null;
  focusItem: AnyCanvasEntity | null;
  sideMenuMode: 'main' | 'notes' | 'drawing' | 'postits' | 'text';
}

export interface SplitActionData {
  mode: 'amount' | 'single' | 'range';
  startPage?: number;
  endPage?: number;
  amount?: number;
  singlePage?: number;
}

export interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  totalItems: number;
  itemName: string;
  initialPage?: number;
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
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onSplit: (page?: number) => void;
  onFocus: () => void;
  rootPath: string | null;
}

export interface CanvasNoteItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isSepararActive: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onSplit: (page?: number) => void;
  onFocus: () => void;
}

export interface CanvasImageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onFocus: () => void;
  rootPath: string | null;
}

export interface CanvasTextItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
}

export interface CanvasSidebarProps {
  sideMenuMode: 'main' | 'notes' | 'drawing' | 'postits' | 'text';
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text') => void;
  isSepararActive: boolean;
  setIsSepararActive: (active: boolean) => void;
  setIsNoteGalleryOpen: (open: boolean) => void;
  setIsPdfGalleryOpen: (open: boolean) => void;
  setIsImageGalleryOpen: (open: boolean) => void;
  selectedNoteEntity: AnyCanvasEntity | undefined;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedNoteStyle: (styleUpdates: Record<string, string | number>) => void;
}

export interface CanvasControlsContextValue {
  openModal: CanvasModalType | null;
  splittingItem: SplittingItem | null;
  focusItem: AnyCanvasEntity | null;
  sideMenuMode: 'main' | 'notes' | 'drawing' | 'postits' | 'text';
  open: (type: CanvasModalType, data?: any) => void;
  close: () => void;
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text') => void;
}

export interface CanvasActionMenuProps {
  entity: AnyCanvasEntity;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  handleRotateStart: (e: React.MouseEvent) => void;
}
