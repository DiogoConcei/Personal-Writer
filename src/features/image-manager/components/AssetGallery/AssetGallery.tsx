import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore } from '../../store/galleryStore';
import { resolveAssetPath, ImageAsset } from '@/tauri-bridge/fs';
import { useImageManager } from '@/shared/hooks/useImageManager/useImageManager';
import { useDragAndDrop } from '@/shared/hooks/useDragAndDrop/useDragAndDrop';
import { useNativeDragDrop } from '@/shared/hooks/useNativeDragDrop/useNativeDragDrop';
import ImageViewer from '../ImageViewer/ImageViewer';
import InputModal from '@/shared/components/Modal/InputModal/InputModal';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal/ConfirmModal';
import { SectionTabs } from './components/SectionTabs/SectionTabs';
import styles from './AssetGallery.module.scss';
import {
  Search, RefreshCw, FolderPlus,
  CheckSquare, Folder, Upload, ImagePlus,
  Edit2, Trash2, Layers, MoreHorizontal, ChevronRight
} from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

export default function AssetGallery() {
  const { rootPath, isScanning, scanImages, invalidateImageCache } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const {
    collections,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection
  } = useGalleryStore();
  const { 
    uploadImages, 
    handleImageDrop,
    activeTarget,
    activeSection,
    handleSectionChange,
    filter,
    setFilter,
    isPickingExisting,
    setIsPickingExisting,
    filteredImages,
    filteredCollections,
    handleTargetClick,
    getBreadcrumbs
  } = useImageManager();

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalMode, setInputModalOpen] = useState<'create' | 'rename'>('create');
  const [pendingCollectionImages, setPendingCollectionImages] = useState<string[]>([]);
  const [collectionToRename, setCollectionToRename] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

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
      // Tenta usar o processador central do ImageManager
      const handled = await handleImageDrop(item, targetType, targetId, selectedPaths);
      
      if (handled) {
        if (isSelectionMode) { 
          setSelectedPaths([]); 
          setIsSelectionMode(false); 
        }
      } else if (targetType === 'image') {
        // Fallback específico do AssetGallery: Criar coleção virtual ao soltar imagem sobre imagem
        const sourceItems = selectedPaths.includes(item.path) ? selectedPaths : [item.path];
        setPendingCollectionImages([...sourceItems, targetId]);
        setInputModalOpen('create');
        setIsInputModalOpen(true);
      }
    },
    isValidTarget: (item, type, id) => {
      if (type === 'image' && (id === item.path || selectedPaths.includes(id))) {
        return false;
      }
      return true;
    }
  });

  useEffect(() => {
    if (rootPath) {
      scanImages();
      loadCollections();
    }
  }, [rootPath]);

  const handleUpload = async () => {
    const importedPaths = await uploadImages();
    if (importedPaths && activeTarget?.type === 'virtual') {
      await addToCollection(activeTarget.id, importedPaths);
    }
  };

  // Efeito para Drag & Drop Externo (Desktop -> App)
  useNativeDragDrop({
    onDrop: async (imagePaths, position) => {
      const element = document.elementFromPoint(position.x, position.y);
      const folderId = element?.closest('[data-drag-type="folder"]')?.getAttribute('data-drag-id');
      
      const importedPaths = await uploadImages('', imagePaths);
      
      if (importedPaths) {
        if (folderId) await addToCollection(folderId, importedPaths);
        else if (activeTarget?.type === 'virtual') await addToCollection(activeTarget.id, importedPaths);
      }
    },
    filters: IMAGE_EXTENSIONS,
    disabled: !rootPath
  });

  const dynamicCols = Math.max(1, Math.min(filteredImages.length + filteredCollections.length, 4));

  const handleInputConfirm = async (name: string) => {
    if (inputModalMode === 'create') {
      const parentId = activeTarget?.type === 'virtual' ? activeTarget.id : undefined;
      await createCollection(name, pendingCollectionImages, parentId);
      addNotification('Pasta criada com sucesso', 'success');
      setPendingCollectionImages([]);
    } else {
      if (collectionToRename) {
        await updateCollection(collectionToRename, { name });
        addNotification('Pasta renomeada', 'success');
        setCollectionToRename(null);
      }
    }
    setIsInputModalOpen(false);
    if (isSelectionMode) { setSelectedPaths([]); setIsSelectionMode(false); }
  };

  const handleOpenRename = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollectionToRename(id);
    setInputModalOpen('rename');
    setIsInputModalOpen(true);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      addNotification('Pasta excluída', 'success');
      if (activeTarget?.type === 'virtual' && activeTarget.id === id) {
        handleTargetClick(null);
      }
      setCollectionToDelete(null);
    } catch (err) {
      addNotification('Erro ao excluir pasta', 'error');
    }
  };

  if (activeImage) return <div className={styles.viewerWrapper}><ImageViewer path={activeImage} onBack={() => { setActiveImage(null); scanImages(); }} /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
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
            {isPickingExisting && <><ChevronRight size={14} className={styles.breadcrumbSeparator} /><span className={styles.breadcrumbPicking}>Adicionando imagens</span></>}
          </div>
          <span className={styles.count}>{filteredImages.length} imagens</span>
        </div>

        <SectionTabs activeSection={activeSection} onSectionChange={handleSectionChange} />

        <div className={styles.actions}>
          <div className={styles.collectionActions}>
            <button className={styles.actionBtn} title="Upload" onClick={handleUpload}><Upload size={18} />{activeTarget && <span>Upload</span>}</button>
            {activeTarget?.type === 'virtual' && !isPickingExisting && <button className={styles.actionBtn} title="Adicionar" onClick={() => { setIsPickingExisting(true); setIsSelectionMode(true); }}><ImagePlus size={18} /><span>Adicionar</span></button>}
            {activeTarget?.type === 'virtual' && !isPickingExisting && (
              <>
                <button className={styles.actionBtn} title="Renomear Pasta" onClick={() => handleOpenRename(activeTarget.id)}><Edit2 size={18} /></button>
                <button className={`${styles.actionBtn} ${styles['actionBtn--danger']}`} title="Excluir Pasta" onClick={() => setCollectionToDelete(activeTarget.id)}><Trash2 size={18} /></button>
              </>
            )}
            <div className={styles.divider} />
          </div>
          <div className={styles.search}><Search size={16} /><input type="text" placeholder="Buscar..." value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
          <button className={`${styles.actionBtn} ${isSelectionMode ? styles['actionBtn--active'] : ''}`} onClick={() => { setIsSelectionMode(!isSelectionMode); setIsPickingExisting(false); setSelectedPaths([]); }}>{isSelectionMode ? <><div className={styles.pulseDot} /><CheckSquare size={18} /><span>Finalizar</span></> : <><CheckSquare size={18} /><span>Organizar</span></>}</button>
          <button className={styles.refreshBtn} onClick={() => { invalidateImageCache(); scanImages(); }} disabled={isScanning}><RefreshCw size={18} className={isScanning ? styles.spin : ''} /></button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.grid} style={{ '--cols': dynamicCols } as any}>
          {filteredCollections.map(col => (
            <div key={col.id} className={`${styles.folderCard} ${dropTarget?.id === col.id ? styles['folderCard--dragOver'] : ''}`} data-drag-type="folder" data-drag-id={col.id} onClick={() => handleTargetClick({ type: 'virtual', id: col.id })} onDragStart={(e) => e.preventDefault()}>
              <button className={styles.folderCard__delete} onClick={(e) => { e.stopPropagation(); setCollectionToDelete(col.id); }}><Trash2 size={14} /></button>
              <div className={styles.folderCard__previews}>
                {col.images.length > 0 ? (
                  <div className={styles.folderCard__heroLayout}>
                    <div className={styles.folderCard__hero}><img src={resolveAssetPath(col.images[0], rootPath) || undefined} alt="" /></div>
                    <div className={styles.folderCard__sidebar}>
                      {col.images.slice(1, 4).map((p, i) => <div key={i} className={styles.folderCard__sideItem}><img src={resolveAssetPath(p, rootPath) || undefined} alt="" /></div>)}
                      {col.images.length > 4 && <div className={styles.folderCard__more}><MoreHorizontal size={16} /></div>}
                    </div>
                  </div>
                ) : <div className={styles.folderCard__empty}><Folder size={48} strokeWidth={1} /></div>}
              </div>
              <div className={styles.folderCard__glassInfo}>
                <div className={styles.folderCard__text} onClick={(e) => handleOpenRename(col.id, e)}>
                  <span className={styles.folderCard__name}>{col.name}</span>
                  <span className={styles.folderCard__count}>{col.images.length} imagens</span>
                </div>
                <div className={styles.folderCard__icon}><Layers size={14} /></div>
              </div>
            </div>
          ))}
          {filteredImages.map((img, i) => (
            <div key={img.full_path} data-drag-type="image" data-drag-id={img.path} onMouseDown={(e) => handleMouseDown(e, img)} onDragStart={(e) => e.preventDefault()} className={`${styles.card} ${selectedPaths.includes(img.path) ? styles['card--selected'] : ''} ${draggedItem?.path === img.path ? styles['card--dragging'] : ''} ${dropTarget?.id === img.path ? styles['card--dragOver'] : ''}`} style={{ '--delay': `${i * 0.02}s` } as any} onClick={() => { if (shouldIgnoreClick()) return; if (isSelectionMode) { setSelectedPaths(prev => prev.includes(img.path) ? prev.filter(p => p !== img.path) : [...prev, img.path]); } else { setActiveImage(img.full_path); } }}>
              <div className={styles.card__preview}><img src={resolveAssetPath(img.path, rootPath) || undefined} alt={img.name} loading="lazy" onDragStart={(e) => e.preventDefault()} /></div>
              <div className={styles.card__overlay}><span className={styles.card__name}>{img.name}</span></div>
            </div>
          ))}
        </div>
        {isDragging && draggedItem && <div className={styles.dragGhost} style={{ left: dragPosition.x, top: dragPosition.y }}><div className={styles.dragGhost__stack}><img src={resolveAssetPath(draggedItem.path, rootPath) || undefined} alt="" />{selectedPaths.length > 1 && <div className={styles.dragGhost__count}><Layers size={14} /> {selectedPaths.length}</div>}</div>{dropTarget && <div className={styles.dragGhost__label}>{dropTarget.type === 'folder' ? 'Adicionar à pasta' : 'Criar nova pasta'}</div>}</div>}
      </div>

      {isSelectionMode && selectedPaths.length > 0 && <div className={styles.selectionBar}><span>{selectedPaths.length} itens selecionados</span><div className={styles.actions}><button className={styles.btn} onClick={() => { setSelectedPaths([]); if (isPickingExisting) setIsPickingExisting(false); }}>Cancelar</button>{isPickingExisting && activeTarget?.type === 'virtual' ? <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={async () => { await addToCollection(activeTarget.id, selectedPaths); setIsPickingExisting(false); setIsSelectionMode(false); setSelectedPaths([]); }}>Confirmar Adição</button> : <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={() => { setPendingCollectionImages(selectedPaths); setInputModalOpen('create'); setIsInputModalOpen(true); }}><FolderPlus size={16} /> Criar Pasta</button>}</div></div>}

      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => { setIsInputModalOpen(false); setPendingCollectionImages([]); setCollectionToRename(null); }}
        onConfirm={handleInputConfirm}
        title={inputModalMode === 'create' ? "Nova Pasta" : "Renomear Pasta"}
        placeholder="Dê um nome para sua coleção..."
        confirmLabel={inputModalMode === 'create' ? "Criar Pasta" : "Renomear"}
        defaultValue={inputModalMode === 'rename' ? (collections.find(c => c.id === collectionToRename || (activeTarget?.type === 'virtual' && c.id === activeTarget.id))?.name || "") : ""}
      />
      <ConfirmModal isOpen={!!collectionToDelete} onClose={() => setCollectionToDelete(null)} onConfirm={() => collectionToDelete && handleDeleteCollection(collectionToDelete)} title="Excluir Pasta" message="Tem certeza que deseja excluir esta pasta? As imagens originais não serão apagadas." variant="danger" confirmLabel="Excluir" />
    </div>
  );
}
