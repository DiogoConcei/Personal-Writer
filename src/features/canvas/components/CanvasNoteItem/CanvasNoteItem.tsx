import { useState, useEffect } from 'react';
import { readFile } from '@/tauri-bridge';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasNoteItemProps, NoteData } from '@/shared/types';
import styles from './CanvasNoteItem.module.scss';

/**
 * Componente interno para representar uma nota transformável no canvas
 */
export function CanvasNoteItem({ 
  entity, 
  isSelected, 
  onSelect, 
  onUpdate,
  onRemove 
}: CanvasNoteItemProps) {
  const data = entity.data as NoteData;
  const [content, setContent] = useState('Carregando...');
  
  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 200,
    onSelect,
    onUpdate,
    onRemove
  });

  useEffect(() => {
    readFile(data.noteId).then(text => {
      // Remove o frontmatter YAML para exibição no canvas
      const cleanText = text.replace(/^---\n[\s\S]*?\n---\n/, '').substring(0, 500);
      setContent(cleanText + (text.length > 500 ? '...' : ''));
    }).catch(err => {
      setContent('Erro ao carregar nota.');
      console.error(err);
    });
  }, [data.noteId]);

  return (
    <div 
      className={`${styles.canvasNote} ${isSelected ? styles.selected : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 420,
        height: entity.height || 594,
        transform: `rotate(${entity.rotation || 0}deg)`,
        fontSize: (entity.style?.fontSize as string) || '14px',
        padding: (entity.style?.padding as string) || '24px',
        color: (entity.style?.color as string) || 'var(--color-text-primary)',
        backgroundColor: (entity.style?.backgroundColor as string) || 'var(--color-bg-elevated)',
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className={styles.noteTitle}>{data.title}</h3>
      <div className={styles.noteContent}>{content}</div>

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
