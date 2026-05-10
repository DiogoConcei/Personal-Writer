import { useState, useCallback, useEffect, useRef } from 'react';

interface ViewState {
  x: number;
  y: number;
}

interface UseMesaViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook para gerenciar Navegação Espacial (Zoom e Pan) na Mesa de Trabalho.
 * Implementa Zoom com Ctrl + Scroll e Pan com Espaço + Drag.
 */
export function useMesaViewport({ containerRef }: UseMesaViewportOptions) {
  const [zoom, setZoom] = useState(1);
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isPanModeActive, setIsPanModeActive] = useState(false);
  
  const lastMousePos = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  }, []);

  // 1. Controle de Zoom (Ctrl + Scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = -e.deltaY;
        const zoomStep = 0.1;
        const factor = delta > 0 ? 1 + zoomStep : 1 - zoomStep;
        
        const newZoom = Math.min(Math.max(zoom * factor, 0.1), 5);
        
        // Opcional: Zoom em direção ao mouse
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Ponto no canvas antes do zoom
        const canvasX = (mouseX - viewState.x) / zoom;
        const canvasY = (mouseY - viewState.y) / zoom;

        // Novo viewState para manter o ponto sob o mouse
        setViewState({
          x: mouseX - canvasX * newZoom,
          y: mouseY - canvasY * newZoom
        });
        
        setZoom(newZoom);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, zoom, viewState]);

  // 2. Controle da Tecla Espaço
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input ou textarea
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

  // 3. Controle de Pan (Drag)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((isSpacePressed || isPanModeActive) && e.button === 0) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isSpacePressed, isPanModeActive]);

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
   * Converte coordenadas de tela (clientX/Y) para coordenadas de canvas,
   * considerando o zoom e o pan atuais.
   */
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewState.x) / zoom,
      y: (clientY - rect.top - viewState.y) / zoom
    };
  }, [containerRef, viewState, zoom]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setViewState({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    viewState,
    isPanning,
    isSpacePressed,
    isPanModeActive,
    setIsPanModeActive,
    zoomIn,
    zoomOut,
    handleMouseDown,
    screenToCanvas,
    handleResetView
  };
}
