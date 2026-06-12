/**
 * Tipos de painéis principais que podem estar ativos na UI.
 */
export type ActivePanel = 'editor' | 'dashboard' | 'gallery' | 'moodboard' | 'moodboard-map' | 'assets' | 'documents' | 'drawing' | 'settings' | 'canvas';

/**
 * Informações de estado para operações de Drag & Drop globais.
 */
export interface DragInfo {
  sourcePath: string | null;
  sourceName: string | null;
  sourceNodePos: number | null;
  sourceData?: unknown;
  currentX: number;
  currentY: number;
  targetPath: string | null;

  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
}

/**
 * Estado de pré-visualização de entidades (Hover).
 */
export interface PreviewState {
  entityPath: string | null;
  position: { x: number; y: number } | null;
}

/**
 * Interface para notificações do sistema (Toast).
 */
export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastProps {
  notification: ToastNotification;
}

/**
 * Props para o componente Modal base.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHeader?: boolean;
  padding?: boolean;
}

/**
 * Props para o componente de Modal de Confirmação.
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

/**
 * Props para o componente de Modal de Input.
 */
export interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
}

/**
 * Estado da Store de UI (Modais, Sidebars, Notificações).
 */
export interface UIState {
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
    showRuler: boolean;
  };

  notifications: ToastNotification[];
  preview: PreviewState;
  dragInfo: DragInfo;
  lastFileSaveTick: number;

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
  triggerFileSaveTick: () => void;
}
