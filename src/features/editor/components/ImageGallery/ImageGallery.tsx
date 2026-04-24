import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useGalleryStore } from '@/features/dashboard/store/galleryStore';
import { deleteItem, copyImageToAssets, resolveAssetPath, ImageAsset, createDirectory } from '@/tauri-bridge/fs';
import { open } from '@tauri-apps/plugin-dialog';
import DeleteModal from '@/features/workspace/components/DeleteModal';
import InputModal from '@/shared/components/Modal/InputModal';
import styles from './ImageGallery.module.scss';
import {
  Image as ImageIcon,
  X,
  Search,
  Trash2,
  Upload,
  RefreshCw,
  Folder,
  ChevronLeft,
  Plus,
  Layers
} from 'lucide-react';

interface ImageGalleryProps {
  onSelect: (src: string) => void;
  onClose: () => void;
}

export default function ImageGallery({ onSelect, onClose }: ImageGalleryProps) {
  const { rootPath, cachedImages, isScanning, scanImages, invalidateImageCache } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { collections, createCollection, addToCollection, loadCollections } = useGalleryStore();

  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>(''); // '' raiz, ou path físico, ou collection id
  const [itemToDelete, setItemToDelete] = useState<ImageAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [emptyPhysicalFolders, setEmptyPhysicalFolders] = useState<string[]>([]);

  // Estado para Modal de Criação
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalMode, setInputModalMode] = useState<'physical' | 'virtual'>('physical');
  const [pendingVirtualImages, setPendingVirtualImages] = useState<string[]>([]);

  // Estado para Drag & Drop (Virtual)
  const draggedItemRef = useRef<ImageAsset | null>(null);
  const isDraggingRef = useRef(false);
  const [draggedItemState, setDraggedItemState] = useState<ImageAsset | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ type: 'image' | 'folder' | 'collection'; id: string } | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const processingDrop = useRef(false);

  useEffect(() => {
    if (rootPath) {
      scanImages();
      loadCollections();
    }
  }, [rootPath]);

  const handleUpload = async () => {
    if (!rootPath) return;

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Imagens',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        }]
      });

      if (selected && typeof selected === 'string') {
        setIsUploading(true);
        
        // Se estivermos em uma pasta física, faz upload nela. Se estivermos em uma coleção ou raiz, vai para assets.
        const isCollection = collections.some(c => c.id === currentFolder);
        const subFolder = isCollection ? undefined : (currentFolder || undefined);
        
        const relativePath = await copyImageToAssets(selected, rootPath, subFolder);
        
        // Se for coleção, adiciona a imagem nela também
        if (isCollection) {
          await addToCollection(currentFolder, [relativePath]);
        }

        invalidateImageCache();
        await scanImages();
      }
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, item: ImageAsset) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.full_path);
      invalidateImageCache();
      await scanImages();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleImageSelect = (item: ImageAsset) => {
    onSelect(item.path);
    onClose();
  };

  const handleFolderClick = (folderPath: string) => {
    setCurrentFolder(folderPath);
  };

  const handleBackClick = () => {
    if (currentFolder === '') return;
    const isCollection = collections.some(c => c.id === currentFolder);
    
    if (isCollection) {
      const col = collections.find(c => c.id === currentFolder);
      setCurrentFolder(col?.parentId || '');
    } else {
      const parts = currentFolder.split('/');
      parts.pop();
      setCurrentFolder(parts.join('/'));
    }
  };

  const getFolderName = (fullPath: string) => {
    const isCollection = collections.find(c => c.id === fullPath);
    if (isCollection) return isCollection.name;
    const parts = fullPath.split('/');
    return parts[parts.length - 1];
  };

  const handleCreateFolderClick = () => {
    const isCollection = collections.some(c => c.id === currentFolder);
    if (isCollection) {
      // Dentro de uma coleção, criamos sub-coleções (virtuais)
      setInputModalMode('virtual');
    } else {
      // Na raiz ou pasta física, criamos pastas físicas
      setInputModalMode('physical');
    }
    setIsInputModalOpen(true);
  };

  const handleInputConfirm = async (name: string) => {
    if (!name || !name.trim()) return;

    if (inputModalMode === 'physical') {
      const separator = rootPath?.includes('\\') ? '\\' : '/';
      const folderName = name.trim();
      const relativePath = currentFolder ? `${currentFolder}/${folderName}` : folderName;
      const fullPath = `${rootPath}${separator}${relativePath.replace(/\//g, separator)}`;

      try {
        await createDirectory(fullPath);
        setEmptyPhysicalFolders(prev => [...prev, relativePath]);
        addNotification('Pasta física criada', 'success');
      } catch (err) {
        console.error('Erro ao criar pasta física:', err);
        addNotification('Erro ao criar pasta', 'error');
      }
    } else {
      // Virtual (Coleção)
      const parentId = collections.some(c => c.id === currentFolder) ? currentFolder : undefined;
      await createCollection(name.trim(), pendingVirtualImages, parentId);
      setPendingVirtualImages([]);
      addNotification('Coleção criada', 'success');
    }
    setIsInputModalOpen(false);
  };

  // Lógica de Drag & Drop
  const handleMouseDown = (e: React.MouseEvent, img: ImageAsset) => {
    if (e.button !== 0 || processingDrop.current) return;
    draggedItemRef.current = img;
    setDraggedItemState(img);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
      const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
      const targetCard = elementAtPoint?.closest('[data-drag-id]');
      if (targetCard) {
        const type = targetCard.getAttribute('data-drag-type') as any;
        const id = targetCard.getAttribute('data-drag-id')!;
        if (id !== draggedItemRef.current?.path) {
          setDropTarget({ type, id });
        } else {
          setDropTarget(null);
        }
      } else {
        setDropTarget(null);
      }
    }
  };

  const handleMouseUp = async () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    const wasDragging = isDraggingRef.current;
    const target = dropTarget;
    const currentItem = draggedItemRef.current;

    setDraggedItemState(null);
    draggedItemRef.current = null;
    setIsDraggingState(false);
    isDraggingRef.current = false;
    setDropTarget(null);

    if (wasDragging && target && currentItem) {
      processingDrop.current = true;
      try {
        if (target.type === 'collection') {
          await addToCollection(target.id, [currentItem.path]);
          addNotification('Imagem adicionada à coleção', 'success');
        } else if (target.type === 'image') {
          setPendingVirtualImages([currentItem.path, target.id]);
          setInputModalMode('virtual');
          setIsInputModalOpen(true);
        }
      } finally {
        setTimeout(() => { processingDrop.current = false; }, 100);
      }
    }
  };

  const currentView = useMemo(() => {
    const baseImages = cachedImages || [];
    const term = search.toLowerCase();
    
    // Pesquisa global plana quando há termo de busca
    if (term) {
      const filtered = baseImages.filter(img =>
        img.name.toLowerCase().includes(term) ||
        img.path.toLowerCase().includes(term)
      );
      filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      return { folders: [], collections: [], images: filtered, isSearching: true, totalCount: filtered.length };
    }

    const foldersSet = new Set<string>();
    const imagesList: ImageAsset[] = [];
    const activeColId = collections.some(c => c.id === currentFolder) ? currentFolder : null;

    if (activeColId) {
      // Visão de Coleção
      const activeCol = collections.find(c => c.id === activeColId)!;
      const colImages = baseImages.filter(img => activeCol.images.includes(img.path));
      const subCols = collections.filter(c => c.parentId === activeColId);
      
      return {
        folders: [],
        collections: subCols,
        images: colImages,
        isSearching: false,
        totalCount: subCols.length + colImages.length
      };
    }

    // Visão de Pasta Física ou Raiz
    baseImages.forEach(img => {
      // Normaliza o path: remove './'
      let relPath = img.path;
      if (relPath.startsWith('./')) relPath = relPath.substring(2);
      
      // Achata virtualmente 'assets/' e 'moodboard/'
      let virtualRelPath = relPath;
      if (relPath.startsWith('assets/')) {
        virtualRelPath = relPath.substring(7);
      } else if (relPath === 'assets') {
        return;
      }

      if (relPath.startsWith('moodboard/')) {
        virtualRelPath = relPath.substring(10);
      } else if (relPath === 'moodboard') {
        return;
      }

      const parts = virtualRelPath.split('/');
      parts.pop(); // remove o nome do arquivo para ter apenas o caminho da pasta
      const imgFolder = parts.join('/');

      if (currentFolder === '') {
        // Estamos na raiz virtual
        if (imgFolder === '') {
          imagesList.push(img); // Imagem na raiz (ou vinda de assets/moodboard)
        } else {
          foldersSet.add(parts[0]); // Pasta de nível superior
        }
      } else {
        // Estamos dentro de uma pasta virtual
        if (imgFolder === currentFolder) {
          imagesList.push(img); // Imagem direta nesta pasta
        } else if (imgFolder.startsWith(currentFolder + '/')) {
          // Imagem em uma subpasta
          const remainingPath = imgFolder.substring(currentFolder.length + 1);
          const nextFolder = remainingPath.split('/')[0];
          foldersSet.add(`${currentFolder}/${nextFolder}`);
        }
      }
    });

    // Adiciona pastas vazias
    emptyPhysicalFolders.forEach(folderPath => {
      if (currentFolder === '') {
        if (!folderPath.includes('/')) foldersSet.add(folderPath);
      } else if (folderPath.startsWith(currentFolder + '/') && folderPath.split('/').length === currentFolder.split('/').length + 1) {
        foldersSet.add(folderPath);
      }
    });

    // Adiciona coleções na raiz
    const rootCollections = currentFolder === '' ? collections.filter(c => !c.parentId) : [];

    const sortedFolders = Array.from(foldersSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    const sortedImages = imagesList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return { 
      folders: sortedFolders, 
      collections: rootCollections,
      images: sortedImages, 
      isSearching: false,
      totalCount: sortedFolders.length + rootCollections.length + sortedImages.length 
    };
  }, [cachedImages, search, currentFolder, collections, emptyPhysicalFolders]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.header__left}>
            {currentFolder !== '' && !currentView.isSearching && (
              <button className={styles.backBtn} onClick={handleBackClick} title="Voltar">
                <ChevronLeft size={18} />
              </button>
            )}
            <div className={styles.title}>
              <h2>Galeria de Imagens</h2>
              <span>{currentView.isSearching ? 'Resultados da Pesquisa' : (currentFolder === '' ? 'Raiz do Projeto' : currentFolder)}</span>
            </div>
          </div>
          <div className={styles.header__actions}>
            <button className={styles.refreshBtn} onClick={() => { invalidateImageCache(); scanImages(); }} disabled={isScanning} title="Atualizar galeria">
              <RefreshCw size={16} className={isScanning ? styles.spin : ''} />
            </button>
            <button className={styles.folderBtn} onClick={handleCreateFolderClick} title="Nova Pasta">
              <Plus size={16} />
            </button>
            <button className={styles.uploadBtn} onClick={handleUpload} disabled={isUploading}>
              <Upload size={16} />
              <span>{isUploading ? 'Enviando...' : 'Upload'}</span>
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
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (e.target.value) setCurrentFolder('');
              }}
            />
          </div>
        </div>

        <div className={styles.content}>
          {isScanning && !cachedImages ? (
            <div className={styles.empty}>Escaneando workspace...</div>
          ) : currentView.totalCount === 0 ? (
            <div className={styles.empty}>
              <ImageIcon size={48} />
              <p>{currentView.isSearching ? 'Nenhum resultado encontrado.' : 'Nenhuma imagem nesta pasta.'}</p>
              {currentFolder === '' && !currentView.isSearching && (
                <button className={styles.emptyUploadBtn} onClick={handleUpload}>
                  Fazer Upload da Primeira Imagem
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {/* Renderiza Coleções (Virtuais) */}
              {currentView.collections.map(col => (
                <div
                  key={col.id}
                  className={`${styles.folderItem} ${dropTarget?.id === col.id ? styles['folderItem--dragOver'] : ''}`}
                  data-drag-type="collection"
                  data-drag-id={col.id}
                  onClick={() => handleFolderClick(col.id)}
                  title={`Abrir Coleção ${col.name}`}
                >
                  <div className={styles.folderIcon} style={{ color: 'var(--color-accent)' }}>
                    <Layers size={40} />
                    <span>{col.name}</span>
                  </div>
                </div>
              ))}

              {/* Renderiza Pastas Físicas */}
              {currentView.folders.map(folderPath => (
                <div
                  key={folderPath}
                  className={styles.folderItem}
                  onClick={() => handleFolderClick(folderPath)}
                  title={`Abrir ${getFolderName(folderPath)}`}
                >
                  <div className={styles.folderIcon}>
                    <Folder size={40} />
                    <span>{getFolderName(folderPath)}</span>
                  </div>
                </div>
              ))}

              {/* Renderiza Imagens */}
              {currentView.images.map(item => (
                <div
                  key={item.full_path}
                  className={`${styles.imageItem} ${dropTarget?.id === item.path ? styles['imageItem--dragOver'] : ''}`}
                  data-drag-type="image"
                  data-drag-id={item.path}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onClick={() => handleImageSelect(item)}
                  title={item.path}
                >
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, item)}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className={styles.imageWrapper}>
                    <img
                      src={resolveAssetPath(item.path, rootPath)}
                      alt={item.name}
                      loading="lazy"
                      onDragStart={e => e.preventDefault()}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isDraggingState && draggedItemState && (
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
              boxShadow: 'var(--shadow-lg)'
            }}>
              <img 
                src={resolveAssetPath(draggedItemState.path, rootPath)} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="" 
              />
            </div>
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
        onClose={() => { setIsInputModalOpen(false); setPendingVirtualImages([]); }}
        onConfirm={handleInputConfirm}
        title={inputModalMode === 'physical' ? "Nova Pasta Física" : "Nova Pasta Virtual (Coleção)"}
        placeholder="Dê um nome para a pasta..."
        confirmLabel="Criar"
      />
    </div>
  );
}
