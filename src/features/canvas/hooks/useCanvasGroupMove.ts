import { useCallback } from 'react';
import { AnyCanvasEntity, UseCanvasGroupMoveProps } from '@/shared/types';
import { doRectanglesOverlap } from '@/shared/utils/ui';

/**
 * Hook especializado para gerenciar a movimentação de grupos e lógica de drop (colagem).
 */
export function useCanvasGroupMove({
  entities,
  drawings,
  setEntities,
  updateDrawing,
  handleUpdateEntity,
  isCollageConfirmed,
  activeCollageGroupId,
  takeSnapshot
}: UseCanvasGroupMoveProps) {
  
  const handleUpdateWithGroup = useCallback((id: string, updates: Partial<AnyCanvasEntity>) => {
    const draggingEntity = entities.find(e => e.id === id);
    
    if (!isCollageConfirmed && draggingEntity?.groupId && (updates.x !== undefined || updates.y !== undefined)) {
      setEntities(prev => {
        const currentEntity = prev.find(e => e.id === id);
        if (!currentEntity) return prev;

        const dx = updates.x !== undefined ? updates.x - currentEntity.x : 0;
        const dy = updates.y !== undefined ? updates.y - currentEntity.y : 0;
        
        const nextEntities = prev.map(e => {
          if (e.id === id) {
            return { ...e, ...updates };
          } else if (e.groupId === draggingEntity.groupId) {
            return {
              ...e,
              x: e.x + dx,
              y: e.y + dy
            };
          }
          return e;
        });

        if (dx !== 0 || dy !== 0) {
          drawings.forEach(d => {
            if (d.groupId === draggingEntity.groupId) {
              // OTIMIZAÇÃO: Atualiza apenas o offset (x, y) durante o drag
              // evitando o map() custoso em milhares de pontos
              updateDrawing(d.id, { 
                x: (d.x || 0) + dx, 
                y: (d.y || 0) + dy 
              });
            }
          });
        }

        return nextEntities;
      });
    } else {
      handleUpdateEntity(id, updates);
    }
  }, [entities, drawings, setEntities, updateDrawing, handleUpdateEntity, isCollageConfirmed]);

  const handleTransformEnd = useCallback((entityId: string) => {
    // "Bake" dos offsets de desenhos de volta para os pontos reais ao finalizar o movimento
    const movedEntity = entities.find(e => e.id === entityId);
    if (movedEntity?.groupId) {
      drawings.forEach(d => {
        if (d.groupId === movedEntity.groupId && (d.x || d.y)) {
          const offsetX = d.x || 0;
          const offsetY = d.y || 0;
          const newPoints = d.points.map(p => ({
            x: p.x + offsetX,
            y: p.y + offsetY
          }));
          updateDrawing(d.id, { 
            points: newPoints, 
            x: 0, 
            y: 0 
          });
        }
      });
    }

    if (isCollageConfirmed) {
      const movedItem = entities.find(e => e.id === entityId);
      if (!movedItem) return;

      const itemRect = { 
        x: movedItem.x, 
        y: movedItem.y, 
        width: (movedItem as any).width || 100, 
        height: (movedItem as any).height || 100 
      };

      const overlappingItem = entities.find(other => {
        if (other.id === movedItem.id) return false;
        if (other.type === 'page') return false; 
        
        const otherRect = { 
          x: other.x, 
          y: other.y, 
          width: (other as any).width || 100, 
          height: (other as any).height || 100 
        };
        return doRectanglesOverlap(itemRect, otherRect);
      });

      if (overlappingItem) {
        takeSnapshot({ entities, drawings });
        const targetGroupId = overlappingItem.groupId || activeCollageGroupId || `collage-${Math.random().toString(36).substring(2, 9)}`;
        
        if (!overlappingItem.groupId) {
          handleUpdateEntity(overlappingItem.id, { groupId: targetGroupId });
        }
        handleUpdateEntity(movedItem.id, { groupId: targetGroupId });
      } else if (movedItem.groupId) {
        takeSnapshot({ entities, drawings });
        handleUpdateEntity(movedItem.id, { groupId: undefined });
      }
    }
  }, [entities, isCollageConfirmed, activeCollageGroupId, handleUpdateEntity, takeSnapshot, drawings]);

  return { handleUpdateWithGroup, handleTransformEnd };
}
