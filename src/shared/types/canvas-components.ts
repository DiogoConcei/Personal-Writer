import { ReactNode } from 'react';
import { MesaDrawing, AnyCanvasEntity, CutPatch, SplitMode } from './index';

export interface CanvasHistoryState {
  entities: AnyCanvasEntity[];
  drawings: MesaDrawing[];
}

export interface SplitActionData {
  id: string;
  name: string;
  total: number;
  initialPage: number;
  mode?: SplitMode;
  amount?: number;
  startPage?: number;
  endPage?: number;
  singlePage?: number;
}

export type SplittingItem = SplitActionData;

export type CanvasModalType = 'note' | 'split' | 'focus' | 'image' | 'pdf' | null;

export interface CanvasModalsState {
  openModal: CanvasModalType;
  splittingItem: SplittingItem | null;
  focusItem: AnyCanvasEntity | null;
  sideMenuMode: 'main' | 'notes' | 'drawing' | 'postits' | 'text' | 'pages';
  isGroupingActive: boolean;
  groupingSourceId: string | null;
}

export interface CanvasControlsContextValue extends CanvasModalsState {
  open: (type: CanvasModalType, data?: unknown) => void;
  close: () => void;
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text' | 'pages') => void;
  startGrouping: (id: string) => void;
  cancelGrouping: () => void;
}

export interface CanvasControlsProps {
  children: ReactNode;
  value: CanvasControlsContextValue;
}

export type FocusTool = 'select' | 'square' | 'lasso' | 'edit';

export interface FocusToolbarProps {
  activeTool: FocusTool;
  onToolChange: (tool: FocusTool) => void;
  canEdit?: boolean;
}

export interface CanvasNoteItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isSepararActive: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onSplit: (page?: number) => void;
  onFocus: () => void;
  onPageChange?: (page: number) => void;
  onDropEntity?: (sourceData: any) => void;
}

export interface CanvasImageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onFocus: () => void;
  rootPath: string | null;
}

export interface CanvasPdfItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isSepararActive: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onSplit: () => void;
  onFocus: () => void;
  onPageChange?: (page: number) => void;
  rootPath: string | null;
}

export interface CanvasTextItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export interface CanvasPostItItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  isScissorsActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onFocus: () => void;
}

export interface CanvasPageItemProps {
  entity: AnyCanvasEntity;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export interface CanvasActionMenuProps {
  entity: AnyCanvasEntity;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  handleRotateStart: (e: React.MouseEvent) => void;
}

export interface TextStylePanelProps {
  selectedTextEntity: AnyCanvasEntity | undefined;
  handleFontSizeChange: (newSize: number) => void;
  handleFontFamilyChange: (fontFamily: string) => void;
  toggleBold: () => void;
}

export interface NoteConfigPanelProps {
  selectedNoteEntity: AnyCanvasEntity;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedNoteStyle: (styleUpdates: Record<string, string | number>) => void;
  setIsNoteGalleryOpen: (isOpen: boolean) => void;
}

export interface PageConfigPanelProps {
  selectedPageEntity: AnyCanvasEntity;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedPageStyle: (styleUpdates: Record<string, string | number>) => void;
  handleFontFamilyChange: (fontFamily: string) => void;
  toggleBold: () => void;
}

export interface PostItConfigPanelProps {
  selectedPostItEntity: AnyCanvasEntity;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedPostItStyle: (styleUpdates: Record<string, string | number>) => void;
  toggleBold: () => void;
  handleFontFamilyChange: (fontFamily: string) => void;
}

export interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: SplitActionData) => void;
  totalItems: number;
  itemName: string;
  initialPage?: number;
}

export interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: AnyCanvasEntity | null;
  rootPath: string | null;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onAddPendingCollage?: (sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => string | void;
}

export interface NoteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, name: string) => void;
}

export interface CutPatchProps {
  patch: CutPatch;
  backgroundColor?: string;
}

export interface SidebarProps {
  isSepararActive: boolean;
  setIsSepararActive: (active: boolean) => void;
  selectedNoteEntity: AnyCanvasEntity | undefined;
  handleFontSizeChange: (increment: number) => void;
  updateSelectedNoteStyle: (styleUpdates: Record<string, string | number>) => void;
  selectedTextEntity?: AnyCanvasEntity;
  handleTextFontSizeChange?: (newSize: number) => void;
  handleTextFontFamilyChange?: (fontFamily: string) => void;
  toggleTextBold?: () => void;
  onAddPostIt: () => void;
  selectedPostItEntity?: AnyCanvasEntity;
  handlePostItFontSizeChange?: (increment: number) => void;
  updateSelectedPostItStyle?: (styleUpdates: Record<string, string | number>) => void;
  togglePostItBold?: () => void;
  handlePostItFontFamilyChange?: (fontFamily: string) => void;
  onAddPage?: () => void;
  selectedPageEntity?: AnyCanvasEntity;
  updateSelectedPageStyle?: (styleUpdates: Record<string, string | number>) => void;
  handlePageFontSizeChange?: (increment: number) => void;
  handlePageFontFamilyChange?: (fontFamily: string) => void;
  togglePageBold?: () => void;
  isCollageActive?: boolean;
  activateCollage?: () => void;
  isAttachActive?: boolean;
  onToggleAttach?: () => void;
  onBatchAttach?: () => void;
  selectedItemIds?: string[];
  canConfirmCollage?: boolean;
  onConfirmCollage?: () => void;
}

export interface ModalsProps {
  entities: AnyCanvasEntity[];
  onNoteSelect: (path: string, name: string) => void;
  onImageSelect: (path: string) => void;
  onPdfSelect: (path: string) => void;
  onConfirmSplit: (data: SplitActionData) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onAddPendingCollage?: (sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => void;
  rootPath?: string | null;
}

export interface EntityRendererProps {
  entity: AnyCanvasEntity;
  selectedItemIds: string[];
  isSplitModeActive: boolean;
  isScissorsActive: boolean;
  rootPath: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStartTransform: () => void;
  onEndTransform: (id: string) => void;
  onOpenModal: (type: CanvasModalType, data?: unknown) => void;
  onDropEntity?: (sourceData: any) => void;
}

export interface CanvasToolbarProps {
  activeTool: string;
  isScissorsActive: boolean;
  onActivateSelect: () => void;
  onActivatePan: () => void;
  onActivatePencil: () => void;
  onActivateEraser: () => void;
  onActivateText: () => void;
  onToggleScissors: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export interface CollageControlsProps {
  activeTool: string;
  onActivatePencil: () => void;
  onActivateEraser: () => void;
  onActivateText: () => void;
  onOpenImageGallery: () => void;
  onFinalize: () => void;
  onCancel: () => void;
}

export interface Marquee {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isVisible: boolean;
}

export interface CanvasViewportProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  viewState: { x: number; y: number };
  isPanning: boolean;
  isSpacePressed: boolean;
  isPanActive: boolean;
  isPencilActive: boolean;
  isTextActive: boolean;
  isEraserActive: boolean;
  isCollageActive: boolean;
  isSplitModeActive: boolean;
  isScissorsActive: boolean;
  rootPath: string;
  entities: AnyCanvasEntity[];
  drawings: MesaDrawing[];
  visibleEntities: AnyCanvasEntity[];
  selectedItemId: string | null;
  selectedItemIds: string[];
  marquee?: Marquee;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelectItem: (id: string) => void;
  onDeselect: () => void;
  onUpdateEntity: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemoveEntity: (id: string) => void;
  onStartTransform: () => void;
  onEndTransform: (id: string) => void;
  onRotateStart: (e: React.MouseEvent) => void;
  onOpenModal: (type: CanvasModalType, data?: unknown) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  removeDrawing: (id: string) => void;
  onDropEntityOnNote?: (noteEntityId: string, sourceData: any) => void;
}
