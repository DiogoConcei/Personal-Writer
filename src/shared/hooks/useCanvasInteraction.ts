import { useCallback, RefObject } from 'react';
import { resolveAssetPath } from '@/tauri-bridge/fs';

interface ViewState {
  x: number;
  y: number;
}

interface CanvasEngine {
  zoom: number;
  viewState: ViewState;
  containerRef: RefObject<HTMLDivElement | null>;
  screenToCanvas: (clientX: number, clientY: number) => { x: number; y: number };
}

interface UseCanvasInteractionOptions {
  engine: CanvasEngine;
  rootPath: string | null;
  onAdd: (entityData: any) => string | void;
}

/**
 * Hook compartilhado para interações avançadas com o Canvas.
 * Centraliza lógica de:
 * - Adicionar itens no centro da visão
 * - Processar Drops de arquivos
 * - Cálculos espaciais de posicionamento para novos itens
 */
export function useCanvasInteraction({
  engine,
  rootPath,
  onAdd
}: UseCanvasInteractionOptions) {
  const { zoom, viewState, containerRef, screenToCanvas } = engine;

  /**
   * Calcula o centro do viewport no espaço do canvas.
   */
  const getCanvasCenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    return {
      x: (container.clientWidth / 2 - viewState.x) / zoom,
      y: (container.clientHeight / 2 - viewState.y) / zoom
    };
  }, [viewState, zoom, containerRef]);

  /**
   * Adiciona uma imagem calculando suas proporções originais.
   */
  const addImage = useCallback((path: string, position?: { x: number; y: number }) => {
    const img = new Image();
    img.onload = () => {
      const pos = position || getCanvasCenter();
      const defaultWidth = 300;
      const ratio = defaultWidth / img.naturalWidth;
      const finalHeight = img.naturalHeight * ratio;

      onAdd({
        type: 'image',
        path,
        x: pos.x - (defaultWidth / 2),
        y: pos.y - (finalHeight / 2),
        width: defaultWidth,
        height: finalHeight,
        scale: 1,
        rotation: 0,
        zIndex: 1,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
    };
    img.src = resolveAssetPath(path, rootPath);
  }, [getCanvasCenter, onAdd, rootPath]);

  /**
   * Adiciona uma nota/texto.
   */
  const addText = useCallback((data: { text?: string, title?: string }, position?: { x: number; y: number }) => {
    const pos = position || getCanvasCenter();
    const width = 400;
    const height = 250;

    return onAdd({
      type: 'text',
      ...data,
      x: pos.x - (width / 2),
      y: pos.y - (height / 2),
      width,
      height,
      scale: 1,
      rotation: 0,
      zIndex: 1
    });
  }, [getCanvasCenter, onAdd]);

  /**
   * Processa o drop de múltiplos arquivos.
   */
  const handleFileDrop = useCallback(async (paths: string[], screenPos: { x: number; y: number }) => {
    const { x, y } = screenToCanvas(screenPos.x, screenPos.y);
    
    for (const path of paths) {
      // Por enquanto focado em imagens, mas pode ser expandido para PDFs/Markdown
      if (path.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
        addImage(path, { x, y });
      }
    }
  }, [screenToCanvas, addImage]);

  return {
    getCanvasCenter,
    addImage,
    addText,
    handleFileDrop
  };
}
