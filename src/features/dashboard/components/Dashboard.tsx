import { useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import NoteCard from './NoteCard';
import styles from './Dashboard.module.scss';
import { LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const { files, dashboardFilterPath, rootPath, setDashboardFilterPath } = useWorkspaceStore();
  
  // Flatten files recursively to get all .md notes, filtered by path if needed
  const allNotes = useMemo(() => {
    const notes: any[] = [];
    const recurse = (nodeList: any[]) => {
      nodeList.forEach(node => {
        if (node.is_dir) {
          recurse(node.children || []);
        } else if (node.name.endsWith('.md')) {
          // Filtrar por dashboardFilterPath se existir
          if (!dashboardFilterPath || node.path.startsWith(dashboardFilterPath)) {
            notes.push(node);
          }
        }
      });
    };
    recurse(files);
    // Ordenar por data de modificação (mais recente primeiro)
    return notes.sort((a, b) => b.modified_at - a.modified_at);
  }, [files, dashboardFilterPath]);

  const getTitle = () => {
    if (!dashboardFilterPath || !rootPath) return 'Minhas Notas';
    const folderName = dashboardFilterPath.split(/[\\/]/).pop();
    return `Notas em: ${folderName}`;
  };

  if (allNotes.length === 0) {
    return (
      <div className={styles.empty}>
        <LayoutGrid size={48} />
        <p>Nenhuma nota encontrada {dashboardFilterPath ? 'nesta pasta' : 'no workspace'}.</p>
        {dashboardFilterPath && (
          <button className={styles.clearFilter} onClick={() => setDashboardFilterPath(null)}>
            Ver todas as notas
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__left}>
          <h2 className={styles.title}>{getTitle()} <span>({allNotes.length})</span></h2>
          {dashboardFilterPath && (
            <button className={styles.clearFilter} onClick={() => setDashboardFilterPath(null)}>
              Limpar Filtro
            </button>
          )}
        </div>
      </header>
      
      <div className={styles.grid}>
        {allNotes.map((note) => (
          <NoteCard key={note.path} note={note} />
        ))}
      </div>
    </div>
  );
}
