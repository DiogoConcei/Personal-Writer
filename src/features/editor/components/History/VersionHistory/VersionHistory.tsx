import styles from './VersionHistory.module.scss';

export default function VersionHistory({ onClose }: { editor: any, onClose: () => void }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>Histórico de Versões</h2>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </header>
        <div className={styles.content}>
          <p className={styles.info}>Esta funcionalidade está em desenvolvimento.</p>
        </div>
      </div>
    </div>
  );
}
