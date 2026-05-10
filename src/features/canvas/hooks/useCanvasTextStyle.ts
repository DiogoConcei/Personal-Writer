import { useCallback, useMemo } from 'react';
import { AnyCanvasEntity } from '@/shared/types';

interface UseCanvasTextStyleOptions {
  selectedItemId: string | null;
  entities: AnyCanvasEntity[];
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
}

/**
 * Hook para gerenciar a personalização visual (CSS/Estilo) dos textos no Canvas.
 */
export function useCanvasTextStyle({
  selectedItemId,
  entities,
  onUpdate
}: UseCanvasTextStyleOptions) {
  
  const selectedTextEntity = useMemo(() => 
    entities.find((e) => e.id === selectedItemId && e.type === "text"),
  [entities, selectedItemId]);

  const updateSelectedTextStyle = useCallback((
    styleUpdates: Record<string, string | number>,
  ) => {
    if (!selectedItemId || !selectedTextEntity) return;

    const updates: Partial<AnyCanvasEntity> = {
      style: { ...selectedTextEntity.style, ...styleUpdates },
    };

    onUpdate(selectedItemId, updates);
  }, [selectedItemId, selectedTextEntity, onUpdate]);

  const handleFontSizeChange = useCallback((newSize: number) => {
    if (!selectedTextEntity || !selectedItemId) return;
    updateSelectedTextStyle({ fontSize: `${newSize}px` });
  }, [selectedTextEntity, selectedItemId, updateSelectedTextStyle]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    if (!selectedTextEntity || !selectedItemId) return;
    updateSelectedTextStyle({ fontFamily });
  }, [selectedTextEntity, selectedItemId, updateSelectedTextStyle]);

  const toggleBold = useCallback(() => {
    if (!selectedTextEntity || !selectedItemId) return;
    const currentWeight = selectedTextEntity.style?.fontWeight || 'normal';
    const newWeight = currentWeight === 'bold' || currentWeight === '600' || currentWeight === '700' ? 'normal' : 'bold';
    updateSelectedTextStyle({ fontWeight: newWeight });
  }, [selectedTextEntity, selectedItemId, updateSelectedTextStyle]);

  return {
    selectedTextEntity,
    updateSelectedTextStyle,
    handleFontSizeChange,
    handleFontFamilyChange,
    toggleBold
  };
}
