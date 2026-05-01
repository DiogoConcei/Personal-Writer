import { useState, useCallback, RefObject } from 'react';
import { AnyCanvasEntity } from '@/shared/types';

interface ViewState {
  x: number;
  y: number;
}

interface UseCanvasViewportOptions {
  zoom: number;
  resetZoom: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Hook para gerenciar a navegação (Pan/Zoom) e a visibilidade das entidades no Canvas.
 */
export function useCanvasViewport({
  zoom,
  resetZoom,
  containerRef
}: UseCanvasViewportOptions) {
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const handleReset = useCallback(() => {
    resetZoom();
    setViewState({ x: 0, y: 0 });
  }, [resetZoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Só inicia pan se for o botão esquerdo e clicar diretamente no grid/fundo
    if (e.button !== 0 || e.target !== containerRef.current?.firstChild) return;

    setIsPanning(true);
    const startX = e.clientX - viewState.x;
    const startY = e.clientY - viewState.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setViewState({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const onMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [viewState, containerRef]);

  /**
   * Filtra entidades que estão visíveis ou próximas ao viewport (Culling/Virtualização).
   */
  const getVisibleEntities = useCallback((entities: AnyCanvasEntity[]) => {
    if (!containerRef.current) return entities;

    const viewportWidth = containerRef.current.clientWidth / zoom;
    const viewportHeight = containerRef.current.clientHeight / zoom;
    
    const minX = -viewState.x / zoom;
    const minY = -viewState.y / zoom;
    const maxX = minX + viewportWidth;
    const maxY = minY + viewportHeight;

    const buffer = 500; // Margem de segurança para evitar pop-in ao mover

    return entities.filter((entity) => {
      const entityWidth = entity.width || 300;
      const entityHeight = entity.height || 300;

      return (
        entity.x + entityWidth > minX - buffer &&
        entity.x < maxX + buffer &&
        entity.y + entityHeight > minY - buffer &&
        entity.y < maxY + buffer
      );
    });
  }, [viewState, zoom, containerRef]);

  return {
    viewState,
    isPanning,
    handleCanvasMouseDown,
    handleReset,
    getVisibleEntities
  };
}
