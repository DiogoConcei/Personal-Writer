import React, { useState, useEffect } from 'react';
import { FileNode, readFile } from '@/tauri-bridge';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import styles from './NoteCard.module.scss';
import { FileText, Clock } from 'lucide-react';

interface NoteCardProps {
  note: FileNode;
}

export default function NoteCard({ note }: NoteCardProps) {
  const [preview, setPreview] = useState('');
  const { setActiveFile } = useWorkspaceStore();
  const { setActivePanel } = useUIStore();

  useEffect(() => {
    readFile(note.path).then(content => {
      // Remove tags HTML/Markdown para o preview
      const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*`[\]]/g, '');
      setPreview(plainText.substring(0, 150) + (plainText.length > 150 ? '...' : ''));
    });
  }, [note.path]);

  const handleOpen = () => {
    setActiveFile(note.path);
    setActivePanel('editor');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  };

  return (
    <div className={styles.card} onClick={handleOpen}>
      <div className={styles.card__header}>
        <FileText size={16} className={styles.card__icon} />
        <h3 className={styles.card__title}>{note.name.replace(/\.txt$/, '')}</h3>
      </div>
      
      <p className={styles.card__preview}>
        {preview || 'Sem conteúdo...'}
      </p>
      
      <div className={styles.card__footer}>
        <Clock size={12} />
        <span>{formatDate(note.modified_at)}</span>
      </div>
    </div>
  );
}
