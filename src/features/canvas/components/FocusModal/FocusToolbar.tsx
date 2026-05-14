import React from 'react';
import { MousePointer2, Square, Scissors } from 'lucide-react';
import { FocusTool } from '@/shared/types';
import styles from './FocusModal.module.scss';

import { FocusToolbarProps } from '@/shared/types';

export const FocusToolbar: React.FC<FocusToolbarProps> = ({ activeTool, onToolChange }) => {
  return (
    <div className={styles.focusToolbar}>
      <button 
        className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`}
        onClick={() => onToolChange('select')}
        title="Selecionar (V)"
      >
        <MousePointer2 size={20} />
      </button>
      
      <button 
        className={`${styles.toolBtn} ${activeTool === 'square' ? styles.active : ''}`}
        onClick={() => onToolChange('square')}
        title="Área Quadrada (R)"
      >
        <Square size={20} />
      </button>

      <button 
        className={`${styles.toolBtn} ${activeTool === 'lasso' ? styles.active : ''}`}
        onClick={() => onToolChange('lasso')}
        title="Lasso / Tesoura (S)"
      >
        <Scissors size={20} />
      </button>
    </div>
  );
};
