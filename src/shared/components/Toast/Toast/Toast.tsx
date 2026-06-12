import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { ToastProps } from '@/shared/types';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.scss';

export const Toast: React.FC<ToastProps> = ({ notification }) => {
  const { removeNotification } = useUIStore();

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <AlertCircle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[`toast--${notification.type}`]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{notification.message}</span>
      <button 
        className={styles.closeBtn} 
        onClick={() => removeNotification(notification.id)}
      >
        <X size={14} />
      </button>
    </div>
  );
};
