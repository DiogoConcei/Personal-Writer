import { create } from 'zustand';
import { ActivePanel, DragInfo, PreviewState, ToastNotification } from '@/shared/types';

interface UIState {
  activePanel: ActivePanel;
  isSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  
  // Editor UI State
  editorModals: {
    showGallery: boolean;
    showTemplates: boolean;
    showTemplateGallery: boolean;
    showDocuments: boolean;
    showHistory: boolean;
    showTOC: boolean;
  };

  notifications: ToastNotification[];

  preview: PreviewState;

  dragInfo: DragInfo;

  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleZenMode: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setEditorModal: (modal: keyof UIState['editorModals'], isOpen: boolean) => void;
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
  editorModals: {
    showGallery: false,
    showTemplates: false,
    showTemplateGallery: false,
    showDocuments: false,
    showHistory: false,
    showTOC: false,
  },
  notifications: [],
  dragInfo: INITIAL_DRAG,
  preview: INITIAL_PREVIEW,

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setEditorModal: (modal, isOpen) => set((state) => ({
    editorModals: { ...state.editorModals, [modal]: isOpen }
  })),
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

