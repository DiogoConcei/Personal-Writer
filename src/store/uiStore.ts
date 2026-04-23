import { create } from 'zustand';

export type ActivePanel = 'editor' | 'dashboard' | 'gallery' | 'moodboard' | 'assets' | 'documents' | 'drawing' | 'settings';

export interface DragInfo {
  sourcePath: string | null;
  sourceName: string | null;
  sourceNodePos: number | null;
  currentX: number;
  currentY: number;
  targetPath: string | null;

  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
}

export interface PreviewState {
  entityPath: string | null;
  position: { x: number; y: number } | null;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  activePanel: ActivePanel;
  isSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  notifications: ToastNotification[];

  preview: PreviewState;

  dragInfo: DragInfo;

  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleZenMode: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setPreview: (preview: Partial<PreviewState>) => void;
  setDragInfo: (info: Partial<DragInfo>) => void;
  resetDrag: () => void;
  addNotification: (message: string, type?: ToastNotification['type']) => void;
  removeNotification: (id: string) => void;
}

const INITIAL_DRAG: DragInfo = {
  sourcePath: null,
  sourceName: null,
  sourceNodePos: null,
  currentX: 0,
  currentY: 0,
  targetPath: null,
  startX: 0,
  startY: 0,
  startTime: 0,
  isDragging: false,
};

const INITIAL_PREVIEW: PreviewState = {
  entityPath: null,
  position: null,
};

export const useUIStore = create<UIState>((set) => ({
  activePanel: 'editor',
  isSidebarVisible: true,
  isRightSidebarVisible: false,
  isZenMode: false,
  isCommandPaletteOpen: false,
  notifications: [],
  dragInfo: INITIAL_DRAG,
  preview: INITIAL_PREVIEW,

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setPreview: (preview) => set((state) => ({
    preview: { ...state.preview, ...preview }
  })),

  setDragInfo: (info) => set((state) => ({
    dragInfo: { ...state.dragInfo, ...info }
  })),

  resetDrag: () => set({ dragInfo: INITIAL_DRAG }),

  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 3000);
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
}));

