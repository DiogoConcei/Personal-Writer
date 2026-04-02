import { create } from 'zustand';

export type ActivePanel = 'editor' | 'dashboard' | 'gallery';

export interface DragInfo {
  sourcePath: string | null;
  sourceName: string | null;
  currentX: number;
  currentY: number;
  targetPath: string | null;
}

export interface PreviewState {
  entityPath: string | null;
  position: { x: number; y: number } | null;
}

interface UIState {
  activePanel: ActivePanel;
  isSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isFocusMode: boolean;
  isCommandPaletteOpen: boolean;
  
  // Quick Look State
  preview: PreviewState;
  
  // Custom Drag State
  dragInfo: DragInfo;
  
  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  setFocusMode: (enabled: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setPreview: (preview: Partial<PreviewState>) => void;
  setDragInfo: (info: Partial<DragInfo>) => void;
  resetDrag: () => void;
}

const INITIAL_DRAG: DragInfo = {
  sourcePath: null,
  sourceName: null,
  currentX: 0,
  currentY: 0,
  targetPath: null,
};

const INITIAL_PREVIEW: PreviewState = {
  entityPath: null,
  position: null,
};

export const useUIStore = create<UIState>((set) => ({
  activePanel: 'editor',
  isSidebarVisible: true,
  isRightSidebarVisible: false,
  isFocusMode: false,
  isCommandPaletteOpen: false,
  dragInfo: INITIAL_DRAG,
  preview: INITIAL_PREVIEW,

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
  setFocusMode: (enabled) => set({ isFocusMode: enabled }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setPreview: (preview) => set((state) => ({ 
    preview: { ...state.preview, ...preview } 
  })),
  
  setDragInfo: (info) => set((state) => ({ 
    dragInfo: { ...state.dragInfo, ...info } 
  })),
  
  resetDrag: () => set({ dragInfo: INITIAL_DRAG }),
}));

