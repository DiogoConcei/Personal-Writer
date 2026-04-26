import { useCallback } from 'react';

interface TransformOptions {
  x: number;
  y: number;
  width?: number;
  rotation?: number;
  minWidth?: number;
  onUpdate: (updates: { x?: number; y?: number; width?: number; rotation?: number }) => void;
  onSelect?: () => void;
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

  const handleResizeStart = useCallback((direction: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect) onSelect();

    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diff = (direction === 'br' || direction === 'tr') ? currentX - startX : startX - currentX;
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

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSelect) onSelect();

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
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onUpdate, onSelect]);

  return { handleMouseDown, handleResizeStart, handleRotateStart };
}
