import { create } from 'zustand';

export type ActivePanel = 'editor' | 'dashboard';

interface UIState {
  activePanel: ActivePanel;
  isSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isFocusMode: boolean;
  isCommandPaletteOpen: boolean;
  
  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  setFocusMode: (enabled: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: 'editor',
  isSidebarVisible: true,
  isRightSidebarVisible: false,
  isFocusMode: false,
  isCommandPaletteOpen: false,

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
  setFocusMode: (enabled) => set({ isFocusMode: enabled }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
}));
