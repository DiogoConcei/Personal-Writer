import { useRef, useState, useEffect, useCallback } from 'react';
import { MesaItem } from '@/shared/types';

interface UseMesaItemResizeOptions {
  item: MesaItem;
  updateItem: (id: string, updates: Partial<MesaItem>) => void;
  itemRef: React.RefObject<HTMLDivElement | null>;
}

export function useMesaItemResize({ item, updateItem, itemRef }: UseMesaItemResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  
  const initialScale = useRef(1);
  const initialCenter = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(1);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      initialCenter.current = { x: centerX, y: centerY };
      initialScale.current = item.scale || 1;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      initialDistance.current = Math.sqrt(dx * dx + dy * dy);
      
      setIsResizing(true);
    }
  }, [item.scale, itemRef]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - initialCenter.current.x;
      const dy = e.clientY - initialCenter.current.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Proporção de escala baseada na distância do mouse ao centro original
      const scaleFactor = currentDistance / initialDistance.current;
      const newScale = Math.max(0.1, initialScale.current * scaleFactor);
      
      updateItem(item.id, { scale: newScale });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, item.id, updateItem]);

  return {
    isResizing,
    handleResizeStart
  };
}
