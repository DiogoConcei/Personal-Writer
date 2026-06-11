import { useState, useCallback, useRef } from 'react';
import { Marquee, AnyCanvasEntity, MesaDrawing } from '@/shared/types';

interface UseCanvasMarqueeProps {
  entities: AnyCanvasEntity[];
  drawings: MesaDrawing[];
  onSelectItems: (ids: string[]) => void;
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
  isEnabled: boolean;
}

export function useCanvasMarquee({
  entities,
  drawings,
  onSelectItems,
  screenToCanvas,
  isEnabled
}: UseCanvasMarqueeProps) {
  const [marquee, setMarquee] = useState<Marquee>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isVisible: false
  });

  const isDragging = useRef(false);

  const startMarquee = useCallback((e: React.MouseEvent) => {
    if (!isEnabled) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    setMarquee({
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y,
      isVisible: true
    });
    isDragging.current = true;
  }, [isEnabled, screenToCanvas]);

  const updateMarquee = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    setMarquee(prev => ({
      ...prev,
      endX: pos.x,
      endY: pos.y
    }));
  }, [screenToCanvas]);

  const endMarquee = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Calcular itens selecionados
    const x = Math.min(marquee.startX, marquee.endX);
    const y = Math.min(marquee.startY, marquee.endY);
    const width = Math.abs(marquee.endX - marquee.startX);
    const height = Math.abs(marquee.endY - marquee.startY);

    if (width < 5 && height < 5) {
      setMarquee(prev => ({ ...prev, isVisible: false }));
      return;
    }

    const selectedIds: string[] = [];

    // Checar Entidades
    entities.forEach(entity => {
      const ex = entity.x;
      const ey = entity.y;
      const ew = entity.width || 300;
      const eh = entity.height || 300;

      if (
        ex < x + width &&
        ex + ew > x &&
        ey < y + height &&
        ey + eh > y
      ) {
        selectedIds.push(entity.id);
      }
    });

    // Checar Desenhos
    drawings.forEach(drawing => {
      if (drawing.points.length === 0) return;
      
      const xs = drawing.points.map(p => p.x + (drawing.x || 0));
      const ys = drawing.points.map(p => p.y + (drawing.y || 0));
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      if (
        minX < x + width &&
        maxX > x &&
        minY < y + height &&
        maxY > y
      ) {
        selectedIds.push(drawing.id);
      }
    });

    onSelectItems(selectedIds);
    setMarquee(prev => ({ ...prev, isVisible: false }));
  }, [marquee, entities, drawings, onSelectItems]);

  return {
    marquee,
    startMarquee,
    updateMarquee,
    endMarquee
  };
}
