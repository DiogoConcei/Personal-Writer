import React from 'react';
import { useEditorStore } from '../store/editorStore';
import styles from './StatusBar.module.scss';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

export default function StatusBar() {
  const { wordCount, saveStatus, lastSavedAt } = useEditorStore();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <footer className={styles.status}>
      <div className={styles.status__left}>
        <span className={styles.status__item}>
          {wordCount} palavras
        </span>
      </div>

      <div className={styles.status__right}>
        <div className={styles.status__save}>
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={12} className={styles.spinning} />
              <span>Salvando...</span>
            </>
          )}
          
          {saveStatus === 'saved' && lastSavedAt && (
            <>
              <Cloud size={12} className={styles.icon__success} />
              <span>Salvo às {formatTime(lastSavedAt)}</span>
            </>
          )}

          {saveStatus === 'error' && (
            <>
              <CloudOff size={12} className={styles.icon__error} />
              <span>Erro ao salvar</span>
            </>
          )}

          {saveStatus === 'idle' && lastSavedAt && (
            <>
              <Cloud size={12} />
              <span>Pronto</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
