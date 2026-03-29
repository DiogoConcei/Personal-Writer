import React from 'react';
import Modal from '@/shared/components/Modal/Modal';
import styles from './DeleteModal.module.scss';
import { AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isDir: boolean;
}

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName,
  isDir 
}: DeleteModalProps) {
  
  const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(itemName);

  const footer = (
    <>
      <button className={styles.btnCancel} onClick={onClose}>
        Cancelar
      </button>
      <button className={styles.btnConfirm} onClick={() => {
        onConfirm();
        onClose();
      }}>
        Excluir permanentemente
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Exclusão"
      footer={footer}
      size="sm"
    >
      <div className={styles.body}>
        <div className={styles.body__icon}>
          <AlertTriangle size={24} />
        </div>
        <div className={styles.body__text}>
          <p>Você tem certeza que deseja excluir <strong>{itemName}</strong>?</p>
          
          {isImage && (
            <p className={styles.imageWarning}>
              <strong>Atenção:</strong> Excluir uma imagem física pode quebrar referências em versões antigas do histórico (snapshots).
            </p>
          )}

          <p className={styles.warning}>
            {isDir 
              ? 'Esta ação excluirá a pasta e todo o seu conteúdo. Esta operação não pode ser desfeita.' 
              : 'Esta ação não pode ser desfeita.'
            }
          </p>
        </div>
      </div>
    </Modal>
  );
}
