import { useCallback } from 'react';
import { useTransformable } from '@/shared/hooks/useTransformable/useTransformable';
import { AnyCanvasEntity } from '@/shared/types';

interface UseCanvasEntityOptions {
  entity: AnyCanvasEntity;
  onSelect?: () => void;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onRemove: (id: string) => void;
  minWidth?: number;
  minHeight?: number;
}

/**
 * Hook centralizado para gerenciar a lógica de uma entidade no Canvas.
 * Encapsula transformações (mover, redimensionar, rotacionar) e ações comuns.
 */
export function useCanvasEntity({
  entity,
  onSelect,
  onUpdate,
  onRemove,
  minWidth = 150,
  minHeight = 150,
}: UseCanvasEntityOptions) {
  
  const handleUpdate = useCallback((updates: Partial<AnyCanvasEntity>) => {
    onUpdate(entity.id, updates);
  }, [entity.id, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(entity.id);
  }, [entity.id, onRemove]);

  // Integração com o hook de transformações base
  const { handleMouseDown, handleResizeStart, handleRotateStart } = useTransformable({
    x: entity.x,
    y: entity.y,
    width: entity.width || 200,
    height: entity.height || 200,
    minWidth,
    minHeight,
    onSelect,
    onUpdate: handleUpdate,
  });

  return {
    handleMouseDown,
    handleResizeStart,
    handleRotateStart,
    handleRemove,
    handleUpdate,
  };
}
