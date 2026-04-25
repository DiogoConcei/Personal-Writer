import { useState, useRef, useCallback } from 'react';

interface DragAndDropOptions<TItem> {
  onDrop: (sourceItem: TItem, targetType: string, targetId: string) => Promise<void> | void;
  isValidTarget?: (sourceItem: TItem, targetType: string, targetId: string) => boolean;
  dragThreshold?: number; // KI-023: Evita arrastes acidentais
}

/**
 * Hook para Drag & Drop entre elementos (ex: mover arquivo para pasta)
 */
export function useDragAndDrop<TItem>({ 
  onDrop, 
  isValidTarget, 
  dragThreshold = 8 
}: DragAndDropOptions<TItem>) {
  // ... (código existente mantido)
  const draggedItemRef = useRef<TItem | null>(null);
  const isDraggingRef = useRef(false);
  const processingDrop = useRef(false);
  const lastDetectionTime = useRef(0);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dropTargetRef = useRef<{ type: string; id: string } | null>(null);

  const [draggedItem, setDraggedItem] = useState<TItem | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ type: string; id: string } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, item: TItem) => {
    if (e.button !== 0 || processingDrop.current) return;
    e.preventDefault();

    draggedItemRef.current = item;
    setDraggedItem(item);
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);

    if (!isDraggingRef.current && (deltaX > dragThreshold || deltaY > dragThreshold)) {
      isDraggingRef.current = true;
      setIsDragging(true);
      document.body.classList.add('is-dragging');
    }
    
    if (isDraggingRef.current) {
      setDragPosition({ x: e.clientX, y: e.clientY });
      
      const now = Date.now();
      if (now - lastDetectionTime.current > 50) {
        lastDetectionTime.current = now;
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const targetElement = elementAtPoint?.closest('[data-drag-id]');
        
        if (targetElement) {
          const type = targetElement.getAttribute('data-drag-type') || '';
          const id = targetElement.getAttribute('data-drag-id')!;
          
          if (isValidTarget && !isValidTarget(draggedItemRef.current!, type, id)) {
            setDropTarget(null);
            dropTargetRef.current = null;
          } else {
            const newTarget = { type, id };
            setDropTarget(newTarget);
            dropTargetRef.current = newTarget;
          }
        } else {
          setDropTarget(null);
          dropTargetRef.current = null;
        }
      }
    }
  };

  const handleMouseUp = async () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('is-dragging');
    
    if (processingDrop.current) return;

    const wasDragging = isDraggingRef.current;
    const target = dropTargetRef.current; 
    const currentItem = draggedItemRef.current;

    setDraggedItem(null);
    draggedItemRef.current = null;
    setIsDragging(false);
    isDraggingRef.current = false;
    setDropTarget(null);
    dropTargetRef.current = null;

    if (wasDragging && target && currentItem) {
      processingDrop.current = true;
      try {
        await onDrop(currentItem, target.type, target.id);
      } finally {
        setTimeout(() => { processingDrop.current = false; }, 100);
      }
    }
  };

  const shouldIgnoreClick = () => {
    return isDraggingRef.current || processingDrop.current;
  };

  return {
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
    shouldIgnoreClick,
  };
}

interface TransformOptions {
  x: number;
  y: number;
  width?: number;
  minWidth?: number;
  onUpdate: (updates: { x?: number; y?: number; width?: number }) => void;
  onSelect?: () => void;
  ignoreSelectors?: string[];
}

/**
 * Hook para Transformação Livre (Move e Resize)
 * Utilizado no Canvas, MoodBoard e Editor.
 */
export function useTransformable({
  x,
  y,
  width = 300,
  minWidth = 50,
  onUpdate,
  onSelect,
  ignoreSelectors = ['button', '.handle']
}: TransformOptions) {
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect();

    const target = e.target as HTMLElement;
    const shouldIgnore = ignoreSelectors.some(selector => {
      if (selector.startsWith('.')) {
        return target.className.includes?.(selector.substring(1));
      }
      return target.closest(selector);
    });

    if (shouldIgnore) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = x;
    const initialY = y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onUpdate({ x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [x, y, onUpdate, onSelect, ignoreSelectors]);

  const handleResizeStart = useCallback((direction: 'tl' | 'bl' | 'br', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect) onSelect();

    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diff = direction === 'br' ? currentX - startX : startX - currentX;
      const newWidth = Math.max(minWidth, startWidth + diff);
      onUpdate({ width: newWidth });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, minWidth, onUpdate, onSelect]);

  return { handleMouseDown, handleResizeStart };
}