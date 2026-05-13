import { useState, useCallback, RefObject } from 'react';
import { AnyCanvasEntity, ImageData, PdfData, NoteData, TextData, PostItData, PageData } from '@/shared/types';
import { useCanvasInteraction } from '@/shared/hooks/useCanvasInteraction';

interface ViewState {
  x: number;
  y: number;
}

interface UseCanvasEntitiesOptions {
  zoom: number;
  viewState: ViewState;
  containerRef: RefObject<HTMLDivElement | null>;
  rootPath: string | null;
  activeGroupId?: string | null;
}

export function useCanvasEntities({
  zoom,
  viewState,
  containerRef,
  rootPath,
  activeGroupId
}: UseCanvasEntitiesOptions) {
  const [entities, setEntities] = useState<AnyCanvasEntity[]>([]);

  // Engine adapter para o useCanvasInteraction
  const engine = {
    zoom,
    viewState,
    containerRef,
    screenToCanvas: (cx: number, cy: number) => {
      if (!containerRef.current) return { x: cx, y: cy };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (cx - rect.left - viewState.x) / zoom,
        y: (cy - rect.top - viewState.y) / zoom
      };
    }
  };

  const { addImage: internalAddImage, addText: internalAddText, getCanvasCenter } = useCanvasInteraction({
    engine,
    rootPath,
    onAdd: (data) => {
      const id = `${data.type}-${Math.random().toString(36).substring(2, 9)}`;
      let newEntity: AnyCanvasEntity;

      if (data.type === 'image') {
        newEntity = {
          id,
          type: 'image',
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          rotation: 0,
          zIndex: entities.length + 1,
          groupId: activeGroupId || undefined,
          data: { 
            path: data.path, 
            naturalWidth: data.naturalWidth, 
            naturalHeight: data.naturalHeight 
          } as ImageData
        };
      } else if (data.type === 'text') {
        if (data.noteId) {
          // Se tiver noteId, é uma nota vinculada a arquivo
          newEntity = {
            id,
            type: 'note',
            x: data.x,
            y: data.y,
            width: 420, // A4 ratio default
            height: 594,
            rotation: 0,
            zIndex: entities.length + 1,
            groupId: activeGroupId || undefined,
            style: {
              fontSize: '14px',
              padding: '24px',
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-elevated)'
            },
            data: {
              noteId: data.noteId,
              title: data.title || 'Nota',
              startPage: 1,
              endPage: 0,
              totalPages: 0
            } as NoteData
          };
        } else {
          // Texto simples (mesmo comportamento do Universo)
          newEntity = {
            id,
            type: 'text',
            x: data.x,
            y: data.y,
            width: 200,
            height: 60,
            rotation: 0,
            zIndex: entities.length + 1,
            groupId: activeGroupId || undefined,
            style: {
              fontSize: '1.2rem',
              color: 'var(--color-text-primary)',
              fontWeight: '600',
              textAlign: 'left'
            },
            data: {
              text: data.text || ''
            } as TextData
          };
        }
      } else {
        return '';
      }

      setEntities(prev => [...prev, newEntity]);
      return id;
    }
  });

  const addNote = useCallback((path: string, name: string) => {
    // Reutiliza a lógica unificada passando os dados específicos de nota
    return internalAddText({ title: name, noteId: path } as any) as string;
  }, [internalAddText]);

  const addImage = internalAddImage;

  const addPdf = useCallback((path: string) => {
    const center = getCanvasCenter();
    const cardWidth = 200;
    const id = `pdf-${Math.random().toString(36).substring(2, 9)}`;

    const newEntity: AnyCanvasEntity = {
      id,
      type: 'pdf',
      x: center.x - (cardWidth / 2),
      y: center.y - 140,
      width: cardWidth,
      height: 280,
      rotation: 0,
      zIndex: entities.length + 1,
      groupId: activeGroupId || undefined,
      data: {
        path,
        startPage: 1,
        endPage: 0,
        totalPages: 0
      } as PdfData
    };

    setEntities(prev => [...prev, newEntity]);
    return id;
  }, [entities.length, getCanvasCenter, activeGroupId]);

  const addPostIt = useCallback(() => {
    const center = getCanvasCenter();
    const id = `postit-${Math.random().toString(36).substring(2, 9)}`;
    const newEntity: AnyCanvasEntity = {
      id,
      type: 'postit',
      x: center.x - 100,
      y: center.y - 100,
      width: 200,
      height: 200,
      rotation: 0,
      zIndex: entities.length + 1,
      groupId: activeGroupId || undefined,
      data: {
        text: '',
        color: '#fef3c7'
      } as PostItData
    };
    setEntities(prev => [...prev, newEntity]);
    return id;
  }, [entities.length, getCanvasCenter, activeGroupId]);

  const addPage = useCallback(() => {
    const center = getCanvasCenter();
    const id = `page-${Math.random().toString(36).substring(2, 9)}`;
    const newEntity: AnyCanvasEntity = {
      id,
      type: 'page',
      x: center.x - 400,
      y: center.y - 300,
      width: 800,
      height: 600,
      rotation: 0,
      zIndex: 0, // Páginas ficam atrás por padrão
      data: {
        title: 'Nova Página'
      } as PageData
    };
    setEntities(prev => [...prev, newEntity]);
    return id;
  }, [getCanvasCenter]);

  const addPendingCollage = useCallback((sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => {
    const id = `image-${Math.random().toString(36).substring(2, 9)}`;
    const newEntity: AnyCanvasEntity = {
      id,
      type: 'image',
      // Posiciona ao lado da entidade original
      x: sourceEntity.x + (sourceEntity.width as number || 400) + 40, 
      y: sourceEntity.y + boundingBox.y,
      width: boundingBox.width,
      height: boundingBox.height,
      rotation: sourceEntity.rotation || 0,
      zIndex: entities.length + 1,
      groupId: activeGroupId || undefined,
      data: {
        path: '', 
        isPending: true,
        progress: 0,
        isCrop: true
      } as ImageData
    };
    setEntities(prev => [...prev, newEntity]);
    return id;
  }, [entities.length, activeGroupId]);

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

  const sendToBack = useCallback((id: string) => {
    setEntities(prev => {
      const minZ = Math.min(0, ...prev.map(e => e.zIndex || 0));
      return prev.map(e => e.id === id ? { ...e, zIndex: minZ - 1 } : e);
    });
  }, []);

  return {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    addText: internalAddText,
    addPostIt,
    addPage,
    addPendingCollage,
    updateEntity,
    removeEntity,
    bringToFront,
    sendToBack
  };
}

