import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { ModalProps } from '@/shared/types';
import styles from './Modal.module.scss';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  showHeader = true,
  padding = true
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${styles[`modal--${size}`]}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <header className={styles.header}>
            <h2 className={styles.header__title}>{title}</h2>
            <button className={styles.header__close} onClick={onClose}>
              <X size={18} />
            </button>
          </header>
        )}
        
        <main className={`${styles.content} ${!padding ? styles['content--no-padding'] : ''}`}>
          {children}
        </main>
        
        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
