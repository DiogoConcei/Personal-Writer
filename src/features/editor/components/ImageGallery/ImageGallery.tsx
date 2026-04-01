import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { listDirectory, FileNode, deleteItem, renameItem, copyImageToAssets } from '@/tauri-bridge';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import DeleteModal from '@/features/workspace/components/DeleteModal';
import styles from './ImageGallery.module.scss';
import { 
  Folder, 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  Search, 
  ArrowUpDown, 
  Trash2, 
  Move,
  Upload,
  Plus
} from 'lucide-react';

interface ImageGalleryProps {
  onSelect: (src: string) => void;
  onClose: () => void;
}

export default function ImageGallery({ onSelect, onClose }: ImageGalleryProps) {
  const { rootPath } = useWorkspaceStore();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileNode[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [imagesFirst, setImagesFirst] = useState(true);
  const [draggedItem, setDraggedItem] = useState<FileNode | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileNode | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const ASSETS_DIR = 'assets';

  useEffect(() => {
    if (rootPath) {
      loadFolder(`${rootPath}${rootPath.includes('\\') ? '\\' : '/'}${ASSETS_DIR}`);
    }
  }, [rootPath]);

  const loadFolder = async (path: string) => {
    setLoading(true);
    try {
      const files = await listDirectory(path);
      const filtered = files.filter(item => 
        item.is_dir || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.name)
      );
      setItems(filtered);
      setCurrentPath(path);
    } catch (error) {
      console.error('Erro ao carregar galeria:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

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
        
        // Calcular subpasta relativa a 'assets'
        // currentPath: C:/notes/assets/sub
        // rootPath: C:/notes
        // assetsBase: C:/notes/assets
        const separator = rootPath.includes('\\') ? '\\' : '/';
        const assetsBase = `${rootPath}${separator}${ASSETS_DIR}`;
        
        let subFolder: string | undefined = undefined;
        if (currentPath !== assetsBase && currentPath.startsWith(assetsBase)) {
          subFolder = currentPath.replace(assetsBase, '').replace(/^[\\/]/, '');
        }

        await copyImageToAssets(selected, rootPath, subFolder);
        await loadFolder(currentPath);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (!name || !name.trim()) return;

    const separator = currentPath.includes('\\') ? '\\' : '/';
    const newPath = `${currentPath}${separator}${name.trim()}`;

    try {
      await invoke('create_directory', { path: newPath });
      await loadFolder(currentPath);
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
    }
  };

  const handleDelete = (e: React.MouseEvent, item: FileNode) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.path);
      loadFolder(currentPath);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleDragStart = (item: FileNode) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, target: FileNode) => {
    if (target.is_dir && draggedItem && draggedItem.path !== target.path) {
      e.preventDefault();
      e.currentTarget.classList.add(styles['folderItem--dragOver']);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles['folderItem--dragOver']);
  };

  const handleDrop = async (e: React.DragEvent, target: FileNode) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles['folderItem--dragOver']);
    
    if (draggedItem && target.is_dir && draggedItem.path !== target.path) {
      const separator = target.path.includes('\\') ? '\\' : '/';
      const newPath = `${target.path}${separator}${draggedItem.name}`;
      
      try {
        await renameItem(draggedItem.path, newPath);
        loadFolder(currentPath);
      } catch (err) {
        console.error('Erro ao mover item:', err);
      }
    }
    setDraggedItem(null);
  };

  const handleFolderClick = (path: string) => {
    setHistory([...history, currentPath]);
    loadFolder(path);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      loadFolder(prev);
    }
  };

  const handleImageSelect = (item: FileNode) => {
    const relativePath = item.path.replace(rootPath || '', '').replace(/^[\\/]/, './');
    onSelect(relativePath.replace(/\\/g, '/'));
    onClose();
  };

  const sortedAndFilteredItems = useMemo(() => {
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
      return imagesFirst ? (a.is_dir ? 1 : -1) : (a.is_dir ? -1 : 1);
    });
  }, [items, search, imagesFirst]);

  const getDisplayPath = () => {
    if (!rootPath) return '';
    return currentPath.replace(rootPath, '').replace(/^[\\/]/, '') || 'Raiz';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.header__left}>
            {history.length > 0 && (
              <button className={styles.backBtn} onClick={handleBack}>
                <ChevronLeft size={18} />
              </button>
            )}
            <div className={styles.title}>
              <h2>Galeria de Imagens</h2>
              <span>{getDisplayPath()}</span>
            </div>
          </div>
          <div className={styles.header__actions}>
            <button className={styles.uploadBtn} onClick={handleUpload} disabled={isUploading}>
              <Upload size={16} />
              <span>{isUploading ? 'Enviando...' : 'Upload'}</span>
            </button>
            <button className={styles.folderBtn} onClick={handleCreateFolder} title="Nova Pasta">
              <Plus size={16} />
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
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            className={`${styles.sortBtn} ${!imagesFirst ? styles['sortBtn--active'] : ''}`}
            onClick={() => setImagesFirst(!imagesFirst)}
            title={imagesFirst ? "Mostrar Pastas Primeiro" : "Mostrar Imagens Primeiro"}
          >
            <ArrowUpDown size={16} />
            <span>{imagesFirst ? "Imagens Primeiro" : "Pastas Primeiro"}</span>
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.empty}>Carregando...</div>
          ) : sortedAndFilteredItems.length === 0 ? (
            <div className={styles.empty}>
              <ImageIcon size={48} />
              <p>Nenhuma imagem encontrada nesta pasta.</p>
              <button className={styles.emptyUploadBtn} onClick={handleUpload}>
                Fazer Upload da Primeira Imagem
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {sortedAndFilteredItems.map(item => (
                <div 
                  key={item.path} 
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  className={item.is_dir ? styles.folderItem : styles.imageItem}
                  onClick={() => item.is_dir ? handleFolderClick(item.path) : handleImageSelect(item)}
                >
                  <button 
                    className={styles.deleteBtn} 
                    onClick={(e) => handleDelete(e, item)}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className={styles.dragHandle}>
                    <Move size={12} />
                  </div>

                  {item.is_dir ? (
                    <div className={styles.folderIcon}>
                      <Folder size={40} />
                      <span>{item.name}</span>
                    </div>
                  ) : (
                    <div className={styles.imageWrapper}>
                      <img 
                        src={convertFileSrc(item.path)} 
                        alt={item.name} 
                        loading="lazy"
                      />
                      <span className={styles.imageName}>{item.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name || ''}
        isDir={itemToDelete?.is_dir || false}
      />
    </div>
  );
}
