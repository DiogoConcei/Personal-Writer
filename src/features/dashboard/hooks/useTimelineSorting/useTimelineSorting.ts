import { useMemo, useCallback } from 'react';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { Entity } from '@/shared/types';
import { useDragAndDrop } from '@/shared/hooks/useDragAndDrop/useDragAndDrop';

/**
 * Hook para gerenciar a ordenação dos personagens na linha do tempo.
 */
export function useTimelineSorting() {
  const { entities, updateEntitiesOrder } = useUniverseStore();

  const characters = useMemo(() => {
    return Object.values(entities)
      .filter(e => e.type === 'character')
      .sort((a, b) => {
        const orderA = (a.fields?.order as number) ?? Infinity;
        const orderB = (b.fields?.order as number) ?? Infinity;
        if (orderA === orderB) return a.name.localeCompare(b.name);
        return orderA - orderB;
      });
  }, [entities]);

  const handleDrop = useCallback(async (sourceItem: Entity, _targetType: string, targetId: string) => {
    const draggedPath = sourceItem.path;
    const dragOverPath = targetId;

    if (draggedPath === dragOverPath) return;

    const oldIndex = characters.findIndex(c => c.path === draggedPath);
    const newIndex = characters.findIndex(c => c.path === dragOverPath);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...characters];
      const [movedItem] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedItem);

      await updateEntitiesOrder(newOrder.map(c => c.path));
    }
  }, [characters, updateEntitiesOrder]);

  const {
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
    shouldIgnoreClick
  } = useDragAndDrop<Entity>({
    onDrop: handleDrop,
    isValidTarget: (item, _type, targetId) => item.path !== targetId
  });

  return {
    characters,
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
    shouldIgnoreClick
  };
}
