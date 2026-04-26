import { useState } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import styles from './StatusBar.module.scss';
import { Cloud, CloudOff, Loader2, Target, Zap } from 'lucide-react';
import InputModal from '@/shared/components/Modal/InputModal';

export default function StatusBar() {
  const { 
    wordCount, 
    wordGoal, 
    setWordGoal, 
    sessionGoal, 
    setSessionGoal, 
    sessionStartWordCount,
    saveStatus, 
    lastSavedAt 
  } = useEditorStore();

  const [isWordGoalModalOpen, setIsWordGoalModalOpen] = useState(false);
  const [isSessionGoalModalOpen, setIsSessionGoalModalOpen] = useState(false);

  const sessionWordCount = Math.max(0, wordCount - sessionStartWordCount);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSetWordGoal = (value: string) => {
    setWordGoal(parseInt(value) || 0);
  };

  const handleSetSessionGoal = (value: string) => {
    setSessionGoal(parseInt(value) || 0);
  };

  const renderGoal = (current: number, goal: number, icon: React.ReactNode, label: string, onClick: () => void) => {
    if (goal <= 0) {
      return (
        <div className={styles.status__item} onClick={onClick} title={`Definir meta de ${label}`}>
          {icon}
          <span>{current}</span>
        </div>
      );
    }

    const percentage = Math.min(100, (current / goal) * 100);
    const isComplete = percentage >= 100;

    return (
      <div className={styles.status__item} onClick={onClick} title={`${current} / ${goal} palavras (${label})`}>
        <div className={styles.status__goalContainer}>
          <div className={styles.status__goalHeader}>
            <span className={styles.status__goalInfo}>
              {icon}
              {current} / {goal}
            </span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className={styles.status__progressBar}>
            <div 
              className={`${styles.status__progressFill} ${isComplete ? styles['status__progressFill--complete'] : ''}`}
              style={{ '--percentage': `${percentage}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <footer className={styles.status}>
        <div className={styles.status__left}>
          {renderGoal(wordCount, wordGoal, <Target size={12} />, 'Arquivo', () => setIsWordGoalModalOpen(true))}
          <span className={styles.status__separator}>|</span>
          {renderGoal(sessionWordCount, sessionGoal, <Zap size={12} />, 'Sessão', () => setIsSessionGoalModalOpen(true))}
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

      <InputModal
        isOpen={isWordGoalModalOpen}
        onClose={() => setIsWordGoalModalOpen(false)}
        onConfirm={handleSetWordGoal}
        title="Meta de Palavras (Arquivo)"
        placeholder="Ex: 1000"
        defaultValue={wordGoal > 0 ? wordGoal.toString() : ''}
        confirmLabel="Definir Meta"
      />

      <InputModal
        isOpen={isSessionGoalModalOpen}
        onClose={() => setIsSessionGoalModalOpen(false)}
        onConfirm={handleSetSessionGoal}
        title="Meta de Palavras (Sessão)"
        placeholder="Ex: 500"
        defaultValue={sessionGoal > 0 ? sessionGoal.toString() : ''}
        confirmLabel="Definir Meta"
      />
    </>
  );
}
