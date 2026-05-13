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
  isGroupingActive: boolean;
  groupingSourceId: string | null;
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
  onEnd?: () => void;
  onSplit: (page?: number) => void;
  onFocus: () => void;
  onPageChange?: (page: number) => void;
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
  onEnd?: () => void;
  onSplit: (page?: number) => void;
  onFocus: () => void;
  onPageChange?: (page: number) => void;
}

export interface CanvasImageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
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
  onEnd?: () => void;
}

export interface CanvasPostItItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onFocus: () => void;
}

export interface CanvasPageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface PostItConfigPanelProps {
  selectedPostItEntity: AnyCanvasEntity;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedPostItStyle: (styleUpdates: Record<string, string | number>) => void;
  toggleBold: () => void;
  handleFontFamilyChange: (fontFamily: string) => void;
}

export interface CanvasSidebarProps {
  sideMenuMode: 'main' | 'notes' | 'drawing' | 'postits' | 'text';
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text') => void;
  isSepararActive: boolean;
  setIsSepararActive: (active: boolean) => void;
  isGroupingActive: boolean;
  setIsGroupingActive: (active: boolean) => void;
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
  isGroupingActive: boolean;
  groupingSourceId: string | null;
  open: (type: CanvasModalType, data?: any) => void;
  close: () => void;
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text') => void;
  startGrouping: (id: string) => void;
  cancelGrouping: () => void;
}

export interface CanvasActionMenuProps {
  entity: AnyCanvasEntity;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  handleRotateStart: (e: React.MouseEvent) => void;
}
