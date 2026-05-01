import { useCallback } from 'react';
import { AnyCanvasEntity, SplitActionData, SplittingItem } from '@/shared/types';
import { calculateSplitEntities } from '../utils/canvasSplitUtils';

interface UseCanvasSplitProps {
  entities: AnyCanvasEntity[];
  setEntities: React.Dispatch<React.SetStateAction<AnyCanvasEntity[]>>;
}

/**
 * Hook para gerenciar a lógica de corte (split) no Canvas.
 * Integra a lógica pura do utils com o estado do React.
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
