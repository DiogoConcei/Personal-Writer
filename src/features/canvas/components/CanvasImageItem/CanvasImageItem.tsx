import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasImageItemProps, ImageData } from '@/shared/types';
import styles from './CanvasImageItem.module.scss';

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
      className={`${styles.canvasImage} ${isSelected ? styles.selected : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 300,
        transform: `rotate(${entity.rotation || 0}deg)`,
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <img src={resolveAssetPath(data.path, rootPath)} alt="" draggable={false} />

      {isSelected && (
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
