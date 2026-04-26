import { useState, useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore } from '@/features/image-manager/store/galleryStore';
import { 
  copyImageToAssets, 
  deleteItem, 
  renameItem, 
  ImageAsset,
  scanWorkspaceImages
} from '@/tauri-bridge/fs';
import { GalleryNavTarget, GalleryBreadcrumb } from '@/shared/types';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Função utilitária global para resolver caminhos de imagem (HTTP, Relativo, Absoluto ou Obsidian)
 */
export async function resolveImageUrl(src: string, rootPath: string | null): Promise<string | undefined> {
  if (!src) return undefined;

  // 1. Caminho Externo (http)
  if (src.startsWith('http')) return src;

  // 2. Caminho Relativo Padrão (./)
  if (src.startsWith('./') && rootPath) {
    const relativePart = src.replace('./', '');
    const separator = rootPath.includes('\\') ? '\\' : '/';
    const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
    return convertFileSrc(fullPath);
  }

  // 3. Caminho Absoluto
  const isAbsolute = /^[a-zA-Z]:[\\/]/.test(src) || src.startsWith('/');
  if (isAbsolute) return convertFileSrc(src);

  // 4. Nome de Arquivo Solto (Padrão Obsidian ![[imagem.png]])
  if (rootPath) {
    try {
      const allImages = await scanWorkspaceImages(rootPath);
      const found = allImages.find(img => 
        img.name === src || 
        img.path.endsWith('/' + src) || 
        img.path.endsWith('\\' + src)
      );
      if (found) return convertFileSrc(found.full_path);
    } catch (err) {
      console.error('[resolveImageUrl] Erro ao resolver imagem Obsidian:', err);
    }
  }

  return undefined;
}

export function useImageManager() {
  const { rootPath, cachedImages, scanImages, invalidateImageCache } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { collections } = useGalleryStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Lógica de Navegação Híbrida ---
  const [activeTarget, setActiveTarget] = useState<GalleryNavTarget>(null);
  const [filter, setFilter] = useState('');
  const [isPickingExisting, setIsPickingExisting] = useState(false);

  const filteredImages = useMemo(() => {
    const isSearching = filter.trim().length > 0;
    const baseImages = cachedImages || [];
    let baseList: ImageAsset[] = [];

    if (activeTarget?.type === 'virtual') {
      const activeCol = collections.find(c => c.id === activeTarget.id);
      if (activeCol) {
        baseList = baseImages.filter(img => activeCol.images.includes(img.path));
      }
    } else if (activeTarget?.type === 'physical') {
      const currentPath = activeTarget.path;
      baseList = baseImages.filter(img => {
        let relPath = img.path;
        if (relPath.startsWith('./')) relPath = relPath.substring(2);
        
        // Remove prefixos 'assets/' ou 'moodboard/' para lógica de path relativo
        const virtualRelPath = relPath.replace(/^(assets|moodboard)\//, '');
        const parts = virtualRelPath.split('/');
        parts.pop(); // Remove o nome do arquivo
        const imgFolder = parts.join('/');
        
        return imgFolder === currentPath;
      });
    } else {
      // Raiz (Apenas imagens que não estão em pastas físicas OU que estão na raiz de assets/moodboard)
      if (isSearching) {
        baseList = baseImages;
      } else {
        const allAssignedVirtualPaths = new Set(collections.flatMap(c => c.images));
        baseList = baseImages.filter(img => {
          let relPath = img.path;
          if (relPath.startsWith('./')) relPath = relPath.substring(2);
          const virtualRelPath = relPath.replace(/^(assets|moodboard)\//, '');
          return !virtualRelPath.includes('/') && !allAssignedVirtualPaths.has(img.path);
        });
      }
    }

    return baseList.filter(img => img.name.toLowerCase().includes(filter.toLowerCase()));
  }, [cachedImages, filter, activeTarget, collections, isPickingExisting]);

  const filteredCollections = useMemo(() => {
    if (isPickingExisting || activeTarget?.type === 'physical') return [];
    
    const parentId = activeTarget?.type === 'virtual' ? activeTarget.id : undefined;
    return collections.filter(c => c.parentId === parentId && c.name.toLowerCase().includes(filter.toLowerCase()));
  }, [collections, filter, activeTarget, isPickingExisting]);

  const filteredPhysicalFolders = useMemo(() => {
    if (isPickingExisting || activeTarget?.type === 'virtual') return [];
    
    const foldersSet = new Set<string>();
    const currentPath = activeTarget?.type === 'physical' ? activeTarget.path : '';

    (cachedImages || []).forEach(img => {
      let relPath = img.path;
      if (relPath.startsWith('./')) relPath = relPath.substring(2);
      
      const virtualRelPath = relPath.replace(/^(assets|moodboard)\//, '');
      if (virtualRelPath === relPath) return; // Ignora o que não está em assets/moodboard

      const parts = virtualRelPath.split('/');
      parts.pop(); // Remove arquivo
      const imgFolder = parts.join('/');

      if (currentPath === '') {
        if (parts.length > 0 && parts[0] !== '') foldersSet.add(parts[0]);
      } else {
        if (imgFolder.startsWith(currentPath + '/')) {
          const remaining = imgFolder.substring(currentPath.length + 1);
          const nextFolder = remaining.split('/')[0];
          foldersSet.add(`${currentPath}/${nextFolder}`);
        }
      }
    });

    return Array.from(foldersSet).sort();
  }, [cachedImages, activeTarget, isPickingExisting]);

  const handleTargetClick = (target: GalleryNavTarget, onNavigate?: () => void) => {
    setActiveTarget(target);
    setIsPickingExisting(false);
    if (onNavigate) onNavigate();
  };

  const getBreadcrumbs = (): GalleryBreadcrumb[] => {
    const crumbs: GalleryBreadcrumb[] = [{ label: 'Galeria', target: null }];
    
    if (activeTarget?.type === 'virtual') {
      const buildVirtual = (id: string) => {
        const col = collections.find(c => c.id === id);
        if (col) {
          if (col.parentId) buildVirtual(col.parentId);
          crumbs.push({ label: col.name, target: { type: 'virtual', id: col.id } });
        }
      };
      buildVirtual(activeTarget.id);
    } else if (activeTarget?.type === 'physical') {
      const parts = activeTarget.path.split('/');
      let currentAcc = '';
      parts.forEach(p => {
        currentAcc = currentAcc ? `${currentAcc}/${p}` : p;
        crumbs.push({ label: p, target: { type: 'physical', path: currentAcc } });
      });
    }
    
    return crumbs;
  };
  // -------------------------------------------------

  /**
   * Upload de imagens via diálogo ou paths externos (DND)
   */
  const uploadImages = async (targetFolder: string = '', externalPaths?: string[]) => {
    if (!rootPath) return;

    try {
      let pathsToImport: string[] = [];

      if (externalPaths && externalPaths.length > 0) {
        pathsToImport = externalPaths;
      } else {
        const selected = await open({
          multiple: true,
          filters: [{
            name: 'Imagens',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
          }]
        });

        if (selected) {
          pathsToImport = Array.isArray(selected) ? selected : [selected];
        }
      }

      if (pathsToImport.length === 0) return;

      setIsProcessing(true);
      const importedPaths: string[] = [];

      for (const path of pathsToImport) {
        const subFolder = targetFolder || undefined;
        const relPath = await copyImageToAssets(path, rootPath, subFolder);
        importedPaths.push(relPath);
      }

      invalidateImageCache();
      await scanImages();
      
      addNotification(`${pathsToImport.length} imagem(ns) importada(s)`, 'success');
      return importedPaths;
    } catch (error) {
      console.error('[ImageManager] Erro no upload:', error);
      addNotification('Erro ao importar imagens', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Deleta uma única imagem
   */
  const deleteImage = async (image: ImageAsset) => {
    try {
      setIsProcessing(true);
      await deleteItem(image.full_path);
      invalidateImageCache();
      await scanImages();
      addNotification('Imagem excluída', 'success');
    } catch (error) {
      console.error('[ImageManager] Erro ao deletar imagem:', error);
      addNotification('Erro ao excluir imagem', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Move múltiplas imagens para uma pasta alvo
   */
  const moveImages = async (sourcePaths: string[], targetFolder: string) => {
    if (!rootPath) return;

    try {
      setIsProcessing(true);
      const separator = rootPath.includes('\\') ? '\\' : '/';
      let movedCount = 0;

      for (const itemPath of sourcePaths) {
        const img = (cachedImages || []).find(i => i.path === itemPath);
        if (img) {
          const fileName = img.name;
          let prefix = 'assets';
          if (itemPath.startsWith('./moodboard/') || itemPath.startsWith('moodboard/')) prefix = 'moodboard';
          
          const newRelativePath = targetFolder ? `${prefix}/${targetFolder}/${fileName}` : `${prefix}/${fileName}`;
          const newFullPath = `${rootPath}${separator}${newRelativePath.replace(/\//g, separator)}`;
          
          await renameItem(img.full_path, newFullPath);
          movedCount++;
        }
      }

      invalidateImageCache();
      await scanImages();
      addNotification(`${movedCount} imagem(ns) movida(s)`, 'success');
    } catch (error) {
      console.error('[ImageManager] Erro ao mover imagens:', error);
      addNotification('Erro ao mover imagens', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Deleta uma pasta física e move suas imagens para a raiz (Resgate)
   */
  const deletePhysicalFolder = async (folderPath: string) => {
    if (!rootPath) return;

    try {
      setIsProcessing(true);
      const separator = rootPath.includes('\\') ? '\\' : '/';
      
      const imagesToRescue = (cachedImages || []).filter(img => {
        let relPath = img.path;
        if (relPath.startsWith('./')) relPath = relPath.substring(2);
        const prefix = relPath.startsWith('moodboard/') ? 'moodboard' : 'assets';
        const virtualPath = relPath.startsWith(`${prefix}/`) ? relPath.substring(prefix.length + 1) : relPath;
        return virtualPath.startsWith(`${folderPath}/`);
      });

      // Resgata imagens para a raiz (assets ou moodboard)
      for (const img of imagesToRescue) {
        const prefix = img.path.includes('moodboard') ? 'moodboard' : 'assets';
        const fileName = img.name;
        const newRelativePath = `${prefix}/${fileName}`;
        const newFullPath = `${rootPath}${separator}${newRelativePath.replace(/\//g, separator)}`;
        await renameItem(img.full_path, newFullPath);
      }

      // Tenta deletar a pasta em assets e moodboard (se existirem)
      const fullPathAssets = `${rootPath}${separator}assets${separator}${folderPath.replace(/\//g, separator)}`;
      const fullPathMoodboard = `${rootPath}${separator}moodboard${separator}${folderPath.replace(/\//g, separator)}`;
      
      try { await deleteItem(fullPathAssets); } catch (e) {}
      try { await deleteItem(fullPathMoodboard); } catch (e) {}

      invalidateImageCache();
      await scanImages();
      addNotification('Pasta excluída e imagens resgatadas', 'success');
    } catch (error) {
      console.error('[ImageManager] Erro ao deletar pasta:', error);
      addNotification('Erro ao excluir pasta', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Processador de drop padrão para imagens.
   * Centraliza a lógica de decisão (Pasta física vs Coleção virtual)
   */
  const handleImageDrop = async (sourceItem: ImageAsset, targetType: string, targetId: string, selectedPaths: string[] = []) => {
    const sourceItems = selectedPaths.includes(sourceItem.path) ? selectedPaths : [sourceItem.path];

    if (targetType === 'collection') {
      const { useGalleryStore } = await import('@/features/image-manager/store/galleryStore');
      await useGalleryStore.getState().addToCollection(targetId, sourceItems);
      addNotification(`${sourceItems.length} imagem(ns) adicionada(s) à coleção`, 'success');
      return true;
    } else if (targetType === 'folder') {
      await moveImages(sourceItems, targetId);
      return true;
    }
    return false;
  };

  return {
    isProcessing,
    uploadImages,
    deleteImage,
    moveImages,
    deletePhysicalFolder,
    handleImageDrop,
    // Navegação Híbrida
    activeTarget,
    setActiveTarget,
    filter,
    setFilter,
    isPickingExisting,
    setIsPickingExisting,
    filteredImages,
    filteredCollections,
    filteredPhysicalFolders,
    handleTargetClick,
    getBreadcrumbs
  };
}
