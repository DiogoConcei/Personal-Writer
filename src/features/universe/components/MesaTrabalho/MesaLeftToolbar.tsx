import { Wallpaper, RotateCw, ZoomOut, Maximize2, Minimize2, Plus, Grid3X3, Circle } from 'lucide-react';
import styles from './MesaLeftToolbar.module.scss';

interface MesaLeftToolbarProps {
  backgroundImage: string | null;
  backgroundPattern: 'dots' | 'grid' | 'cork';
  backgroundZoom?: number;
  onOpenBackgroundGallery: () => void;
  onRotateBackground: () => void;
  onZoomBackground: () => void;
  onRemoveBackground: () => void;
  onSetBackgroundPattern: (pattern: 'dots' | 'grid' | 'cork') => void;
}

export function MesaLeftToolbar({
  backgroundImage,
  backgroundPattern,
  backgroundZoom = 1,
  onOpenBackgroundGallery,
  onRotateBackground,
  onZoomBackground,
  onRemoveBackground,
  onSetBackgroundPattern
}: MesaLeftToolbarProps) {
  const getZoomIcon = () => {
    if (backgroundZoom === 1) return <Maximize2 size={14} />;
    if (backgroundZoom === 0) return <Minimize2 size={14} />;
    return <ZoomOut size={14} />;
  };

  const getZoomTitle = () => {
    if (backgroundZoom === 1) return "Ajuste: Preencher (Cover)";
    if (backgroundZoom === 0) return "Ajuste: Caber (Contain)";
    return `Zoom do Fundo: ${Math.round(backgroundZoom * 100)}%`;
  };

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
              title={getZoomTitle()}
              onClick={onZoomBackground}
            >
              {getZoomIcon()}
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
