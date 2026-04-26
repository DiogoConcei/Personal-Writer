import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore } from '@/features/image-manager/store/galleryStore';
import { resolveAssetPath, ImageAsset } from '@/tauri-bridge/fs';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useImageManager } from '@/shared/hooks/useImageManager/useImageManager';
import { useDragAndDrop } from '@/shared/hooks/useDragAndDrop/useDragAndDrop';
import DeleteModal from '@/features/workspace/components/DeleteModal/DeleteModal';
import InputModal from '@/shared/components/Modal/InputModal/InputModal';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal/ConfirmModal';
import styles from './ImageGallery.module.scss';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

import {
  Image as ImageIcon,
  X,
  Search,
  Trash2,
  Upload,
  RefreshCw,
  Folder,
  Plus,
  ChevronRight,
  CheckSquare,
  Layers
} from 'lucide-react';

interface ImageGalleryProps {
  onSelect: (src: string) => void;
  onClose: () => void;
  disableOrganization?: boolean;
  largeModal?: boolean;
}

export default function ImageGallery({ 
  onSelect, 
  onClose, 
  disableOrganization = false,
  largeModal = false 
}: ImageGalleryProps) {
  const { rootPath, cachedImages, isScanning, scanImages, invalidateImageCache } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { createCollection, addToCollection, loadCollections } = useGalleryStore();
  const { 
    isProcessing, 
    uploadImages, 
    deleteImage, 
    deletePhysicalFolder, 
    handleImageDrop,
    activeTarget,
    filter,
    setFilter,
    filteredImages,
    filteredCollections,
    filteredPhysicalFolders,
    handleTargetClick,
    getBreadcrumbs
  } = useImageManager();

  useEffect(() => {
    console.log('%c[ImageGallery] Montado', 'color: #1abc9c; font-weight: bold; border: 1px solid #1abc9c; padding: 2px 4px;');
    return () => console.log('%c[ImageGallery] Desmontado', 'color: #e74c3c; font-weight: bold;');
  }, []);

  const [itemToDelete, setItemToDelete] = useState<ImageAsset | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Estado para Criação Virtual
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [pendingCollectionImages, setPendingCollectionImages] = useState<string[]>([]);

  // Estado de Seleção Múltipla (Senior Style)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // Configuração do Drag & Drop Desacoplado
  const { 
    handleMouseDown, 
    draggedItem, 
    dragPosition, 
    isDragging, 
    dropTarget, 
    shouldIgnoreClick 
  } = useDragAndDrop<ImageAsset>({
    onDrop: async (item, targetType, targetId) => {
      if (disableOrganization) return;
      console.log(`%c[ImageGallery] Drop detectado via Hook -> Target: ${targetType} (${targetId})`, 'color: #3498db; font-weight: bold;');
      
      const success = await handleImageDrop(item, targetType, targetId, selectedPaths);
      
      if (success) {
        if (isSelectionMode) { 
          setSelectedPaths([]); 
          setIsSelectionMode(false); 
        }
      } else if (targetType === 'image') {
        // Agrupamento em Nova Pasta Virtual
        const sourceItems = selectedPaths.includes(item.path) ? selectedPaths : [item.path];
        setPendingCollectionImages([...sourceItems, targetId]);
        setIsInputModalOpen(true);
      }
      
      console.log('%c[ImageGallery] DND Finalizado via Hook', 'color: #9b59b6; font-weight: bold;');
    },
    isValidTarget: (item, type, id) => {
      if (disableOrganization) return false;
      if (type === 'image' && (id === item.path || selectedPaths.includes(id))) return false;
      return true;
    }
  });

  useEffect(() => {
    if (rootPath) {
      scanImages();
      loadCollections();
    }
  }, [rootPath]);

  // Efeito para Drag & Drop Externo (Desktop -> App)
  useEffect(() => {
    if (!rootPath) return;

    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;

    const setupDragDrop = async () => {
      unlistenFn = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          const imagePaths = event.payload.paths.filter(p => 
            IMAGE_EXTENSIONS.some(ext => p.toLowerCase().endsWith(ext))
          );

          if (imagePaths.length > 0) {
            // Determina o destino baseado na posição do mouse
            const element = document.elementFromPoint(event.payload.position.x, event.payload.position.y);
            const folderTarget = element?.closest('[data-drag-type]');
            const targetType = folderTarget?.getAttribute('data-drag-type');
            const targetId = folderTarget?.getAttribute('data-drag-id');

            const physicalFolder = targetType === 'folder' ? (targetId || '') : (activeTarget?.type === 'physical' ? activeTarget.path : '');
            const importedPaths = await uploadImages(physicalFolder, imagePaths);

            if (importedPaths) {
              if (targetType === 'collection' && targetId) {
                await addToCollection(targetId, importedPaths);
              } else if (activeTarget?.type === 'virtual') {
                await addToCollection(activeTarget.id, importedPaths);
              }
            }
          }
        }
      });
    };

    setupDragDrop();
    return () => { if (unlistenFn) unlistenFn(); };
  }, [rootPath, activeTarget, uploadImages, addToCollection]);

  const handleUpload = async () => {
    const physicalFolder = activeTarget?.type === 'physical' ? activeTarget.path : '';
    const importedPaths = await uploadImages(physicalFolder);
    if (importedPaths && activeTarget?.type === 'virtual') {
      await addToCollection(activeTarget.id, importedPaths);
    }
  };

  const handleCreateVirtualFolder = async (name: string) => {
    const parentId = activeTarget?.type === 'virtual' ? activeTarget.id : undefined;
    await createCollection(name.trim(), pendingCollectionImages, parentId);
    setPendingCollectionImages([]);
    setIsInputModalOpen(false);
    if (isSelectionMode) { setSelectedPaths([]); setIsSelectionMode(false); }
    addNotification('Pasta virtual criada', 'success');
  };

  const handleDelete = (e: React.MouseEvent, item: ImageAsset) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteImage(itemToDelete);
    setItemToDelete(null);
  };

  const handleImageSelect = (item: ImageAsset) => {
    onSelect(item.path);
    onClose();
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation();
    setFolderToDelete(folderPath);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete || !rootPath) return;
    await deletePhysicalFolder(folderToDelete);
    setFolderToDelete(null);
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <div className={`${styles.modal} ${largeModal ? styles['modal--large'] : ''}`} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.header__left}>
            <div className={styles.breadcrumbs}>
              {getBreadcrumbs().map((crumb, i) => (
                <div key={i} className={styles.breadcrumbItem}>
                  {i > 0 && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
                  <button 
                    className={`${styles.breadcrumbBtn} ${crumb.target === activeTarget ? styles['breadcrumbBtn--active'] : ''}`} 
                    onClick={() => handleTargetClick(crumb.target, () => {
                      setIsSelectionMode(false);
                      setSelectedPaths([]);
                    })}
                  >
                    {crumb.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.header__actions}>
            {!disableOrganization && (
              <>
                <button 
                  className={styles.folderBtn} 
                  style={{ color: isSelectionMode ? 'var(--color-accent)' : 'inherit' }}
                  onClick={() => { 
                    setIsSelectionMode(!isSelectionMode); 
                    setSelectedPaths([]); 
                  }} 
                  title={isSelectionMode ? "Finalizar Organização" : "Organizar em Massa"}
                >
                  <CheckSquare size={16} />
                </button>
                <button 
                  className={styles.folderBtn}
                  onClick={() => setIsInputModalOpen(true)}
                  title="Nova Pasta Virtual"
                >
                  <Plus size={16} />
                </button>
              </>
            )}
            <button className={styles.refreshBtn} onClick={() => { invalidateImageCache(); scanImages(); }} disabled={isScanning} title="Atualizar galeria">
              <RefreshCw size={16} className={isScanning ? styles.spin : ''} />
            </button>
            <button className={styles.uploadBtn} onClick={handleUpload} disabled={isProcessing}>
              <Upload size={16} />
              <span>{isProcessing ? 'Enviando...' : 'Upload'}</span>
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className={styles.searchBar}>
          <div className={styles.searchBar__input}>
            <Search size={16} />
            <input
              placeholder="Buscar imagens ou pastas..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.content}>
          {isScanning && !cachedImages ? (
            <div className={styles.empty}>Escaneando workspace...</div>
          ) : (filteredImages.length + filteredCollections.length + filteredPhysicalFolders.length) === 0 ? (
            <div className={styles.empty}>
              <ImageIcon size={48} />
              <p>{filter ? 'Nenhum resultado encontrado.' : 'Nenhuma imagem nesta pasta.'}</p>
              {!activeTarget && !filter && (
                <button className={styles.emptyUploadBtn} onClick={handleUpload}>
                  Fazer Upload da Primeira Imagem
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {/* Renderiza Coleções (Virtuais) */}
              {filteredCollections.map(col => (
                <div
                  key={col.id}
                  className={`${styles.folderItem} ${dropTarget?.id === col.id ? styles['folderItem--dragOver'] : ''}`}
                  data-drag-type="collection"
                  data-drag-id={col.id}
                  onClick={() => handleTargetClick({ type: 'virtual', id: col.id })}
                  title={`Abrir ${col.name}`}
                >
                  {!disableOrganization && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); useGalleryStore.getState().deleteCollection(col.id); }}
                      title="Excluir Pasta Virtual"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className={styles.folderIcon}>
                    <Folder size={40} />
                    <span>{col.name}</span>
                  </div>
                </div>
              ))}

              {/* Renderiza Pastas Físicas */}
              {filteredPhysicalFolders.map(folderPath => (
                <div
                  key={folderPath}
                  className={`${styles.folderItem} ${dropTarget?.id === folderPath ? styles['folderItem--dragOver'] : ''}`}
                  data-drag-type="folder"
                  data-drag-id={folderPath}
                  onClick={() => handleTargetClick({ type: 'physical', path: folderPath })}
                  title={`Abrir pasta física: ${folderPath.split('/').pop()}`}
                >
                  {!disableOrganization && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteFolder(e, folderPath)}
                      title="Excluir Pasta Física (Imagens serão movidas para a raiz)"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className={styles.folderIcon} style={{ color: 'var(--color-text-muted)' }}>
                    <Folder size={40} />
                    <span>{folderPath.split('/').pop()}</span>
                  </div>
                </div>
              ))}

              {/* Renderiza Imagens */}
              {filteredImages.map(item => (
                <div
                  key={item.full_path}
                  className={`${styles.imageItem} ${selectedPaths.includes(item.path) ? styles['imageItem--selected'] : ''} ${dropTarget?.id === item.path ? styles['imageItem--dragOver'] : ''} ${draggedItem?.path === item.path ? styles['imageItem--dragging'] : ''}`}
                  data-drag-type="image"
                  data-drag-id={item.path}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onClick={() => {
                    if (shouldIgnoreClick()) return;
                    if (isSelectionMode) {
                      setSelectedPaths(prev => prev.includes(item.path) ? prev.filter(p => p !== item.path) : [...prev, item.path]);
                    } else {
                      handleImageSelect(item);
                    }
                  }}
                  title={item.path}
                >
                  {!disableOrganization && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(e, item)}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className={styles.imageWrapper}>
                    <img
                      src={resolveAssetPath(item.path, rootPath)}
                      alt={item.name}
                      loading="lazy"
                      onDragStart={e => e.preventDefault()}
                    />
                    {selectedPaths.includes(item.path) && (
                      <div style={{ position: 'absolute', top: 5, left: 5, color: 'var(--color-accent)', background: 'var(--color-bg-surface)', borderRadius: '4px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        <CheckSquare size={20} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Seleção na base do Modal */}
        {isSelectionMode && selectedPaths.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px',
            boxShadow: 'var(--shadow-lg)', zIndex: 100
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedPaths.length} itens selecionados</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)', cursor: 'pointer' }} 
                onClick={() => setSelectedPaths([])}
              >
                Limpar
              </button>
              <button 
                style={{ padding: '6px 12px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} 
                onClick={() => { setPendingCollectionImages(selectedPaths); setIsInputModalOpen(true); }}
              >
                <Folder size={16} /> Agrupar em Pasta
              </button>
            </div>
          </div>
        )}

        {isDragging && draggedItem && (
          <div 
            className={styles.dragGhost} 
            style={{ 
              left: dragPosition.x, 
              top: dragPosition.y,
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 9999
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid var(--color-accent)',
              background: 'var(--color-bg-surface)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}>
              <img 
                src={resolveAssetPath(draggedItem.path, rootPath)} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="" 
              />
              {selectedPaths.length > 1 && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'var(--color-accent)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Layers size={12} /> {selectedPaths.length}
                </div>
              )}
            </div>
            {dropTarget && (
              <div style={{ marginTop: '8px', background: 'var(--color-accent)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)' }}>
                {dropTarget.type === 'folder' || dropTarget.type === 'collection' ? 'Mover para pasta' : 'Criar nova pasta virtual'}
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name || ''}
        isDir={false}
      />

      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => { setIsInputModalOpen(false); setPendingCollectionImages([]); }}
        onConfirm={handleCreateVirtualFolder}
        title="Nova Pasta Virtual"
        placeholder="Dê um nome para a pasta..."
        confirmLabel="Criar"
      />

      <ConfirmModal
        isOpen={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={confirmDeleteFolder}
        title="Excluir Pasta Física"
        message="Deseja excluir esta pasta? As imagens originais não serão apagadas, elas serão movidas para a raiz da galeria."
        variant="danger"
        confirmLabel="Excluir e Resgatar Imagens"
      />
    </div>
  );
}
