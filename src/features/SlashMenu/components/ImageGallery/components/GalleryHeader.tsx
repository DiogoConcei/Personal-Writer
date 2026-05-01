import { ChevronRight, CheckSquare, Plus, RefreshCw, Upload, X } from 'lucide-react';
import { GalleryBreadcrumb, GalleryNavTarget } from '@/shared/types';
import styles from '../ImageGallery.module.scss';

interface GalleryHeaderProps {
  breadcrumbs: GalleryBreadcrumb[];
  activeTarget: GalleryNavTarget;
  isSelectionMode: boolean;
  isScanning: boolean;
  isProcessing: boolean;
  disableOrganization: boolean;
  onTargetClick: (target: GalleryNavTarget, callback?: () => void) => void;
  onToggleSelectionMode: () => void;
  onOpenInputModal: () => void;
  onRefresh: () => void;
  onUpload: () => void;
  onClose: () => void;
}

export function GalleryHeader({
  breadcrumbs,
  activeTarget,
  isSelectionMode,
  isScanning,
  isProcessing,
  disableOrganization,
  onTargetClick,
  onToggleSelectionMode,
  onOpenInputModal,
  onRefresh,
  onUpload,
  onClose,
}: GalleryHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.header__left}>
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className={styles.breadcrumbItem}>
              {i > 0 && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
              <button 
                className={`${styles.breadcrumbBtn} ${crumb.target === activeTarget ? styles['breadcrumbBtn--active'] : ''}`} 
                onClick={() => onTargetClick(crumb.target, () => {
                  if (isSelectionMode) onToggleSelectionMode();
                })}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.header__actions}>
        {!disableOrganization && (
          <>
            <button 
              className={styles.folderBtn} 
              style={{ color: isSelectionMode ? 'var(--color-accent)' : 'inherit' }}
              onClick={onToggleSelectionMode}
              title={isSelectionMode ? "Finalizar Organização" : "Organizar em Massa"}
            >
              <CheckSquare size={16} />
            </button>
            <button 
              className={styles.folderBtn}
              onClick={onOpenInputModal}
              title="Nova Pasta Virtual"
            >
              <Plus size={16} />
            </button>
          </>
        )}
        <button className={styles.refreshBtn} onClick={onRefresh} disabled={isScanning} title="Atualizar galeria">
          <RefreshCw size={16} className={isScanning ? styles.spin : ''} />
        </button>
        <button className={styles.uploadBtn} onClick={onUpload} disabled={isProcessing}>
          <Upload size={16} />
          <span>{isProcessing ? 'Enviando...' : 'Upload'}</span>
        </button>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </header>
  );
}
