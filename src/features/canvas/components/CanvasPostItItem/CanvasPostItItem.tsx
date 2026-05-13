import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { useCanvasText } from '@/shared/hooks/useCanvasText';
import { CanvasPostItItemProps, PostItData } from '@/shared/types';
import styles from './CanvasPostItItem.module.scss';

/**
 * Componente de Post-it para o Infinite Canvas.
 * Segue o padrão de redimensionamento nos 4 cantos e edição inline.
 */
export function CanvasPostItItem({
  entity,
  isSelected,
  isScissorsActive,
  onSelect,
  onUpdate,
  onRemove,
  onStart,
  onEnd,
  onFocus
}: CanvasPostItItemProps) {
  const data = entity.data as PostItData;

  // Hook de Escrita Unificado
  const { 
    isEditing, 
    editableRef, 
    startEditing, 
    stopEditing, 
    handleKeyDown 
  } = useCanvasText({
    initialText: data.text || '',
    onSave: (newText) => onUpdate(entity.id, { data: { ...data, text: newText } }),
    isEnabled: true
  });

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
    minHeight: 100,
    onSelect: handleEntityInteraction,
    onUpdate,
    onRemove,
    onStart,
    onEnd
  });

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    handleMouseDown(e);
  };

  return (
    <div
      className={`${styles.postIt} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        left: entity.x,
        top: entity.y,
        width: entity.width,
        height: entity.height,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        transform: `rotate(${entity.rotation || 0}deg)`,
        backgroundColor: (entity.style?.backgroundColor as string) || '#fef3c7',
        color: (entity.style?.color as string) || '#92400e',
        fontSize: (entity.style?.fontSize as string) || '1.1rem',
        padding: (entity.style?.padding as string) || '20px',
        boxShadow: (entity.style?.boxShadow as string) || '2px 4px 12px rgba(0,0,0,0.1)',
        ...entity.style
      }}
      onMouseDown={handleContainerMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      <div
        ref={editableRef}
        className={styles.content}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={stopEditing}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => {
          if (isEditing) e.stopPropagation();
        }}
      >
        {data.text}
      </div>

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
