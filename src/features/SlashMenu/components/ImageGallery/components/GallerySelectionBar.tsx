import { Folder } from 'lucide-react';
import styles from '../ImageGallery.module.scss';

interface GallerySelectionBarProps {
  count: number;
  onClear: () => void;
  onGroup: () => void;
}

export function GallerySelectionBar({ count, onClear, onGroup }: GallerySelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className={styles.selectionBar}>
      <span className={styles.selectionBar__text}>{count} itens selecionados</span>
      <div className={styles.selectionBar__actions}>
        <button className={styles.selectionBar__btn} onClick={onClear}>
          Limpar
        </button>
        <button 
          className={`${styles.selectionBar__btn} ${styles['selectionBar__btn--primary']}`} 
          onClick={onGroup}
        >
          <Folder size={16} /> Agrupar em Pasta
        </button>
      </div>
    </div>
  );
}
