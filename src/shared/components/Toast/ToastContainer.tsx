import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.scss';

export const ToastContainer: React.FC = () => {
  const { notifications } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
