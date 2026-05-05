import { Wallpaper, RotateCw, ZoomOut, Plus, Grid3X3, Circle } from 'lucide-react';
import styles from './MesaLeftToolbar.module.scss';

interface MesaLeftToolbarProps {
  backgroundImage: string | null;
  backgroundPattern: 'dots' | 'grid' | 'cork';
  onOpenBackgroundGallery: () => void;
  onRotateBackground: () => void;
  onZoomBackground: () => void;
  onRemoveBackground: () => void;
  onSetBackgroundPattern: (pattern: 'dots' | 'grid' | 'cork') => void;
}

export function MesaLeftToolbar({
  backgroundImage,
  backgroundPattern,
  onOpenBackgroundGallery,
  onRotateBackground,
  onZoomBackground,
  onRemoveBackground,
  onSetBackgroundPattern
}: MesaLeftToolbarProps) {
  return (
    <div className={styles.leftToolbar}>
      <div className={styles.section}>
        <button 
          className={`${styles.toolbarBtn} ${backgroundPattern === 'grid' ? styles.active : ''}`} 
          title="Fundo: Quadrados" 
          onClick={() => onSetBackgroundPattern('grid')}
        >
          <Grid3X3 size={18} />
        </button>
        <button 
          className={`${styles.toolbarBtn} ${backgroundPattern === 'dots' ? styles.active : ''}`} 
          title="Fundo: Pontilhados" 
          onClick={() => onSetBackgroundPattern('dots')}
        >
          <Circle size={10} fill={backgroundPattern === 'dots' ? 'currentColor' : 'transparent'} />
        </button>
        <button 
          className={`${styles.toolbarBtn} ${backgroundPattern === 'cork' ? styles.active : ''}`} 
          title="Fundo: Cortiça (Quadro de Detetive)" 
          onClick={() => onSetBackgroundPattern('cork')}
        >
          <div className={styles.corkIcon} />
        </button>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.bgControls}>
        <button 
          className={`${styles.toolbarBtn} ${backgroundImage ? styles.active : ''}`} 
          title="Imagem de Fundo" 
          onClick={onOpenBackgroundGallery}
        >
          <Wallpaper size={18} />
        </button>
        
        {backgroundImage && (
          <div className={styles.bgActionsVertical}>
            <button 
              className={styles.bgActionBtn} 
              title="Rotacionar Fundo"
              onClick={onRotateBackground}
            >
              <RotateCw size={14} />
            </button>
            <button 
              className={styles.bgActionBtn} 
              title="Zoom do Fundo"
              onClick={onZoomBackground}
            >
              <ZoomOut size={14} />
            </button>
            <button 
              className={styles.removeBgBtn} 
              title="Remover Fundo"
              onClick={onRemoveBackground}
            >
              <Plus size={12} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
