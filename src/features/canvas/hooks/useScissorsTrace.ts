import { useState, useCallback, useRef } from 'react';
import { Point } from '@/shared/types';

interface UseScissorsTraceProps {

  isEnabled: boolean;
  mode?: 'path' | 'square';
  fadeDelay?: number;
}

/**
 * Hook modular para gerenciar o rastro de uma "tesoura" ou "corte livre".
 * Suporta modo de rastro livre (path) ou forma geométrica (square).
 */
export function useScissorsTrace({ isEnabled, mode = 'path', fadeDelay = 200 }: UseScissorsTraceProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startTrace = useCallback((e: React.MouseEvent) => {
    if (!isEnabled || !containerRef.current) return;

    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([{ x, y }]);
  }, [isEnabled]);

  const updateTrace = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isEnabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints((prev) => {
      if (prev.length === 0) return [{ x, y }];
      
      if (mode === 'path') {
        return [...prev, { x, y }];
      } else {
        // Garante que prev[0] existe antes de retornar o par do quadrado
        return [prev[0], { x, y }];
      }
    });
  }, [isDragging, isEnabled, mode]);

  const stopTrace = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    // Efeito de rastro volátil: limpa os pontos após um curto delay
    if (fadeDelay > 0) {
      setTimeout(() => {
        setPoints([]);
      }, fadeDelay);
    } else if (fadeDelay === 0) {
      setPoints([]);
    }
    // Se fadeDelay < 0, os pontos persistem (modo confirmação)
  }, [isDragging, fadeDelay]);

  const clearTrace = useCallback(() => setPoints([]), []);

  return {
    points,
    isDragging,
    containerRef,
    clearTrace,
    handlers: {
      onMouseDown: startTrace,
      onMouseMove: updateTrace,
      onMouseUp: stopTrace,
      onMouseLeave: stopTrace,
    }
  };
}
