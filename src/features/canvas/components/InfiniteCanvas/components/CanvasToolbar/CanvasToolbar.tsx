import React from 'react';
import {
  MousePointer2,
  Hand,
  Pencil,
  Eraser,
  Scissors,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import styles from './CanvasToolbar.module.scss';
import { CanvasToolbarProps } from '@/shared/types';

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({

  activeTool,
  onActivateSelect,
  onActivatePan,
  onActivatePencil,
  onActivateEraser,
  onActivateText,
  onToggleScissors,
  onZoomIn,
  onZoomOut,
  onResetView
}) => {
  return (
    <div className={styles.toolbar}>
      <button 
        className={`${styles.toolButton} ${activeTool === 'select' ? styles.active : ''}`} 
        title="Selecionar"
        onClick={onActivateSelect}
      >
        <MousePointer2 size={18} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'pan' ? styles.active : ''}`} 
        title="Mover Tela (H)"
        onClick={onActivatePan}
      >
        <Hand size={18} />
      </button>

      <div className={styles.separator} />

      <button 
        className={`${styles.toolButton} ${activeTool === 'pencil' ? styles.active : ''}`} 
        title="Desenhar (Lápis)"
        onClick={onActivatePencil}
      >
        <Pencil size={18} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'eraser' ? styles.active : ''}`} 
        title="Borracha (Excluir Desenho)"
        onClick={onActivateEraser}
      >
        <Eraser size={18} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'scissors' ? styles.active : ''}`} 
        onClick={onToggleScissors}
        title="Tesoura (Focar Entidade)"
      >
        <Scissors size={18} />
      </button>

      <button 
        className={`${styles.toolButton} ${activeTool === 'text' ? styles.active : ''}`} 
        title="Adicionar Texto"
        onClick={onActivateText}
      >
        <Type size={18} />
      </button>

      <div className={styles.separator} />

      <button
        className={styles.toolButton}
        onClick={onZoomIn}
        title="Aumentar Zoom"
      >
        <ZoomIn size={18} />
      </button>
      
      <button
        className={styles.toolButton}
        onClick={onZoomOut}
        title="Diminuir Zoom"
      >
        <ZoomOut size={18} />
      </button>

      <button
        className={styles.toolButton}
        onClick={onResetView}
        title="Resetar Visualização"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
};
