import { useCallback } from 'react';

interface TransformOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  minWidth?: number;
  minHeight?: number;
  onUpdate: (updates: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
  onSelect?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  ignoreSelectors?: string[];
}

/**
 * Hook para Transformação Livre (Move, Resize e Rotação)
 * Utilizado no Canvas, MoodBoard e Editor.
 */
export function useTransformable({
  x,
  y,
  width = 300,
  height = 300,
  minWidth = 50,
  minHeight = 50,
  onUpdate,
  onSelect,
  onStart,
  onEnd,
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
    let isDragging = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      // KI-023 / KI-037: Threshold de 5px para evitar movimentos acidentais em cliques
      if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging = true;
        if (onStart) onStart();
      }

      if (isDragging) {
        onUpdate({ x: initialX + dx, y: initialY + dy });
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (isDragging && onEnd) onEnd();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [x, y, onUpdate, onSelect, onStart, onEnd, ignoreSelectors]);

  const handleResizeStart = useCallback((direction: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect) onSelect();
    if (onStart) onStart();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;
      
      const diffX = (direction === 'br' || direction === 'tr') ? currentX - startX : startX - currentX;
      const diffY = (direction === 'br' || direction === 'bl') ? currentY - startY : startY - currentY;
      
      const newWidth = Math.max(minWidth, startWidth + diffX);
      const newHeight = Math.max(minHeight, startHeight + diffY);
      
      onUpdate({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (onEnd) onEnd();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, height, minWidth, minHeight, onUpdate, onSelect, onEnd]);

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSelect) onSelect();
    if (onStart) onStart();

    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      onUpdate({ rotation: angle + 90 }); // +90 para compensar o handle no topo
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (onEnd) onEnd();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onUpdate, onSelect, onEnd]);

  return { handleMouseDown, handleResizeStart, handleRotateStart };
}
