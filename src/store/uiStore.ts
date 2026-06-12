import { create } from 'zustand';
import { DragInfo, PreviewState, UIState } from '@/shared/types';

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
    showRuler: false,
  },
  notifications: [],
  dragInfo: INITIAL_DRAG,
  preview: INITIAL_PREVIEW,
  lastFileSaveTick: 0,

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

  triggerFileSaveTick: () => set((state) => ({ lastFileSaveTick: state.lastFileSaveTick + 1 })),

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

