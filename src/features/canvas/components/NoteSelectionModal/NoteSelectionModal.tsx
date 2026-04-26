import { FileText, X } from 'lucide-react';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { NoteSelectionModalProps } from '@/shared/types';
import styles from './NoteSelectionModal.module.scss';

/**
 * Modal simples para seleção de notas do Universo
 */
export function NoteSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect 
}: NoteSelectionModalProps) {
  const { entities } = useUniverseStore();
  const notes = Object.values(entities).filter(e => !e.type || e.type === 'note' || e.type === 'character' || e.type === 'location');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.noteModal} onClick={e => e.stopPropagation()}>
        <div className={styles.noteModal__header}>
          <h3>Selecione uma Nota</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.noteModal__list}>
          {notes.map(note => (
            <button 
              key={note.path} 
              className={styles.noteModal__item}
              onClick={() => onSelect(note.path, note.name)}
            >
              <FileText size={16} />
              <span>{note.name}</span>
            </button>
          ))}
          {notes.length === 0 && (
            <p className={styles.noteModal__empty}>Nenhuma nota encontrada no projeto.</p>
          )}
        </div>
      </div>
    </div>
  );
}
