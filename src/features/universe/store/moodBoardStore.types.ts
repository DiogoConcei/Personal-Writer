import { MesaItem, MesaGrupo, MesaDrawing } from '@/shared/types';

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
  connections: Array<{ id: string; from: string; to: string; color?: string }>;
  activeDetailsIds: string[];
  modalZIndexes: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  allBoards: Array<{ id: string, name: string, backgroundImage: string | null }>;

  // Histórico (Undo/Redo)
  past: Array<{ items: MesaItem[]; groups: MesaGrupo[]; drawings: MesaDrawing[]; connections: any[] }>;
  future: Array<{ items: MesaItem[]; groups: MesaGrupo[]; drawings: MesaDrawing[]; connections: any[] }>;
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
