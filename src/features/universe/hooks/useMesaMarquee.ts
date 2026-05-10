import { useState, useCallback, useEffect } from 'react';
import { MesaItem, MesaGrupo } from '@/shared/types';

interface UseMesaMarqueeOptions {
  items: MesaItem[];
  groups: MesaGrupo[];
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
  setSelectedItems: (ids: string[]) => void;
}

export function useMesaMarquee({ 
  items, 
  groups, 
  screenToCanvas, 
  setSelectedItems 
}: UseMesaMarqueeOptions) {
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!selectionStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSelectionCurrent(screenToCanvas(e.clientX, e.clientY));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (selectionStart && selectionCurrent) {
        const minX = Math.min(selectionStart.x, selectionCurrent.x);
        const maxX = Math.max(selectionStart.x, selectionCurrent.x);
        const minY = Math.min(selectionStart.y, selectionCurrent.y);
        const maxY = Math.max(selectionStart.y, selectionCurrent.y);

        const newlySelectedIds = items.filter(item => {
          if (!item.groupId) {
            return item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY;
          }
          const group = groups.find(g => g.id === item.groupId);
          if (group) {
            return group.x >= minX && group.x <= maxX && group.y >= minY && group.y <= maxY;
          }
          return false;
        }).map(i => i.id);

        if (newlySelectedIds.length > 0) {
          if (e.shiftKey) {
            setSelectedItems(Array.from(new Set([...newlySelectedIds])));
          } else {
            setSelectedItems(newlySelectedIds);
          }
        }
      }
      setSelectionStart(null);
      setSelectionCurrent(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectionStart, selectionCurrent, items, groups, screenToCanvas, setSelectedItems]);

  const startMarquee = useCallback((x: number, y: number) => {
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
  }, []);

  return {
    selectionStart,
    selectionCurrent,
    startMarquee
  };
}
