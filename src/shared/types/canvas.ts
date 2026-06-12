import { ReactNode, RefObject } from 'react';
import { PdfData, ImageData } from './assets';
import { NoteData, PostItData, TextData, PageData } from './editor';
import { MesaDrawing } from './universe';

export interface Point {
  x: number;
  y: number;
}

/**
 * Props para o componente base do Canvas (Viewport + Background).
 */
export interface CanvasBaseProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  viewState: { x: number; y: number };
  isPanning: boolean;
  isSpacePressed?: boolean;
  isPanModeActive?: boolean;
  isPlanning?: boolean;
  backgroundPattern?: 'dots' | 'grid' | 'cork' | 'none';
  children: ReactNode;
  beforeViewport?: ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  viewportStyle?: React.CSSProperties;
}

/**
 * Props para a camada de desenho sobre o Canvas.
 */
export interface CanvasDrawingLayerProps {
  drawings: MesaDrawing[];
  removeDrawing: (id: string) => void;
  isEraserActive?: boolean;
  isCollageActive?: boolean;
  selectedItemIds?: string[];
  onSelect?: (id: string) => void;
}

export interface ViewState {
  x: number;
  y: number;
}

export interface UseCanvasEngineOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export interface CropOptions {
  points: Point[];
  boundingBox: { x: number; y: number; width: number; height: number };
  container: HTMLElement;
}

/**
 * Arquitetura de Entidades Genéricas para o Infinite Canvas.
 */
export interface CanvasEntity<T = unknown> {
  id: string;
  type: string; // Ex: 'pdf', 'image', 'note', 'postit', 'text', 'page'
  
  // Transformações Universais
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // Graus (0-360)
  zIndex?: number;   // Ordem de sobreposição
  
  // Sistemas de Relacionamento e Estrutura
  groupId?: string;       // ID do grupo ao qual pertence
  connections?: string[]; // IDs de outras entidades vinculadas (linhas)
  
  // Estilo Dinâmico (CSS Injection)
  style?: Record<string, string | number>;
  
  // Payload de Dados Específicos
  data: T;
}

export type AnyCanvasEntity = CanvasEntity<PdfData | ImageData | NoteData | PostItData | TextData | PageData | unknown>;


export interface CutPatch {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  points?: Point[];
}

export interface UseCanvasCollageProps {
  entities: AnyCanvasEntity[];
  drawings: MesaDrawing[];
  selectedItemIds: string[];
  setEntities: (entities: AnyCanvasEntity[] | ((prev: AnyCanvasEntity[]) => AnyCanvasEntity[])) => void;
  updateDrawing: (id: string, updates: Partial<MesaDrawing>) => void;
  addPendingCollage: (sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => string;
  activeCollageGroupId: string | null;
  setActiveCollageGroupId: (id: string | null) => void;
  setIsCollageConfirmed: (confirmed: boolean) => void;
  setSelectedItemIds: (ids: string[]) => void;
  setSelectedItemId: (id: string | null) => void;
  activateSelect: () => void;
  takeSnapshot: (state: { entities: AnyCanvasEntity[], drawings: MesaDrawing[] }) => void;
}

export interface UseCanvasCropPersistenceProps {
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  rootPath: string | null;
}

export interface UseCanvasEntityOptions {
  entity: AnyCanvasEntity;
  onSelect?: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  minWidth?: number;
  minHeight?: number;
}

export interface UseCanvasGroupMoveProps {
  entities: AnyCanvasEntity[];
  drawings: MesaDrawing[];
  setEntities: (entities: AnyCanvasEntity[] | ((prev: AnyCanvasEntity[]) => AnyCanvasEntity[])) => void;
  updateDrawing: (id: string, updates: Partial<MesaDrawing>) => void;
  handleUpdateEntity: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  isCollageConfirmed: boolean;
  activeCollageGroupId: string | null;
  takeSnapshot: (state: { entities: AnyCanvasEntity[], drawings: MesaDrawing[] }) => void;
}

export interface UseCanvasHotkeysOptions {
  selectedItemId: string | null;
  selectedItemIds?: string[];
  onRemove: (id: string) => void;
  onDeselect: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export interface UseCanvasNoteStyleOptions {
  selectedItemId: string | null;
  entities: AnyCanvasEntity[];
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
}

export interface UseCanvasPostItStyleOptions {
  selectedItemId: string | null;
  entities: AnyCanvasEntity[];
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
}

export interface UseCanvasSplitProps {
  entities: AnyCanvasEntity[];
  setEntities: (entities: AnyCanvasEntity[] | ((prev: AnyCanvasEntity[]) => AnyCanvasEntity[])) => void;
}

export interface UseCanvasTextStyleOptions {
  selectedItemId: string | null;
  entities: AnyCanvasEntity[];
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
}

export interface CanvasUIState {
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null | ((prev: string | null) => string | null)) => void;
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  isSplitModeActive: boolean;
  setIsSplitModeActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  isCollageConfirmed: boolean;
  setIsCollageConfirmed: (confirmed: boolean | ((prev: boolean) => boolean)) => void;
  activeCollageGroupId: string | null;
  setActiveCollageGroupId: (id: string | null | ((prev: string | null) => string | null)) => void;
}

export interface UseCanvasUIHandlersProps {
  entities: AnyCanvasEntity[];
  activeTool: string;
  isPencilActive: boolean;
  isTextActive: boolean;
  isCollageActive: boolean;
  isScissorsActive: boolean;
  isAttachActive: boolean;
  activateSelect: () => void;
  activateScissors: () => void;
  activateAttach: () => void;
  bringToFront: (id: string) => void;
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text' | 'pages') => void;
}

export interface UseCanvasViewportOptions {
  zoom: number;
  resetZoom: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseScissorsTraceProps {
  isEnabled: boolean;
  mode?: 'path' | 'square';
  fadeDelay?: number;
}
