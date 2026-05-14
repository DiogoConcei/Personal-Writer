import { useState, useCallback } from 'react';
import { GalleryModalsState } from '@/shared/types';
import { ImageAsset } from '@/tauri-bridge/fs';

/**
 * Hook para gerenciar os modais da Galeria de Imagens.
 */
export function useGalleryModals() {
  const [state, setState] = useState<GalleryModalsState>({
    itemToDelete: null,
    folderToDelete: null,
    isInputModalOpen: false,
    pendingCollectionImages: [],
  });

  const openDeleteImage = useCallback((item: ImageAsset) => {
    setState(prev => ({ ...prev, itemToDelete: item }));
  }, []);

  const closeDeleteImage = useCallback(() => {
    setState(prev => ({ ...prev, itemToDelete: null }));
  }, []);

  const openDeleteFolder = useCallback((path: string) => {
    setState(prev => ({ ...prev, folderToDelete: path }));
  }, []);

  const closeDeleteFolder = useCallback(() => {
    setState(prev => ({ ...prev, folderToDelete: null }));
  }, []);

  const openInputModal = useCallback((pendingImages: string[] = []) => {
    setState(prev => ({ 
      ...prev, 
      isInputModalOpen: true, 
      pendingCollectionImages: pendingImages 
    }));
  }, []);

  const closeInputModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isInputModalOpen: false, 
      pendingCollectionImages: [] 
    }));
  }, []);

  return {
    ...state,
    openDeleteImage,
    closeDeleteImage,
    openDeleteFolder,
    closeDeleteFolder,
    openInputModal,
    closeInputModal,
  };
}
