import { useState, useRef } from 'react';

interface DragAndDropOptions<TItem> {
  onDrop: (sourceItem: TItem, targetType: string, targetId: string) => Promise<void> | void;
  isValidTarget?: (sourceItem: TItem, targetType: string, targetId: string) => boolean;
  dragThreshold?: number; // KI-023: Evita arrastes acidentais
}

export function useDragAndDrop<TItem>({ 
  onDrop, 
  isValidTarget, 
  dragThreshold = 8 
}: DragAndDropOptions<TItem>) {
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