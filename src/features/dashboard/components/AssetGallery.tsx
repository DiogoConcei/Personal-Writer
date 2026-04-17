import { useEffect, useState, useMemo, useRef } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore, GalleryCollection } from '../store/galleryStore';
import { listDirectory, resolveAssetPath, ImageAsset, copyImageToAssets } from '@/tauri-bridge/fs';
import { open } from '@tauri-apps/plugin-dialog';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import ImageViewer from '@/features/editor/components/ImageViewer';
import InputModal from '@/shared/components/Modal/InputModal';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';
import styles from './AssetGallery.module.scss';
import {
  Image as ImageIcon, Search, RefreshCw, FolderPlus,
  CheckSquare, X, Folder, Upload, ImagePlus,
  Edit2, Trash2, Layers, MoreHorizontal, ChevronRight
} from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

interface DropTarget {
  type: 'image' | 'folder';
  id: string;
}

export default function AssetGallery() {
  const { rootPath } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const {
    collections,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    isLoading: isStoreLoading
  } = useGalleryStore();

  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<GalleryCollection | null>(null);
  const [filter, setFilter] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isPickingExisting, setIsPickingExisting] = useState(false);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalMode, setInputModalOpen] = useState<'create' | 'rename'>('create');
  const [pendingCollectionImages, setPendingCollectionImages] = useState<string[]>([]);
  const [collectionToRename, setCollectionToRename] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  const draggedItemRef = useRef<ImageAsset | null>(null);
  const isDraggingRef = useRef(false);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartTime = useRef(0);
  const processingDrop = useRef(false);
  const lastDetectionTime = useRef(0);

  const loadAssets = async () => {
    if (!rootPath) return;
    setIsLoading(true);
    try {
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const assetsPath = `${rootPath}${separator}assets`;
      const scanFolder = async (path: string): Promise<ImageAsset[]> => {
        const entries = await listDirectory(path);
        let results: ImageAsset[] = [];
        for (const entry of entries) {
          if (entry.is_dir) {
            results = [...results, ...await scanFolder(entry.path)];
          } else {
            if (IMAGE_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext))) {
              results.push({
                name: entry.name,
                path: entry.path.replace(rootPath, '').replace(/^[\\/]/, './').replace(/\\/g, '/'),
                full_path: entry.path
              });
            }
          }
        }
        return results;
      };
      setImages(await scanFolder(assetsPath));
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadAssets();
    loadCollections();
  }, [rootPath]);

  const handleUpload = async () => {
    if (!rootPath) return;
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Imagens', extensions: IMAGE_EXTENSIONS.map(ext => ext.replace('.', '')) }]
      });
      if (selected && Array.isArray(selected)) {
        setIsLoading(true);
        const newPaths: string[] = [];
        for (const path of selected) {
          const relativePath = await copyImageToAssets(path, rootPath);
          newPaths.push(relativePath);
        }
        await loadAssets();
        if (activeCollection) await addToCollection(activeCollection.id, newPaths);
        addNotification(`${selected.length} imagem(ns) importada(s)`, 'success');
      }
    } catch (err) {
      console.error(err);
      addNotification('Erro ao importar imagens', 'error');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;
    const setupDragDrop = async () => {
      unlistenFn = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop' && rootPath) {
          const imagePaths = event.payload.paths.filter(p => IMAGE_EXTENSIONS.some(ext => p.toLowerCase().endsWith(ext)));
          if (imagePaths.length > 0) {
            setIsLoading(true);
            const importedRelativePaths: string[] = [];
            for (const path of imagePaths) {
              try {
                importedRelativePaths.push(await copyImageToAssets(path, rootPath));
              } catch (err) { console.error(err); }
            }
            await loadAssets();
            const element = document.elementFromPoint(event.payload.position.x, event.payload.position.y);
            const folderId = element?.closest('[data-drag-type="folder"]')?.getAttribute('data-drag-id');
            if (folderId) await addToCollection(folderId, importedRelativePaths);
            else if (activeCollection) await addToCollection(activeCollection.id, importedRelativePaths);

            addNotification(`${imagePaths.length} imagem(ns) adicionada(s)`, 'success');
            setIsLoading(false);
          }
        }
      });
    };
    setupDragDrop();
    return () => { if (unlistenFn) unlistenFn(); };
  }, [rootPath, activeCollection]);

  const [draggedItemState, setDraggedItemState] = useState<ImageAsset | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const handleMouseDown = (e: React.MouseEvent, img: ImageAsset) => {
    if (e.button !== 0 || processingDrop.current) return;
    e.preventDefault();
    draggedItemRef.current = img;
    setDraggedItemState(img);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartTime.current = Date.now();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('is-dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    if (!isDraggingRef.current && (deltaX > 8 || deltaY > 8)) {
      isDraggingRef.current = true;
      setIsDraggingState(true);
    }
    if (isDraggingRef.current) {
      setDragPosition({ x: e.clientX, y: e.clientY });
      const now = Date.now();
      if (now - lastDetectionTime.current > 50) {
        lastDetectionTime.current = now;
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const targetCard = elementAtPoint?.closest('[data-drag-id]');
        if (targetCard) {
          const type = targetCard.getAttribute('data-drag-type') as 'image' | 'folder';
          const id = targetCard.getAttribute('data-drag-id')!;
          if (type === 'image' && (id === draggedItemRef.current?.path || selectedPaths.includes(id))) {
            setDropTarget(null);
            dropTargetRef.current = null;
          } else {
            const newTarget: DropTarget = { type, id };
            setDropTarget(newTarget);
            dropTargetRef.current = newTarget;
          }
        } else {
          setDropTarget(null);
          dropTargetRef.current = null;
        }
      }
    }
  };

  const handleMouseUp = async (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('is-dragging');
    if (processingDrop.current) return;
    const wasDragging = isDraggingRef.current;
    const target = dropTargetRef.current;
    const currentItem = draggedItemRef.current;
    setDraggedItemState(null);
    draggedItemRef.current = null;
    setIsDraggingState(false);
    isDraggingRef.current = false;
    setDropTarget(null);
    dropTargetRef.current = null;
    if (wasDragging && target && currentItem) {
      processingDrop.current = true;
      const sourceItems = selectedPaths.includes(currentItem.path) ? selectedPaths : [currentItem.path];
      try {
        if (target.type === 'folder') {
          await addToCollection(target.id, sourceItems);
          addNotification(`${sourceItems.length} imagem(ns) movida(s)`, 'success');
          if (isSelectionMode) { setSelectedPaths([]); setIsSelectionMode(false); }
        } else if (target.type === 'image') {
          setPendingCollectionImages([...sourceItems, target.id]);
          setInputModalOpen('create');
          setIsInputModalOpen(true);
        }
      } finally { setTimeout(() => { processingDrop.current = false; }, 100); }
    }
  };

  const filteredImages = useMemo(() => {
    const isSearching = filter.trim().length > 0;
    const allAssignedPaths = new Set(collections.flatMap(c => c.images));

    let baseList: ImageAsset[] = [];

    if (activeCollection && !isPickingExisting) {
      const subCollections = collections.filter(c => c.parentId === activeCollection.id);
      const pathsInSubCollections = new Set(subCollections.flatMap(c => c.images));

      baseList = images.filter(img =>
        activeCollection.images.includes(img.path) &&
        (isSearching || !pathsInSubCollections.has(img.path))
      );
    } else if (activeCollection && isPickingExisting) {
      baseList = images.filter(img => !allAssignedPaths.has(img.path));
    } else {
      baseList = isSearching ? images : images.filter(img => !allAssignedPaths.has(img.path));
    }

    return baseList.filter(img => img.name.toLowerCase().includes(filter.toLowerCase()));
  }, [images, filter, activeCollection, collections, isPickingExisting]);

  const filteredCollections = useMemo(() => {
    if (isPickingExisting) return [];
    return collections.filter(c => c.parentId === activeCollection?.id && c.name.toLowerCase().includes(filter.toLowerCase()));
  }, [collections, filter, activeCollection, isPickingExisting]);

  const dynamicCols = Math.max(1, Math.min(filteredImages.length + filteredCollections.length, 4));

  const handleBreadcrumbClick = (col: GalleryCollection | null) => {
    setActiveCollection(col);
    setIsPickingExisting(false);
    setIsSelectionMode(false);
    setSelectedPaths([]);
  };

  const getBreadcrumbs = () => {
    const crumbs: (GalleryCollection | null)[] = [null];
    if (!activeCollection) return crumbs;
    const buildPath = (id: string) => {
      const col = collections.find(c => c.id === id);
      if (col) {
        if (col.parentId) buildPath(col.parentId);
        crumbs.push(col);
      }
    };
    buildPath(activeCollection.id);
    return crumbs;
  };

  const handleInputConfirm = async (name: string) => {
    if (inputModalMode === 'create') {
      await createCollection(name, pendingCollectionImages, activeCollection?.id);
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
      if (activeCollection?.id === id) setActiveCollection(null);
      setCollectionToDelete(null);
    } catch (err) {
      addNotification('Erro ao excluir pasta', 'error');
    }
  };

  if (activeImage) return <div className={styles.viewerWrapper}><ImageViewer path={activeImage} onBack={() => { setActiveImage(null); loadAssets(); }} /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
          <div className={styles.breadcrumbs}>
            {getBreadcrumbs().map((crumb, i) => (
              <div key={i === 0 ? 'root' : crumb?.id} className={styles.breadcrumbItem}>
                {i > 0 && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
                <button className={`${styles.breadcrumbBtn} ${crumb?.id === activeCollection?.id ? styles['breadcrumbBtn--active'] : ''}`} onClick={() => handleBreadcrumbClick(crumb)}>{crumb ? crumb.name : 'Galeria'}</button>
              </div>
            ))}
            {isPickingExisting && <><ChevronRight size={14} className={styles.breadcrumbSeparator} /><span className={styles.breadcrumbPicking}>Adicionando imagens</span></>}
          </div>
          <span className={styles.count}>{filteredImages.length} imagens</span>
        </div>

        <div className={styles.actions}>
          <div className={styles.collectionActions}>
            <button className={styles.actionBtn} title="Upload" onClick={handleUpload}><Upload size={18} />{activeCollection && <span>Upload</span>}</button>
            {activeCollection && !isPickingExisting && <button className={styles.actionBtn} title="Adicionar" onClick={() => { setIsPickingExisting(true); setIsSelectionMode(true); }}><ImagePlus size={18} /><span>Adicionar</span></button>}
            {activeCollection && !isPickingExisting && (
              <>
                <button className={styles.actionBtn} title="Renomear Pasta" onClick={() => handleOpenRename(activeCollection.id)}><Edit2 size={18} /></button>
                <button className={`${styles.actionBtn} ${styles['actionBtn--danger']}`} title="Excluir Pasta" onClick={() => setCollectionToDelete(activeCollection.id)}><Trash2 size={18} /></button>
              </>
            )}
            <div className={styles.divider} />
          </div>
          <div className={styles.search}><Search size={16} /><input type="text" placeholder="Buscar..." value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
          <button className={`${styles.actionBtn} ${isSelectionMode ? styles['actionBtn--active'] : ''}`} onClick={() => { setIsSelectionMode(!isSelectionMode); setIsPickingExisting(false); setSelectedPaths([]); }}>{isSelectionMode ? <><div className={styles.pulseDot} /><CheckSquare size={18} /><span>Finalizar</span></> : <><CheckSquare size={18} /><span>Organizar</span></>}</button>
          <button className={styles.refreshBtn} onClick={loadAssets} disabled={isLoading}><RefreshCw size={18} className={isLoading ? styles.spin : ''} /></button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.grid} style={{ '--cols': dynamicCols } as any}>
          {filteredCollections.map(col => (
            <div key={col.id} className={`${styles.folderCard} ${dropTarget?.id === col.id ? styles['folderCard--dragOver'] : ''}`} data-drag-type="folder" data-drag-id={col.id} onClick={() => setActiveCollection(col)} onDragStart={(e) => e.preventDefault()}>
              <button className={styles.folderCard__delete} onClick={(e) => { e.stopPropagation(); setCollectionToDelete(col.id); }}><Trash2 size={14} /></button>
              <div className={styles.folderCard__previews}>
                {col.images.length > 0 ? (
                  <div className={styles.folderCard__heroLayout}>
                    <div className={styles.folderCard__hero}><img src={resolveAssetPath(col.images[0], rootPath)} alt="" /></div>
                    <div className={styles.folderCard__sidebar}>
                      {col.images.slice(1, 4).map((p, i) => <div key={i} className={styles.folderCard__sideItem}><img src={resolveAssetPath(p, rootPath)} alt="" /></div>)}
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
            <div key={img.full_path} data-drag-type="image" data-drag-id={img.path} onMouseDown={(e) => handleMouseDown(e, img)} onDragStart={(e) => e.preventDefault()} className={`${styles.card} ${selectedPaths.includes(img.path) ? styles['card--selected'] : ''} ${draggedItemState?.path === img.path ? styles['card--dragging'] : ''} ${dropTarget?.id === img.path ? styles['card--dragOver'] : ''}`} style={{ '--delay': `${i * 0.02}s` } as any} onClick={() => { if (isDraggingRef.current || processingDrop.current) return; if (isSelectionMode) { setSelectedPaths(prev => prev.includes(img.path) ? prev.filter(p => p !== img.path) : [...prev, img.path]); } else { setActiveImage(img.full_path); } }}>
              <div className={styles.card__preview}><img src={resolveAssetPath(img.path, rootPath)} alt={img.name} loading="lazy" onDragStart={(e) => e.preventDefault()} /></div>
              <div className={styles.card__overlay}><span className={styles.card__name}>{img.name}</span></div>
            </div>
          ))}
        </div>
        {isDraggingState && draggedItemState && <div className={styles.dragGhost} style={{ left: dragPosition.x, top: dragPosition.y }}><div className={styles.dragGhost__stack}><img src={resolveAssetPath(draggedItemState.path, rootPath)} alt="" />{selectedPaths.length > 1 && <div className={styles.dragGhost__count}><Layers size={14} /> {selectedPaths.length}</div>}</div>{dropTarget && <div className={styles.dragGhost__label}>{dropTarget.type === 'folder' ? 'Adicionar à pasta' : 'Criar nova pasta'}</div>}</div>}
      </div>

      {isSelectionMode && selectedPaths.length > 0 && <div className={styles.selectionBar}><span>{selectedPaths.length} itens selecionados</span><div className={styles.actions}><button className={styles.btn} onClick={() => { setSelectedPaths([]); if (isPickingExisting) setIsPickingExisting(false); }}>Cancelar</button>{isPickingExisting && activeCollection ? <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={async () => { await addToCollection(activeCollection.id, selectedPaths); setIsPickingExisting(false); setIsSelectionMode(false); setSelectedPaths([]); }}>Confirmar Adição</button> : <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={() => { setPendingCollectionImages(selectedPaths); setInputModalOpen('create'); setIsInputModalOpen(true); }}><FolderPlus size={16} /> Criar Pasta</button>}</div></div>}

      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => { setIsInputModalOpen(false); setPendingCollectionImages([]); setCollectionToRename(null); }}
        onConfirm={handleInputConfirm}
        title={inputModalMode === 'create' ? "Nova Pasta" : "Renomear Pasta"}
        placeholder="Dê um nome para sua coleção..."
        confirmLabel={inputModalMode === 'create' ? "Criar Pasta" : "Renomear"}
        initialValue={inputModalMode === 'rename' ? (collections.find(c => c.id === collectionToRename || c.id === activeCollection?.id)?.name || "") : ""}
      />
      <ConfirmModal isOpen={!!collectionToDelete} onClose={() => setCollectionToDelete(null)} onConfirm={() => collectionToDelete && handleDeleteCollection(collectionToDelete)} title="Excluir Pasta" message="Tem certeza que deseja excluir esta pasta? As imagens originais não serão apagadas." variant="danger" confirmLabel="Excluir" />
    </div>
  );
}
