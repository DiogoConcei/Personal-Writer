import { useState, useCallback, RefObject } from 'react';
import { AnyCanvasEntity, ImageData, PdfData, NoteData } from '@/shared/types';
import { resolveAssetPath } from '@/tauri-bridge/fs';

interface ViewState {
  x: number;
  y: number;
}

interface UseCanvasEntitiesOptions {
  zoom: number;
  viewState: ViewState;
  containerRef: RefObject<HTMLDivElement | null>;
  rootPath: string | null;
}

/**
 * Hook para gerenciar a criação, atualização e posicionamento espacial
 * das entidades no Infinite Canvas.
 */
export function useCanvasEntities({
  zoom,
  viewState,
  containerRef,
  rootPath
}: UseCanvasEntitiesOptions) {
  const [entities, setEntities] = useState<AnyCanvasEntity[]>([]);

  // Auxiliar para calcular o centro do viewport no "espaço do mundo"
  const getCanvasCenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const canvasWidth = container.clientWidth;
    const canvasHeight = container.clientHeight;

    return {
      x: (canvasWidth / 2 - viewState.x) / zoom,
      y: (canvasHeight / 2 - viewState.y) / zoom
    };
  }, [viewState, zoom, containerRef]);

  const addNote = useCallback((path: string, name: string) => {
    const center = getCanvasCenter();
    // Tamanho A4 padrão definido nas configurações
    const cardWidth = 420;
    const cardHeight = 594;

    const newEntity: AnyCanvasEntity = {
      id: `note-${Math.random().toString(36).substring(2, 9)}`,
      type: 'note',
      x: center.x - (cardWidth / 2),
      y: center.y - (cardHeight / 2),
      width: cardWidth,
      height: cardHeight,
      rotation: 0,
      zIndex: entities.length + 1,
      style: {
        fontSize: '14px',
        padding: '24px',
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-bg-elevated)'
      },
      data: {
        noteId: path,
        title: name,
        startPage: 1,
        endPage: 0,
        totalPages: 0
      } as NoteData
    };

    setEntities(prev => [...prev, newEntity]);
    return newEntity.id;
  }, [entities.length, getCanvasCenter]);

  const addImage = useCallback((path: string) => {
    const img = new Image();
    img.onload = () => {
      const center = getCanvasCenter();
      const defaultWidth = 300;
      const ratio = defaultWidth / img.naturalWidth;
      const finalHeight = img.naturalHeight * ratio;

      const newEntity: AnyCanvasEntity = {
        id: `img-${Math.random().toString(36).substring(2, 9)}`,
        type: 'image',
        x: center.x - (defaultWidth / 2),
        y: center.y - (finalHeight / 2),
        width: defaultWidth,
        height: finalHeight,
        rotation: 0,
        zIndex: entities.length + 1,
        data: { 
          path, 
          naturalWidth: img.naturalWidth, 
          naturalHeight: img.naturalHeight 
        } as ImageData
      };

      setEntities(prev => [...prev, newEntity]);
    };
    img.src = resolveAssetPath(path, rootPath);
  }, [entities.length, getCanvasCenter, rootPath]);

  const addPdf = useCallback((path: string) => {
    const center = getCanvasCenter();
    const cardWidth = 200;

    const newEntity: AnyCanvasEntity = {
      id: `pdf-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pdf',
      x: center.x - (cardWidth / 2),
      y: center.y - 120,
      width: cardWidth,
      height: 280,
      rotation: 0,
      zIndex: entities.length + 1,
      data: {
        path,
        startPage: 1,
        endPage: 0,
        totalPages: 0
      } as PdfData
    };

    setEntities(prev => [...prev, newEntity]);
  }, [entities.length, getCanvasCenter]);

  const updateEntity = useCallback((id: string, updates: Partial<AnyCanvasEntity>) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const removeEntity = useCallback((id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setEntities(prev => {
      const maxZ = Math.max(0, ...prev.map(e => e.zIndex || 0));
      return prev.map(e => e.id === id ? { ...e, zIndex: maxZ + 1 } : e);
    });
  }, []);

  return {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    updateEntity,
    removeEntity,
    bringToFront
  };
}
