import React from 'react';
import styles from './FocusModal.module.scss';
import { X } from 'lucide-react';
import { AnyCanvasEntity } from '@/shared/types';
import { CanvasNoteItem } from '../CanvasNoteItem/CanvasNoteItem';
import { CanvasPdfItem } from '../CanvasPdfItem/CanvasPdfItem';
import { CanvasImageItem } from '../CanvasImageItem/CanvasImageItem';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: AnyCanvasEntity | null;
  rootPath: string | null;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  entity,
  rootPath
}) => {
  if (!isOpen || !entity) return null;

  const renderFocusedEntity = () => {
    // Criamos uma versão da entidade para o foco com dimensões maiores e posição 0,0
    const focusedEntity: AnyCanvasEntity = {
      ...entity,
      x: 0,
      y: 0,
      rotation: 0,
      width: 800, // Largura maior para o foco
      height: 1000, // Altura maior para o foco
      zIndex: 10,
    };

    const commonProps = {
      entity: focusedEntity,
      isSelected: false,
      isSepararActive: false,
      isScissorsActive: false,
      onSelect: () => {},
      onUpdate: () => {},
      onRemove: () => {},
      onFocus: () => {},
    };

    switch (entity.type) {
      case 'note':
        return <CanvasNoteItem {...commonProps} onSplit={() => {}} />;
      case 'pdf':
        return <CanvasPdfItem {...commonProps} onSplit={() => {}} rootPath={rootPath} />;
      case 'image':
        return <CanvasImageItem {...commonProps} rootPath={rootPath} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        <div className={styles.content}>
          {renderFocusedEntity()}
        </div>
      </div>
    </div>
  );
};
