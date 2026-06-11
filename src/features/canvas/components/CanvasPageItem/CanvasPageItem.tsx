import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { useCanvasText } from '@/shared/hooks/useCanvasText';
import { CanvasPageItemProps, PageData } from '@/shared/types';
import styles from './CanvasPageItem.module.scss';

/**
 * Componente de Página para o Infinite Canvas.
 * Serve como um container ou área de fundo para organizar outros itens.
 * Agora com suporte a edição de texto direta.
 */
export function CanvasPageItem({
  entity,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onStart,
  onEnd
}: CanvasPageItemProps) {
  const data = entity.data as PageData;

  const {
    isEditing,
    text,
    editableRef,
    startEditing,
    stopEditing,
    handleKeyDown
  } = useCanvasText({
    initialText: data.title || '',
    onSave: (newText) => onUpdate(entity.id, { data: { ...data, title: newText } }),
    isEnabled: isSelected
  });

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 400,
    minHeight: 300,
    onSelect,
    onUpdate,
    onRemove,
    onStart,
    onEnd
  });

  const handleMouseDownCombined = (e: React.MouseEvent) => {
    // Se estiver editando, não deixa o arraste do canvas roubar o foco
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    handleMouseDown(e);
  };

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
        backgroundColor: (entity.style?.backgroundColor as string) || 'var(--color-bg-elevated)',
        ...entity.style,
        padding: 0,
      }}
      onMouseDown={handleMouseDownCombined}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      <div 
        ref={editableRef}
        className={styles.pageContent}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={stopEditing}
        onKeyDown={handleKeyDown}
        style={{ 
          padding: (entity.style?.padding as string) || '40px',
          fontSize: (entity.style?.fontSize as string) || '18px',
          color: (entity.style?.color as string) || 'var(--color-text-primary)',
          fontFamily: (entity.style?.fontFamily as string) || 'inherit',
          fontWeight: (entity.style?.fontWeight as string) || 'normal',
          textAlign: 'left',
          width: '100%',
          height: '100%',
          outline: 'none',
          overflowY: 'auto'
        }}
      >
        {!isEditing && !text ? (
          <span style={{ opacity: 0.3, pointerEvents: 'none' }}>Clique duas vezes para escrever...</span>
        ) : text}
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
