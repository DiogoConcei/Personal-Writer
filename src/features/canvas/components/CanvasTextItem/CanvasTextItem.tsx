import React from 'react';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { useCanvasText } from '@/shared/hooks/useCanvasText';
import { TextData, CanvasTextItemProps } from '@/shared/types';
import styles from './CanvasTextItem.module.scss';

/**
 * Componente para representar blocos de texto editáveis no Infinite Canvas.
 * Mirroring the behavior of text items from MesaTrabalho.
 */
export function CanvasTextItem({
  entity,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onStart,
  onEnd
}: CanvasTextItemProps) {
  const data = entity.data as TextData;

  // Hook de Escrita Unificado
  const { 
    isEditing, 
    editableRef, 
    startEditing, 
    stopEditing, 
    handleKeyDown: handleTextKeyDown 
  } = useCanvasText({
    initialText: data.text || '',
    onSave: (newText) => {
      onStart?.();
      onUpdate(entity.id, { data: { ...data, text: newText } });
    },
    isEnabled: isSelected
  });

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    onSelect,
    onUpdate,
    onRemove,
    onStart,
    onEnd,
    minWidth: 50,
    minHeight: 30
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
      className={`${styles.canvasText} ${isSelected ? styles.selected : ''}`}
      style={{
        left: entity.x,
        top: entity.y,
        width: entity.width,
        height: entity.height,
        transform: `rotate(${entity.rotation || 0}deg)`,
        zIndex: entity.zIndex || 5,
        ...entity.style
      }}
      onMouseDown={handleContainerMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={editableRef}
        className={styles.textContent}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={stopEditing}
        onKeyDown={handleTextKeyDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
        onMouseDown={(e) => {
          if (isEditing) e.stopPropagation();
        }}
        onClick={(e) => {
          if (isEditing) e.stopPropagation();
        }}
      >
        {data.text}
      </div>

      {isSelected && (
        <>
          <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => handleResizeStart('tl', e)} onClick={(e) => e.stopPropagation()} />
          <div className={`${styles.handle} ${styles['handle--tr']}`} onMouseDown={(e) => handleResizeStart('tr', e)} onClick={(e) => e.stopPropagation()} />
          <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => handleResizeStart('bl', e)} onClick={(e) => e.stopPropagation()} />
          <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => handleResizeStart('br', e)} onClick={(e) => e.stopPropagation()} />
        </>
      )}
    </div>
  );
}
