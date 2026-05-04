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
