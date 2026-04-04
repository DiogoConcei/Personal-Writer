import React from 'react';
import { useUIStore, ToastNotification } from '@/store/uiStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.scss';

interface ToastProps {
  notification: ToastNotification;
}

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
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 'auto', display: 'flex', opacity: 0.6 }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
