import { useState, useCallback } from 'react';
import { GallerySelectionState } from '@/shared/types';

/**
 * Hook para gerenciar a seleção múltipla na Galeria de Imagens.
 */
export function useGallerySelection() {
  const [state, setState] = useState<GallerySelectionState>({
    isSelectionMode: false,
    selectedPaths: [],
  });

  const toggleSelectionMode = useCallback((active?: boolean) => {
    setState(prev => ({
      isSelectionMode: active !== undefined ? active : !prev.isSelectionMode,
      selectedPaths: [],
    }));
  }, []);

  const togglePath = useCallback((path: string) => {
    setState(prev => {
      const isSelected = prev.selectedPaths.includes(path);
      return {
        ...prev,
        selectedPaths: isSelected 
          ? prev.selectedPaths.filter(p => p !== path) 
          : [...prev.selectedPaths, path],
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedPaths: [] }));
  }, []);

  const setSelectedPaths = useCallback((paths: string[]) => {
    setState(prev => ({ ...prev, selectedPaths: paths }));
  }, []);

  return {
    ...state,
    toggleSelectionMode,
    togglePath,
    clearSelection,
    setSelectedPaths,
  };
}
