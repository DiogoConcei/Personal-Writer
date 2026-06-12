import { useState, useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore } from '@/features/imageview/store/galleryStore';
import { 
  copyImageToAssets, 
  deleteItem, 
  renameItem, 
  copyFileToWorkspace
} from '@/tauri-bridge/fs';
import { GalleryNavTarget, GalleryBreadcrumb, GallerySection, MediaAsset } from '@/shared/types';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
const PDF_EXTENSIONS = ['pdf'];

/**
 * Função utilitária global para resolver caminhos de mídias (HTTP, Relativo, Absoluto ou Obsidian)
 */
export async function resolveMediaUrl(src: string, rootPath: string | null): Promise<string | undefined> {
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

  // 4. Nome de Arquivo Solto (Padrão Obsidian ![[arquivo.ext]])
  if (rootPath) {
    try {
      const { scanWorkspaceImages, scanWorkspacePdfs } = await import('@/tauri-bridge/fs');
      const [allImages, allPdfs] = await Promise.all([
        scanWorkspaceImages(rootPath),
        scanWorkspacePdfs(rootPath)
      ]);
      
      const allAssets: MediaAsset[] = [...allImages, ...allPdfs];
      const found = allAssets.find(asset => 
        asset.name === src || 
        asset.path.endsWith('/' + src) || 
        asset.path.endsWith('\\' + src)
      );
      if (found) return convertFileSrc(found.full_path);
    } catch (err) {
      console.error('[resolveMediaUrl] Erro ao resolver mídia Obsidian:', err);
    }
  }

  return undefined;
}

export function useMediaManager(assetType: 'image' | 'pdf' | 'all' = 'all') {
  const { rootPath, cachedImages, cachedPdfs, scanImages, scanPdfs, invalidateImageCache, invalidatePdfCache } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { collections } = useGalleryStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Lógica de Navegação Híbrida ---
  const [activeTarget, setActiveTarget] = useState<GalleryNavTarget>(null);
  const [activeSection, setActiveSection] = useState<GallerySection>('geral');
  const [filter, setFilter] = useState('');
  const [isPickingExisting, setIsPickingExisting] = useState(false);

  const filteredMedia = useMemo(() => {
    const isSearching = filter.trim().length > 0;
    
    let baseMedia: MediaAsset[] = [];
    if (assetType === 'image' || assetType === 'all') baseMedia = [...baseMedia, ...(cachedImages || [])];
    if (assetType === 'pdf' || assetType === 'all') baseMedia = [...baseMedia, ...(cachedPdfs || [])];

    let baseList: MediaAsset[] = [];

    if (activeTarget?.type === 'virtual') {
      const activeCol = collections.find(c => c.id === activeTarget.id);
      if (activeCol) {
        baseList = baseMedia.filter(m => activeCol.images.includes(m.path));
      }
    } else if (activeTarget?.type === 'physical') {
      const currentPath = activeTarget.path;
      baseList = baseMedia.filter(m => {
        let relPath = m.path;
        if (relPath.startsWith('./')) relPath = relPath.substring(2);
        
        // Remove prefixos 'assets/', 'docs/' ou 'moodboard/' para lógica de path relativo
        const virtualRelPath = relPath.replace(/^(assets|docs|moodboard)\//, '');
        const parts = virtualRelPath.split('/');
        parts.pop(); // Remove o nome do arquivo
        const mFolder = parts.join('/');
        
        return mFolder === currentPath;
      });
    } else {
      // Raiz
      if (isSearching) {
        baseList = baseMedia;
      } else {
        const allAssignedVirtualPaths = new Set(collections.flatMap(c => c.images));
        baseList = baseMedia.filter(m => {
          let relPath = m.path;
          if (relPath.startsWith('./')) relPath = relPath.substring(2);
          
          // --- Lógica de Seção (Silos) ---
          const isInAssets = relPath.startsWith('assets/');
          const isInDocs = relPath.startsWith('docs/');
          const subPath = isInAssets ? relPath.substring(7) : isInDocs ? relPath.substring(5) : '';

          if (activeSection === 'collages') {
            return subPath.startsWith('collages/');
          }
          if (activeSection === 'editions') {
            return subPath.startsWith('editions/');
          }

          // Seção Geral
          if (activeSection === 'geral') {
            const isReserved = subPath.startsWith('collages/') || subPath.startsWith('editions/');
            if (isReserved) return false;
            
            const prefix = relPath.startsWith('moodboard/') ? 'moodboard/' : relPath.startsWith('docs/') ? 'docs/' : 'assets/';
            const virtualRelPath = relPath.startsWith(prefix) ? relPath.substring(prefix.length) : relPath;
            
            return !virtualRelPath.includes('/') && !allAssignedVirtualPaths.has(m.path);
          }

          return false;
        });
      }
    }

    return baseList.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));
  }, [cachedImages, cachedPdfs, filter, activeTarget, collections, isPickingExisting, activeSection, assetType]);

  const filteredCollections = useMemo(() => {
    if (isPickingExisting || activeTarget?.type === 'physical') return [];
    
    let effectiveParentId: string | undefined = activeTarget?.type === 'virtual' ? activeTarget.id : undefined;

    if (!effectiveParentId && activeSection !== 'geral') {
      const siloName = activeSection === 'collages' ? 'Colagens' : 'Edições';
      effectiveParentId = collections.find(c => c.name === siloName)?.id;
      if (!effectiveParentId) return [];
    }

    return collections.filter(c => {
      const matchesFilter = c.name.toLowerCase().includes(filter.toLowerCase());
      const isCorrectParent = c.parentId === effectiveParentId;
      const isReservedSilo = effectiveParentId === undefined && ['Colagens', 'Edições'].includes(c.name);

      return isCorrectParent && matchesFilter && !isReservedSilo;
    });
  }, [collections, filter, activeTarget, isPickingExisting, activeSection]);

  const handleTargetClick = (target: GalleryNavTarget, onNavigate?: () => void) => {
    setActiveTarget(target);
    setIsPickingExisting(false);
    if (onNavigate) onNavigate();
  };

  const getBreadcrumbs = (): GalleryBreadcrumb[] => {
    const rootLabel = activeSection === 'geral' ? 'Geral' : activeSection === 'collages' ? 'Colagens' : 'Edições';
    const crumbs: GalleryBreadcrumb[] = [{ label: rootLabel, target: null }];
    
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

  const handleSectionChange = (section: GallerySection) => {
    setActiveSection(section);
    setActiveTarget(null);
    setFilter('');
  };

  // -------------------------------------------------

  /**
   * Upload de mídias via diálogo ou paths externos (DND)
   */
  const uploadMedia = async (targetFolder: string = '', externalPaths?: string[]) => {
    if (!rootPath) return;

    try {
      let pathsToImport: string[] = [];

      if (externalPaths && externalPaths.length > 0) {
        pathsToImport = externalPaths;
      } else {
        const filters: any[] = [];
        if (assetType === 'image' || assetType === 'all') {
          filters.push({ name: 'Imagens', extensions: IMAGE_EXTENSIONS });
        }
        if (assetType === 'pdf' || assetType === 'all') {
          filters.push({ name: 'Documentos PDF', extensions: PDF_EXTENSIONS });
        }

        const selected = await open({
          multiple: true,
          filters
        });

        if (selected) {
          pathsToImport = Array.isArray(selected) ? selected : [selected];
        }
      }

      if (pathsToImport.length === 0) return;

      setIsProcessing(true);
      const importedPaths: string[] = [];

      for (const path of pathsToImport) {
        const isPdf = path.toLowerCase().endsWith('.pdf');
        let relPath = '';
        
        if (isPdf) {
          relPath = await copyFileToWorkspace(path, rootPath, 'docs');
        } else {
          const subFolder = targetFolder || undefined;
          relPath = await copyImageToAssets(path, rootPath, subFolder);
        }
        importedPaths.push(relPath);
      }

      invalidateImageCache();
      invalidatePdfCache();
      await Promise.all([scanImages(), scanPdfs()]);
      
      addNotification(`${pathsToImport.length} arquivo(s) importado(s)`, 'success');
      return importedPaths;
    } catch (error) {
      console.error('[MediaManager] Erro no upload:', error);
      addNotification('Erro ao importar arquivos', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Deleta uma única mídia
   */
  const deleteMedia = async (asset: MediaAsset) => {
    try {
      setIsProcessing(true);
      await deleteItem(asset.full_path);
      invalidateImageCache();
      invalidatePdfCache();
      await Promise.all([scanImages(), scanPdfs()]);
      addNotification('Arquivo excluído', 'success');
    } catch (error) {
      console.error('[MediaManager] Erro ao deletar arquivo:', error);
      addNotification('Erro ao excluir arquivo', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Move múltiplas mídias para uma pasta alvo
   */
  const moveMedia = async (sourcePaths: string[], targetFolder: string) => {
    if (!rootPath) return;

    const isReservedTarget = ['collages', 'editions'].includes(targetFolder.split('/')[0]);
    if (isReservedTarget) {
      addNotification('Não é permitido mover arquivos para silos reservados', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      const separator = rootPath.includes('\\') ? '\\' : '/';
      let movedCount = 0;

      const baseMedia: MediaAsset[] = [...(cachedImages || []), ...(cachedPdfs || [])];

      for (const itemPath of sourcePaths) {
        const asset = baseMedia.find(m => m.path === itemPath);
        if (asset) {
          const isFromReserved = asset.path.includes('/collages/') || asset.path.includes('/editions/');
          if (isFromReserved) continue;

          const fileName = asset.name;
          let prefix = 'assets';
          if (itemPath.startsWith('./moodboard/') || itemPath.startsWith('moodboard/')) prefix = 'moodboard';
          else if (itemPath.startsWith('./docs/') || itemPath.startsWith('docs/')) prefix = 'docs';
          
          const newRelativePath = targetFolder ? `${prefix}/${targetFolder}/${fileName}` : `${prefix}/${fileName}`;
          const newFullPath = `${rootPath}${separator}${newRelativePath.replace(/\//g, separator)}`;
          
          await renameItem(asset.full_path, newFullPath);
          movedCount++;
        }
      }

      invalidateImageCache();
      invalidatePdfCache();
      await Promise.all([scanImages(), scanPdfs()]);
      if (movedCount > 0) {
        addNotification(`${movedCount} arquivo(s) movido(s)`, 'success');
      }
    } catch (error) {
      console.error('[MediaManager] Erro ao mover arquivos:', error);
      addNotification('Erro ao mover arquivos', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Processador de drop padrão para mídias.
   */
  const handleMediaDrop = async (sourceItem: MediaAsset, targetType: string, targetId: string, selectedPaths: string[] = []) => {
    const sourceItems = selectedPaths.includes(sourceItem.path) ? selectedPaths : [sourceItem.path];

    if (targetType === 'collection') {
      await useGalleryStore.getState().addToCollection(targetId, sourceItems);
      addNotification(`${sourceItems.length} arquivo(s) adicionado(s) à coleção`, 'success');
      return true;
    } else if (targetType === 'folder') {
      await moveMedia(sourceItems, targetId);
      return true;
    }
    return false;
  };

  return {
    isProcessing,
    uploadMedia,
    deleteMedia,
    moveMedia,
    handleMediaDrop,
    // Navegação Híbrida
    activeTarget,
    setActiveTarget,
    activeSection,
    handleSectionChange,
    filter,
    setFilter,
    isPickingExisting,
    setIsPickingExisting,
    filteredMedia,
    filteredCollections,
    handleTargetClick,
    getBreadcrumbs
  };
}
