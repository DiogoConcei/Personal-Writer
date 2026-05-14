import { useCallback } from 'react';
import { useTransformable } from '@/shared/hooks/useTransformable/useTransformable';
import { AnyCanvasEntity, UseCanvasEntityOptions } from '@/shared/types';

/**
 * Hook centralizado para gerenciar a lógica de uma entidade no Canvas.
 */
export function useCanvasEntity({
  entity,
  onSelect,
  onUpdate,
  onRemove,
  onStart,
  onEnd,
  minWidth = 50,
  minHeight = 50
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
    onStart,
    onEnd,
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
