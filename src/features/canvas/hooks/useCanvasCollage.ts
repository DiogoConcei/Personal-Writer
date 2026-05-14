import { useCallback } from 'react';
import { AnyCanvasEntity, UseCanvasCollageProps } from '@/shared/types';
import { doRectanglesOverlap } from '@/shared/utils/ui';

export function useCanvasCollage({
  entities,
  drawings,
  selectedItemIds,
  setEntities,
  updateDrawing,
  addPendingCollage,
  setActiveCollageGroupId,
  setIsCollageConfirmed,
  setSelectedItemIds,
  setSelectedItemId,
  activateSelect,
  takeSnapshot
}: UseCanvasCollageProps) {

  const handleConfirmCollage = useCallback(() => {
    if (selectedItemIds.length > 0) {
      takeSnapshot({ entities, drawings });
      
      const itemsToGroup = selectedItemIds.filter(id => {
        const item = [...entities, ...drawings].find(e => e.id === id);
        if (!item) return false;

        const itemRect = { 
          x: item.x || 0, 
          y: item.y || 0, 
          width: (item as any).width || 100, 
          height: (item as any).height || 100 
        };

        return selectedItemIds.some(otherId => {
          if (id === otherId) return false;
          const otherItem = [...entities, ...drawings].find(e => e.id === otherId);
          if (!otherItem) return false;

          const otherRect = { 
            x: otherItem.x || 0, 
            y: otherItem.y || 0, 
            width: (otherItem as any).width || 100, 
            height: (otherItem as any).height || 100 
          };

          return doRectanglesOverlap(itemRect, otherRect);
        });
      });

      if (itemsToGroup.length < 2) {
        setIsCollageConfirmed(true);
        setSelectedItemIds([]);
        setSelectedItemId(null);
        activateSelect();
        return;
      }

      const existingGroupItem = [...entities, ...drawings].find(e => itemsToGroup.includes(e.id) && e.groupId);
      const groupId = existingGroupItem?.groupId || `collage-${Math.random().toString(36).substring(2, 9)}`;

      setActiveCollageGroupId(groupId);

      setEntities(prev => prev.map(e => 
        itemsToGroup.includes(e.id) ? { ...e, groupId } : e
      ));

      drawings.forEach(d => {
        if (itemsToGroup.includes(d.id)) {
          updateDrawing(d.id, { groupId });
        }
      });

      setIsCollageConfirmed(true);
      setSelectedItemIds([]);
      setSelectedItemId(null);
      activateSelect();
    }
  }, [selectedItemIds, entities, drawings, takeSnapshot, setIsCollageConfirmed, setSelectedItemIds, setSelectedItemId, activateSelect, setActiveCollageGroupId, setEntities, updateDrawing]);

  const handleFinalizeCollage = useCallback(() => {
    setIsCollageConfirmed(false);
    setActiveCollageGroupId(null);
    setSelectedItemIds([]);
    setSelectedItemId(null);
    activateSelect();
  }, [setIsCollageConfirmed, setActiveCollageGroupId, setSelectedItemIds, setSelectedItemId, activateSelect]);

  const handleCancelCollage = useCallback(() => {
    setIsCollageConfirmed(false);
    setActiveCollageGroupId(null);
    setSelectedItemIds([]);
    setSelectedItemId(null);
    activateSelect();
  }, [setIsCollageConfirmed, setActiveCollageGroupId, setSelectedItemIds, setSelectedItemId, activateSelect]);

  const handleAddPendingCollage = useCallback((sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => {
    takeSnapshot({ entities, drawings });
    return addPendingCollage(sourceEntity, boundingBox);
  }, [takeSnapshot, entities, drawings, addPendingCollage]);

  return {
    handleConfirmCollage,
    handleFinalizeCollage,
    handleCancelCollage,
    handleAddPendingCollage
  };
}
