import { RotateCw, RefreshCcw, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { CanvasActionMenuProps } from '@/shared/types';
import styles from './CanvasActionMenu.module.scss';

/**
 * Menu de ações que aparece acima do item selecionado
 */
export function CanvasActionMenu({ 
  entity, 
  onRemove, 
  onUpdate,
  onBringToFront,
  onSendToBack,
  handleRotateStart
}: CanvasActionMenuProps) {
  const width = entity.width || 200;
  const height = entity.height || 200;
  const rotation = entity.rotation || 0;

  return (
    <div 
      className={styles.actionMenu}
      style={{
        left: entity.x + width / 2,
        top: entity.y - 15, // Pequeno gap fixo acima da nota
        zIndex: 1000,
        transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
        // A origem da rotação deve ser o centro da entidade.
        transformOrigin: `50% ${height / 2 + 55}px`
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button 
        className={styles.actionButton} 
        onMouseDown={handleRotateStart}
        title="Girar Item"
      >
        <RotateCw size={14} />
      </button>
      
      <button 
        className={styles.actionButton} 
        onClick={() => onUpdate(entity.id, { rotation: 0 })}
        title="Resetar Rotação"
      >
        <RefreshCcw size={14} />
      </button>

      <div className={styles.actionSeparator} />

      <button 
        className={styles.actionButton} 
        onClick={() => onBringToFront(entity.id)}
        title="Trazer para Frente"
      >
        <ChevronUp size={16} />
      </button>

      <button 
        className={styles.actionButton} 
        onClick={() => onSendToBack(entity.id)}
        title="Trazer para Trás"
      >
        <ChevronDown size={16} />
      </button>

      <div className={styles.actionSeparator} />

      <button 
        className={`${styles.actionButton} ${styles.delete}`} 
        onClick={() => onRemove(entity.id)}
        title="Deletar Item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
