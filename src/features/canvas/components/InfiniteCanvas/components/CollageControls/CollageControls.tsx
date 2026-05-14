import React from 'react';
import { Pencil, Eraser, Type, Image as ImageIcon } from 'lucide-react';
import styles from './CollageControls.module.scss';
import { CollageControlsProps } from '@/shared/types';

export const CollageControls: React.FC<CollageControlsProps> = ({
  activeTool,
  onActivatePencil,
  onActivateEraser,
  onActivateText,
  onOpenImageGallery,
  onFinalize,
  onCancel
}) => {
  return (
    <div className={styles.collageEditingControls}>
      <div className={styles.collageToolsGroup}>
        <button 
          className={`${styles.toolButton} ${activeTool === 'pencil' ? styles.active : ''}`} 
          title="Desenhar (Lápis)"
          onClick={onActivatePencil}
        >
          <Pencil size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'eraser' ? styles.active : ''}`} 
          title="Borracha"
          onClick={onActivateEraser}
        >
          <Eraser size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'text' ? styles.active : ''}`} 
          title="Adicionar Texto"
          onClick={onActivateText}
        >
          <Type size={18} />
        </button>

        <button 
          className={styles.toolButton} 
          title="Galeria de Imagens"
          onClick={onOpenImageGallery}
        >
          <ImageIcon size={18} />
        </button>
      </div>

      <div className={styles.collageActionsGroup}>
        <button 
          className={styles.confirmCollageButton}
          onClick={onFinalize}
        >
          Finalizar Colagem
        </button>
        <button 
          className={styles.cancelCollageButton}
          onClick={onCancel}
        >
          Cancelar Colagem
        </button>
      </div>
    </div>
  );
};
