import { PdfData, ImageData } from './assets';
import { NoteData, PostItData, TextData, PageData } from './editor';
import { MesaDrawing } from './universe';

export interface Point {
  x: number;
  y: number;
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

export interface UseCanvasUIHandlersProps {
  entities: AnyCanvasEntity[];
  activeTool: string;
  isPencilActive: boolean;
  isTextActive: boolean;
  isCollageActive: boolean;
  isScissorsActive: boolean;
  activateSelect: () => void;
  activateScissors: () => void;
  bringToFront: (id: string) => void;
  setSideMenuMode: (mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text') => void;
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
