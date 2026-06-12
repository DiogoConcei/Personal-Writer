import { FileNode } from '@/tauri-bridge';
import { ActivePanel } from './ui';

/**
 * Interface para conexão entre itens na Mesa de Trabalho.
 */
export interface MesaConnection {
  id: string;
  from: string;
  to: string;
  color?: string;
}

/**
 * Interface base para metadados extraídos de arquivos Markdown (YAML Frontmatter).
 */
export interface Metadata {
  type?: 'character' | 'location' | 'note' | string;
  icon?: string;
  tags?: string[];
  banner?: string;
  images?: string[];
  documents?: string[];
  music?: string;
  linked_characters?: string[];
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Entidade rica do sistema. Representa um arquivo Markdown indexado
 * com metadados, resumo e relacionamentos.
 */
export interface Entity extends Metadata {
  path: string;           // Caminho completo no sistema de arquivos
  name: string;           // Nome amigável (geralmente o nome do arquivo)
  lastModified: number;   // Timestamp da última alteração
  excerpt: string;        // Pequeno trecho de texto limpo para preview
  links: string[];        // Lista de WikiLinks ([[Link]]) encontrados no texto
  previewImage?: string;  // URL da primeira imagem encontrada no corpo
}

/**
 * Filtros dinâmicos aplicáveis a coleções de entidades.
 */
export interface EntityFilters {
  search?: string;
  type?: string;
  activeFilters?: Record<string, string>;
}

/**
 * Item individual de uma Mesa de Trabalho (mural visual).
 */
export interface MesaItem {
  id: string;
  type?: 'image' | 'text';
  path?: string; // Para imagens
  text?: string; // Para blocos de texto
  extraPaths?: string[]; // Novos caminhos para galeria interna do item
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  category?: string;
  groupId?: string;
  groupOrder?: number;
  ownerId?: string;
  customName?: string;
  fontSize?: number;
  color?: string;
}

/**
 * Desenho livre (lápis) na Mesa de Trabalho.
 */
export interface MesaDrawing {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity?: number;
  groupId?: string;
  x?: number; // Offset horizontal para otimização de movimento
  y?: number; // Offset vertical para otimização de movimento
}

/**
 * Grupo de itens na Mesa de Trabalho.
 */
export interface MesaGrupo {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  title?: string;
}

export interface CharacterDetailsModalProps {
  characterId: string;
  onClose: () => void;
}

export interface MesaGrupoContainerProps {
  group: MesaGrupo;
  items: MesaItem[];
  zoom?: number;
  onItemClick?: (id: string) => void;
  connectionSourceId?: string | null;
  isGroupingMode?: boolean;
  onConfirmGroup?: () => void;
  onCancelGroup?: () => void;
}

export interface MesaItemProps {
  item: MesaItem;
  zoom?: number;
  onClick?: () => void;
  onAddPhoto?: () => void;
  isConnectingSource?: boolean;
  isGroupingMode?: boolean;
  onConfirmGroup?: () => void;
  onCancelGroup?: () => void;
}

export interface MesaLeftToolbarProps {
  backgroundImage: string | null;
  backgroundPattern: 'dots' | 'grid' | 'cork';
  backgroundZoom?: number;
  onOpenBackgroundGallery: () => void;
  onRotateBackground: () => void;
  onZoomBackground: () => void;
  onRemoveBackground: () => void;
  onSetBackgroundPattern: (pattern: 'dots' | 'grid' | 'cork') => void;
}

export interface MesaToolbarProps {
  boardName: string;
  boardMode: 'free' | 'planning';
  isEditingName: boolean;
  tempName: string;
  isPencilActive: boolean;
  isEraserActive: boolean;
  isTextToolActive: boolean;
  isConnecting: boolean;
  isGroupingMode: boolean;
  isPanModeActive: boolean;
  isSettingsOpen: boolean;
  onSetTempName: (name: string) => void;
  onSaveName: () => void;
  onSetIsEditingName: (val: boolean) => void;
  activateSelectTool: () => void;
  activatePanTool: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  handleResetView: () => void;
  onOpenGallery: (mode: 'item' | 'background') => void;
  activatePencilTool: () => void;
  activateEraserTool: () => void;
  activateTextTool: () => void;
  handleToggleConnectionMode: () => void;
  handleToggleGroupingMode: () => void;
  setActivePanel: (panel: ActivePanel) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setBoardMode: (mode: 'free' | 'planning') => void;
  onSaveBoard: () => void;
}

/**
 * Configurações persistentes do Universo.
 */
export interface UniverseSettings {
  galleryTitle?: string;
}

/**
 * Estado da Store de Universo (Indexação e Metadados Globais).
 */
export interface UniverseState {
  entities: Record<string, Entity>;
  isIndexing: boolean;
  lastIndexed: number | null;
  galleryTitle: string;

  indexWorkspace: (files: FileNode[]) => Promise<void>;
  updateEntity: (path: string, content: string, lastModified?: number) => void;
  removeEntity: (path: string) => void;
  clearIndex: () => void;
  getBacklinks: (targetPath: string) => Entity[];
  updateEntitiesOrder: (paths: string[]) => Promise<void>;
  
  // Configurações do Universo
  loadSettings: () => Promise<void>;
  updateGalleryTitle: (title: string) => Promise<void>;
}

/**
 * Estado da Mesa de Trabalho (Mural Visual).
 */
export interface MesaTrabalhoState {
  // Estado
  items: MesaItem[];
  groups: MesaGrupo[];
  drawings: MesaDrawing[];
  selectedItems: string[];
  boardId: string | null;
  boardName: string;
  boardMode: 'free' | 'planning';
  backgroundPattern: 'dots' | 'grid' | 'cork';
  backgroundImage: string | null;
  backgroundRotation: number;
  backgroundZoom: number;
  connections: MesaConnection[];
  activeDetailsIds: string[];
  modalZIndexes: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  allBoards: Array<{ id: string, name: string, backgroundImage: string | null }>;

  // Histórico (Undo/Redo)
  past: Array<{ items: MesaItem[]; groups: MesaGrupo[]; drawings: MesaDrawing[]; connections: MesaConnection[] }>;
  future: Array<{ items: MesaItem[]; groups: MesaGrupo[]; drawings: MesaDrawing[]; connections: MesaConnection[] }>;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;

  // Persistência
  loadBoard: (rootPath: string, boardId?: string) => Promise<void>;
  saveBoard: (rootPath: string) => Promise<void>;
  loadAllBoards: (rootPath: string) => Promise<void>;
  createBoard: (rootPath: string, name: string) => Promise<string>;
  deleteBoard: (rootPath: string, id: string) => Promise<void>;
  
  // Workspace / Itens
  setBoardName: (name: string) => void;
  addItem: (item: Omit<MesaItem, 'id' | 'zIndex'>) => void;
  updateItem: (id: string, updates: Partial<MesaItem>) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;
  attachItemToCharacter: (itemId: string, characterId: string) => void;
  detachItemFromCharacter: (itemId: string, x: number, y: number) => void;

  // Desenhos
  addDrawing: (drawing: MesaDrawing) => void;
  updateDrawing: (id: string, updates: Partial<MesaDrawing>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;

  // Conexões
  addConnection: (from: string, to: string) => void;
  removeConnection: (id: string) => void;

  // Grupos
  updateGroup: (id: string, updates: Partial<MesaGrupo>) => void;
  removeGroup: (id: string) => void;
  groupSelectedItems: () => string | null;
  ungroupItems: (groupId: string) => void;
  reorderInGroup: (groupId: string, itemId: string, direction: 'left' | 'right') => void;
  mergeIntoGroup: (sourceId: string, targetId: string) => void;

  // Seleção
  toggleSelection: (id: string, multi?: boolean) => void;
  setSelectedItems: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Configurações e UI
  setBoardMode: (mode: 'free' | 'planning') => void;
  setBackgroundPattern: (pattern: 'dots' | 'grid' | 'cork') => void;
  setBackgroundImage: (path: string | null) => void;
  setBackgroundRotation: (rotation: number) => void;
  setBackgroundZoom: (zoom: number) => void;
  toggleDetailsId: (id: string, forceClose?: boolean) => void;
  bringDetailsToFront: (id: string) => void;
}

