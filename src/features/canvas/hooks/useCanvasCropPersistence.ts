import { useCallback } from 'react';
import { useGalleryStore } from '@/features/imageview/store/galleryStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { saveBase64Image } from '@/tauri-bridge/fs';
import { processCanvasCrop } from '../utils/canvasCropUtils';
import { AnyCanvasEntity, CropOptions, UseCanvasCropPersistenceProps } from '@/shared/types';

/**
 * Hook descentralizado para gerenciar a persistência de recortes (colagens).
 */
export function useCanvasCropPersistence({ onUpdate, rootPath }: UseCanvasCropPersistenceProps) {
  const registerCollage = useGalleryStore(state => state.registerCollage);
  const { invalidateImageCache, scanImages } = useWorkspaceStore();

  const persistCrop = useCallback(async (
    pendingId: string, 
    options: CropOptions
  ) => {
    try {
      if (!rootPath || !pendingId) return null;

      // 1. Gerar a imagem recortada usando o utilitário centralizado
      const croppedBase64 = await processCanvasCrop(options);

      if (!croppedBase64) throw new Error('Falha ao gerar recorte');

      const base64Data = croppedBase64.split(',')[1];
      const fileName = `collage_${Date.now()}.png`;

      // 2. Salvar via Bridge no sistema de arquivos
      const savedPath = await saveBase64Image(
        fileName,
        base64Data,
        rootPath
      );

      // 3. Registrar na galeria (Store de Ativos)
      await registerCollage(savedPath);

      // 4. Invalidar cache e re-escanear para aparecer na galeria imediatamente
      invalidateImageCache();
      await scanImages();

      // 5. Atualizar a entidade pendente no Canvas com os dados finais
      onUpdate(pendingId, {
        data: {
          path: savedPath,
          isPending: false,
          progress: 100,
          isCrop: true
        }
      });

      return savedPath;

    } catch (err) {
      console.error('Erro na persistência do recorte:', err);
      
      // Notificar falha na entidade
      onUpdate(pendingId, { 
        data: { 
          isPending: false, 
          error: true 
        } as any
      });
      
      return null;
    }
  }, [rootPath, registerCollage, invalidateImageCache, scanImages, onUpdate]);

  return { persistCrop };
}
