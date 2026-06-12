import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { InputModalProps } from '@/shared/types';
import styles from './InputModal.module.scss';

export default function InputModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = 'Digite aqui...',
  defaultValue = '',
  confirmLabel = 'Confirmar'
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form className={styles.container} onSubmit={handleSubmit}>
        <input
          autoFocus
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.confirmBtn} disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
