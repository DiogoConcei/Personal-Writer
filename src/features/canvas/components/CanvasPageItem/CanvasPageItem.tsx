import React from 'react';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasPageItemProps, PageData } from '@/shared/types';
import styles from './CanvasPageItem.module.scss';

/**
 * Componente de Página para o Infinite Canvas.
 * Serve como um container ou área de fundo para organizar outros itens.
 */
export function CanvasPageItem({
  entity,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onStart
}: CanvasPageItemProps) {
  const data = entity.data as PageData;

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 400,
    minHeight: 300,
    onSelect,
    onUpdate,
    onRemove,
    onStart
  });

  return (
    <div
      className={`${styles.page} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        left: entity.x,
        top: entity.y,
        width: entity.width || 800,
        height: entity.height || 600,
        zIndex: entity.zIndex || 1,
        transform: `rotate(${entity.rotation || 0}deg)`,
        fontSize: (entity.style?.fontSize as string) || '14px',
        color: (entity.style?.color as string) || 'var(--color-text-primary)',
        backgroundColor: (entity.style?.backgroundColor as string) || 'var(--color-bg-elevated)',
        ...entity.style,
        padding: 0,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className={styles.pageTitle}>{data.title || 'Página'}</h3>
      
      <div className={styles.pageContent} />

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
