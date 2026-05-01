import React from 'react';
import { Folder, Trash2, CheckSquare } from 'lucide-react';
import { ImageAsset, resolveAssetPath } from '@/tauri-bridge/fs';
import styles from '../ImageGallery.module.scss';

interface GalleryItemProps {
  type: 'image' | 'folder' | 'collection';
  id: string;
  label: string;
  imageItem?: ImageAsset;
  rootPath: string | null;
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isSelectionMode?: boolean;
  disableOrganization?: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function GalleryItem({
  type,
  id,
  label,
  imageItem,
  rootPath,
  isSelected,
  isDragging,
  isDragOver,
  disableOrganization,
  onSelect,
  onDelete,
  onMouseDown,
}: GalleryItemProps) {
  if (type === 'image' && imageItem) {
    return (
      <div
        className={`${styles.imageItem} ${isSelected ? styles['imageItem--selected'] : ''} ${isDragOver ? styles['imageItem--dragOver'] : ''} ${isDragging ? styles['imageItem--dragging'] : ''}`}
        data-drag-type="image"
        data-drag-id={id}
        onMouseDown={onMouseDown}
        onClick={onSelect}
        title={id}
      >
        {!disableOrganization && (
          <button className={styles.deleteBtn} onClick={onDelete} title="Excluir">
            <Trash2 size={14} />
          </button>
        )}

        <div className={styles.imageWrapper}>
          <img
            src={resolveAssetPath(id, rootPath)}
            alt={label}
            loading="lazy"
            onDragStart={e => e.preventDefault()}
          />
          {isSelected && (
            <div style={{ position: 'absolute', top: 5, left: 5, color: 'var(--color-accent)', background: 'var(--color-bg-surface)', borderRadius: '4px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <CheckSquare size={20} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.folderItem} ${isDragOver ? styles['folderItem--dragOver'] : ''}`}
      data-drag-type={type}
      data-drag-id={id}
      onClick={onSelect}
      title={`Abrir ${label}`}
    >
      {!disableOrganization && (
        <button className={styles.deleteBtn} onClick={onDelete} title={`Excluir ${type === 'collection' ? 'Pasta Virtual' : 'Pasta Física'}`}>
          <Trash2 size={14} />
        </button>
      )}
      <div className={styles.folderIcon} style={type === 'folder' ? { color: 'var(--color-text-muted)' } : undefined}>
        <Folder size={40} />
        <span>{label}</span>
      </div>
    </div>
  );
}
