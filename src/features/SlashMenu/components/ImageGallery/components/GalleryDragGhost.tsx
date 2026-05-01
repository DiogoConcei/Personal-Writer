import { Layers } from 'lucide-react';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import styles from '../ImageGallery.module.scss';

interface GalleryDragGhostProps {
  draggedItem: any;
  dragPosition: { x: number; y: number };
  rootPath: string | null;
  selectedCount: number;
  dropTargetLabel: string | null;
}

export function GalleryDragGhost({
  draggedItem,
  dragPosition,
  rootPath,
  selectedCount,
  dropTargetLabel,
}: GalleryDragGhostProps) {
  if (!draggedItem) return null;

  return (
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
      <div className={styles.dragGhost__container}>
        <img 
          src={resolveAssetPath(draggedItem.path, rootPath)} 
          className={styles.dragGhost__img}
          alt="" 
        />
        {selectedCount > 1 && (
          <div className={styles.dragGhost__badge}>
            <Layers size={12} /> {selectedCount}
          </div>
        )}
      </div>
      {dropTargetLabel && (
        <div className={styles.dragGhost__label}>
          {dropTargetLabel}
        </div>
      )}
    </div>
  );
}
