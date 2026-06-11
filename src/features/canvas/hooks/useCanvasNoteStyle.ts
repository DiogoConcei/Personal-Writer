import { useCallback, useMemo } from 'react';
import { AnyCanvasEntity, UseCanvasNoteStyleOptions } from '@/shared/types';

/**
 * Hook para gerenciar a personalização visual (CSS/Estilo) das notas no Canvas.
 */
export function useCanvasNoteStyle({
  selectedItemId,
  entities,
  onUpdate
}: UseCanvasNoteStyleOptions) {
  
  const selectedNoteEntity = useMemo(() => 
    entities.find((e) => e.id === selectedItemId && (e.type === "note" || e.type === "page")),
  [entities, selectedItemId]);

  const updateSelectedNoteStyle = useCallback((
    styleUpdates: Record<string, string | number>,
  ) => {
    if (!selectedItemId || !selectedNoteEntity) return;

    const { width, height, ...cleanStyleUpdates } = styleUpdates;

    const updates: Partial<AnyCanvasEntity> = {
      style: { ...selectedNoteEntity.style, ...cleanStyleUpdates },
    };

    if (width !== undefined) updates.width = width as number;
    if (height !== undefined) updates.height = height as number;

    onUpdate(selectedItemId, updates);
  }, [selectedItemId, selectedNoteEntity, onUpdate]);

  const handleFontSizeChange = useCallback((increment: number) => {
    if (!selectedNoteEntity || !selectedItemId) return;
    
    const currentSize = parseInt(
      (selectedNoteEntity.style?.fontSize as string) || "14",
      10,
    );
    const newSize = Math.max(8, Math.min(72, currentSize + increment));
    updateSelectedNoteStyle({ fontSize: `${newSize}px` });
  }, [selectedNoteEntity, selectedItemId, updateSelectedNoteStyle]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    if (!selectedNoteEntity || !selectedItemId) return;
    updateSelectedNoteStyle({ fontFamily });
  }, [selectedNoteEntity, selectedItemId, updateSelectedNoteStyle]);

  const toggleBold = useCallback(() => {
    if (!selectedNoteEntity || !selectedItemId) return;
    const currentWeight = selectedNoteEntity.style?.fontWeight || 'normal';
    const newWeight = currentWeight === 'bold' || currentWeight === '600' || currentWeight === '700' ? 'normal' : 'bold';
    updateSelectedNoteStyle({ fontWeight: newWeight });
  }, [selectedNoteEntity, selectedItemId, updateSelectedNoteStyle]);

  return {
    selectedNoteEntity,
    updateSelectedNoteStyle,
    handleFontSizeChange,
    handleFontFamilyChange,
    toggleBold
  };
}
