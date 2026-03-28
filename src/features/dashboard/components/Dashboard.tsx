import React, { useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import NoteCard from './NoteCard';
import styles from './Dashboard.module.scss';
import { LayoutGrid, Search } from 'lucide-react';

export default function Dashboard() {
  const { files } = useWorkspaceStore();
  
  // Flatten files recursively to get all .txt notes
  const allNotes = useMemo(() => {
    const notes: any[] = [];
    const recurse = (nodeList: any[]) => {
      nodeList.forEach(node => {
        if (node.is_dir) {
          recurse(node.children || []);
        } else if (node.name.endsWith('.md')) {
          notes.push(node);
        }
      });
    };
    recurse(files);
    // Ordenar por data de modificação (mais recente primeiro)
    return notes.sort((a, b) => b.modified_at - a.modified_at);
  }, [files]);

  if (allNotes.length === 0) {
    return (
      <div className={styles.empty}>
        <LayoutGrid size={48} />
        <p>Nenhuma nota encontrada no workspace.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Minhas Notas <span>({allNotes.length})</span></h2>
      </header>
      
      <div className={styles.grid}>
        {allNotes.map((note) => (
          <NoteCard key={note.path} note={note} />
        ))}
      </div>
    </div>
  );
}
