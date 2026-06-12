import Modal from '../Modal/Modal';
import { HelpCircle } from 'lucide-react';
import { ConfirmModalProps } from '@/shared/types';
import styles from './ConfirmModal.module.scss';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary'
}: ConfirmModalProps) {
  
  const footer = (
    <>
      <button className={styles.btnCancel} onClick={onClose}>
        {cancelLabel}
      </button>
      <button 
        className={`${styles.btnConfirm} ${styles[`btnConfirm--${variant}`]}`} 
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
    >
      <div className={styles.body}>
        <div className={`${styles.body__icon} ${styles[`body__icon--${variant}`]}`}>
          <HelpCircle size={24} />
        </div>
        <div className={styles.body__text}>
          <p>{message}</p>
        </div>
      </div>
    </Modal>
  );
}
