import { useCallback, useMemo } from 'react';
import { AnyCanvasEntity, UseCanvasPostItStyleOptions } from '@/shared/types';

/**
 * Hook para gerenciar a personalização visual (CSS/Estilo) dos Post-its no Canvas.
 */
export function useCanvasPostItStyle({
  selectedItemId,
  entities,
  onUpdate
}: UseCanvasPostItStyleOptions) {
  
  const selectedPostItEntity = useMemo(() => 
    entities.find((e) => e.id === selectedItemId && e.type === "postit"),
  [entities, selectedItemId]);

  const updateSelectedPostItStyle = useCallback((
    styleUpdates: Record<string, string | number>,
  ) => {
    if (!selectedItemId || !selectedPostItEntity) return;

    const updates: Partial<AnyCanvasEntity> = {
      style: { ...selectedPostItEntity.style, ...styleUpdates },
    };

    onUpdate(selectedItemId, updates);
  }, [selectedItemId, selectedPostItEntity, onUpdate]);

  const handleFontSizeChange = useCallback((increment: number) => {
    if (!selectedPostItEntity || !selectedItemId) return;
    const currentSize = parseInt((selectedPostItEntity.style?.fontSize as string) || "18") || 18;
    const newSize = Math.max(8, Math.min(72, currentSize + increment));
    updateSelectedPostItStyle({ fontSize: `${newSize}px` });
  }, [selectedPostItEntity, selectedItemId, updateSelectedPostItStyle]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    if (!selectedPostItEntity || !selectedItemId) return;
    updateSelectedPostItStyle({ fontFamily });
  }, [selectedPostItEntity, selectedItemId, updateSelectedPostItStyle]);

  const toggleBold = useCallback(() => {
    if (!selectedPostItEntity || !selectedItemId) return;
    const currentWeight = selectedPostItEntity.style?.fontWeight || '500';
    const newWeight = currentWeight === 'bold' || currentWeight === '600' || currentWeight === '700' ? '500' : 'bold';
    updateSelectedPostItStyle({ fontWeight: newWeight });
  }, [selectedPostItEntity, selectedItemId, updateSelectedPostItStyle]);

  return {
    selectedPostItEntity,
    updateSelectedPostItStyle,
    handleFontSizeChange,
    handleFontFamilyChange,
    toggleBold
  };
}
