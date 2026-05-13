import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasImageItemProps, ImageData } from '@/shared/types';
import styles from './CanvasImageItem.module.scss';
import { Loader2 } from 'lucide-react';

/**
 * Componente interno para representar uma imagem transformável no canvas
 */
export function CanvasImageItem({ 
  entity, 
  isSelected, 
  isScissorsActive,
  onSelect, 
  onUpdate,
  onRemove,
  onStart,
  onFocus,
  rootPath 
}: CanvasImageItemProps) {
  const data = entity.data as ImageData;
  const isPending = data.isPending;

  const handleEntityInteraction = () => {
    if (isScissorsActive) {
      onFocus();
    } else {
      onSelect();
    }
  };

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 100,
    onSelect: handleEntityInteraction,
    onUpdate,
    onRemove,
    onStart
  });

  return (
    <div 
      className={`${styles.canvasImage} ${isSelected ? styles.selected : ''} ${isPending ? styles.pending : ''} ${data.isCrop ? styles.isCrop : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 300,
        height: entity.height || 'auto',
        transform: `rotate(${entity.rotation || 0}deg)`,
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {isPending ? (
        <div className={styles.loaderContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <span className={styles.progressText}>{data.progress || 0}%</span>
        </div>
      ) : (
        <img 
          src={resolveAssetPath(data.path, rootPath)} 
          alt="" 
          draggable={false} 
          crossOrigin="anonymous" 
        />
      )}

      {isSelected && !isPending && (
        <>
          <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => handleResizeStart('tl', e)} />
          <div className={`${styles.handle} ${styles['handle--tr']}`} onMouseDown={(e) => handleResizeStart('tr', e)} />
          <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => handleResizeStart('bl', e)} />
          <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => handleResizeStart('br', e)} />
        </>
      )}
    </div>
  );
}
