import { useState, useCallback, useRef } from 'react';
import { MesaDrawing } from '@/shared/types';

interface UseCanvasDrawingProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isEnabled: boolean;
  color?: string;
  width?: number;
  zoom?: number;
  viewState?: { x: number, y: number };
  onAddDrawing: (drawing: MesaDrawing) => void;
  onAddPoint: (id: string, point: { x: number, y: number }) => void;
}

export function useCanvasDrawing({ 
  containerRef, 
  isEnabled, 
  color = '#ef4444', 
  width = 3,
  zoom = 1,
  viewState = { x: 0, y: 0 },
  onAddDrawing,
  onAddPoint
}: UseCanvasDrawingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentDrawingId = useRef<string | null>(null);

  const getCoordinates = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewState.x) / zoom,
      y: (e.clientY - rect.top - viewState.y) / zoom
    };
  }, [containerRef, zoom, viewState]);

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

    onAddDrawing(newDrawing);
  }, [isEnabled, color, width, getCoordinates, onAddDrawing]);

  const draw = useCallback((e: MouseEvent) => {
    if (!isDrawing || !currentDrawingId.current || !isEnabled) return;

    const coords = getCoordinates(e);
    onAddPoint(currentDrawingId.current, coords);
  }, [isDrawing, isEnabled, getCoordinates, onAddPoint]);

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
