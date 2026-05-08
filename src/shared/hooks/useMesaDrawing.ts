import { useState, useCallback, useRef } from 'react';
import { useMesaTrabalhoStore } from '@/features/universe/store/moodBoardStore';
import { MesaDrawing } from '@/shared/types';

interface UseMesaDrawingProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isEnabled: boolean;
  color?: string;
  width?: number;
}

export function useMesaDrawing({ containerRef, isEnabled, color = '#ef4444', width = 3 }: UseMesaDrawingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentDrawingId = useRef<string | null>(null);
  const addDrawing = useMesaTrabalhoStore(state => state.addDrawing);
  const updateDrawing = useMesaTrabalhoStore(state => state.updateDrawing);

  const getCoordinates = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [containerRef]);

  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (!isEnabled) return;
    
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const id = crypto.randomUUID();
    currentDrawingId.current = id;

    const newDrawing: MesaDrawing = {
      id,
      points: [coords],
      color,
      width,
      opacity: 1
    };

    addDrawing(newDrawing);
  }, [isEnabled, color, width, getCoordinates, addDrawing]);

  const draw = useCallback((e: MouseEvent) => {
    if (!isDrawing || !currentDrawingId.current || !isEnabled) return;

    const coords = getCoordinates(e);
    const drawings = useMesaTrabalhoStore.getState().drawings;
    const current = drawings.find(d => d.id === currentDrawingId.current);

    if (current) {
      updateDrawing(currentDrawingId.current, {
        points: [...current.points, coords]
      });
    }
  }, [isDrawing, isEnabled, getCoordinates, updateDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    currentDrawingId.current = null;
  }, []);

  return {
    isDrawing,
    startDrawing,
    draw,
    stopDrawing
  };
}
