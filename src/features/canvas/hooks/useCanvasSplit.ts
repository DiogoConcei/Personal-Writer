import { useCallback } from 'react';
import { SplitActionData, SplittingItem, UseCanvasSplitProps } from '@/shared/types';
import { calculateSplitEntities } from '../utils/canvasSplitUtils';

/**
 * Hook para gerenciar a lógica de corte (split) no Canvas.
 */
export function useCanvasSplit({ entities, setEntities }: UseCanvasSplitProps) {
  const performSplit = useCallback((splittingItem: SplittingItem | null, data: SplitActionData) => {
    if (!splittingItem) return;

    const original = entities.find((e) => e.id === splittingItem.id);
    if (!original) return;

    const newEntities = calculateSplitEntities(original, data, entities.length);

    if (newEntities.length > 0) {
      setEntities((prev) => {
        const filtered = prev.filter((e) => e.id !== original.id);
        return [...filtered, ...newEntities];
      });
    }
  }, [entities, setEntities]);

  return { performSplit };
}
