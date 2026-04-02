import { useMemo } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUniverseStore, Entity } from '@/features/universe/store/universeStore';
import NoteCard from './NoteCard';
import styles from './Dashboard.module.scss';
import { LayoutGrid, User, MapPin, FileText } from 'lucide-react';

export default function Dashboard() {
  const { dashboardFilterPath, rootPath, setDashboardFilterPath } = useWorkspaceStore();
  const { entities, isIndexing } = useUniverseStore();
  
  // Filtrar e categorizar notas usando o índice em memória
  const categorized = useMemo(() => {
    const chars: Entity[] = [];
    const locs: Entity[] = [];
    const rest: Entity[] = [];

    Object.values(entities).forEach((entity) => {
      // Aplicar filtro de pasta se existir
      if (dashboardFilterPath && !entity.path.startsWith(dashboardFilterPath)) {
        return;
      }

      if (entity.type === 'character') chars.push(entity);
      else if (entity.type === 'location') locs.push(entity);
      else rest.push(entity);
    });

    const sortByDate = (a: Entity, b: Entity) => b.lastModified - a.lastModified;

    return {
      characters: chars.sort(sortByDate),
      locations: locs.sort(sortByDate),
      others: rest.sort(sortByDate),
      total: chars.length + locs.length + rest.length
    };
  }, [entities, dashboardFilterPath]);

  const getTitle = () => {
    if (!dashboardFilterPath || !rootPath) return 'Dashboard';
    const folderName = dashboardFilterPath.split(/[\\/]/).pop();
    return `Pasta: ${folderName}`;
  };

  if (categorized.total === 0 && !isIndexing) {
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

  const renderSection = (title: string, icon: any, notes: Entity[]) => {
    if (notes.length === 0) return null;
    return (
      <section className={styles.section}>
        <div className={styles.section__header}>
          {icon}
          <h3 className={styles.section__title}>{title} <span>({notes.length})</span></h3>
        </div>
        <div className={styles.grid}>
          {notes.map((entity) => (
            <NoteCard key={entity.path} entity={entity} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__left}>
          <h2 className={styles.title}>{getTitle()}</h2>
          {dashboardFilterPath && (
            <button className={styles.clearFilter} onClick={() => setDashboardFilterPath(null)}>
              Limpar Filtro
            </button>
          )}
        </div>
        {isIndexing && <div className={styles.indexingBadge}>Indexando universo...</div>}
      </header>
      
      <div className={styles.content}>
        {renderSection('Personagens', <User size={20} color="#a78bfa" />, categorized.characters)}
        {renderSection('Localização', <MapPin size={20} color="#fbbf24" />, categorized.locations)}
        {renderSection('Notas Gerais', <FileText size={20} color="#94a3b8" />, categorized.others)}
      </div>
    </div>
  );
}

