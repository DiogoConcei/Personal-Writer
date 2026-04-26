import { Entity } from './universe';

/**
 * Resultado da categorização automática de notas no Dashboard.
 */
export interface CategorizedEntities {
  characters: Entity[];
  locations: Entity[];
  others: Entity[];
  total: number;
}

/**
 * Props para o componente NoteCard (Dashboard/Timeline).
 */
export interface NoteCardProps {
  entity: Entity;
}

/**
 * Props para o componente TimelineCard (Linha do tempo).
 */
export interface TimelineCardProps {
  char: Entity;
  isDragging: boolean;
  isDragOver: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
}

/**
 * Estado de arraste da Timeline.
 */
export interface TimelineDragState {
  draggedPath: string | null;
  dragOverPath: string | null;
  isDragging: boolean;
}
