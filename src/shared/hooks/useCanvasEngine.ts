import { useState, useCallback, useEffect, useRef, RefObject } from 'react';
import { ViewState, UseCanvasEngineOptions } from '@/shared/types';

/**
 * Motor unificado de Canvas para gerenciamento de Zoom, Pan e Coordenadas.
 * Unifica as funcionalidades do InfiniteCanvas e da MesaTrabalho.
 * 
 * Oferece:
 * - Zoom suave com Ctrl+Scroll (focado no mouse)
 * - Pan com Barra de Espaço + Drag ou Botão do Meio
 * - Conversão de coordenadas (Tela para Canvas)
 * - Culling (identificação de itens visíveis)
 */
export function useCanvasEngine({
  containerRef,
  initialZoom = 1,
  minZoom = 0.1,
  maxZoom = 5,
  zoomStep = 0.1,
}: UseCanvasEngineOptions) {
  const [zoom, setZoom] = useState(initialZoom);
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
  const lastMousePos = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const next = prev + zoomStep;
      return next <= maxZoom ? Number(next.toFixed(2)) : maxZoom;
    });
  }, [maxZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const next = prev - zoomStep;
      return next >= minZoom ? Number(next.toFixed(2)) : minZoom;
    });
  }, [minZoom, zoomStep]);

  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setViewState({ x: 0, y: 0 });
  }, [initialZoom]);

  // 1. Controle de Zoom (Ctrl + Scroll) com foco no mouse
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1 + 0.1 : 1 - 0.1;
        
        const newZoom = Math.min(Math.max(zoom * factor, minZoom), maxZoom);
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Ponto no canvas antes do zoom
        const canvasX = (mouseX - viewState.x) / zoom;
        const canvasY = (mouseY - viewState.y) / zoom;

        // Ajusta viewState para manter o ponto sob o mouse
        setViewState({
          x: mouseX - canvasX * newZoom,
          y: mouseY - canvasY * newZoom
        });
        
        setZoom(Number(newZoom.toFixed(2)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, zoom, viewState, minZoom, maxZoom]);

  // 2. Controle da Tecla Espaço (Pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) return;

      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // 3. Lógica de Pan (Drag)
  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent, forcePan = false) => {
    const isMiddleMouse = (e as MouseEvent).button === 1;
    const isLeftMouse = (e as MouseEvent).button === 0;

    if (forcePan || isMiddleMouse || (isSpacePressed && isLeftMouse)) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return true;
    }
    return false;
  }, [isSpacePressed]);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      setViewState(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  /**
   * Converte coordenadas de tela para coordenadas de canvas.
   */
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewState.x) / zoom,
      y: (clientY - rect.top - viewState.y) / zoom
    };
  }, [containerRef, viewState, zoom]);

  /**
   * Filtra itens visíveis no viewport (Culling).
   */
  const getVisibleItems = useCallback(<T extends { x: number; y: number; width?: number; height?: number }>(items: T[], buffer = 500) => {
    if (!containerRef.current) return items;

    const viewportWidth = containerRef.current.clientWidth / zoom;
    const viewportHeight = containerRef.current.clientHeight / zoom;
    
    const minX = -viewState.x / zoom;
    const minY = -viewState.y / zoom;
    const maxX = minX + viewportWidth;
    const maxY = minY + viewportHeight;

    return items.filter((item) => {
      const width = item.width || 300;
      const height = item.height || 300;

      return (
        item.x + width > minX - buffer &&
        item.x < maxX + buffer &&
        item.y + height > minY - buffer &&
        item.y < maxY + buffer
      );
    });
  }, [viewState, zoom, containerRef]);

  return {
    zoom,
    setZoom,
    viewState,
    setViewState,
    isPanning,
    isSpacePressed,
    zoomIn,
    zoomOut,
    resetView,
    handleMouseDown,
    screenToCanvas,
    getVisibleItems,
    containerRef
  };
}
