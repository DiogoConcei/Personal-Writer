import { useUniverseStore } from '@/features/universe/store/universeStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { Link as LinkIcon, FileText, User, MapPin } from 'lucide-react';
import styles from './Backlinks.module.scss';

interface BacklinksProps {
  targetPath: string;
}

export function Backlinks({ targetPath }: BacklinksProps) {
  const { getBacklinks } = useUniverseStore();
  const { setActiveFile } = useWorkspaceStore();
  const { setActivePanel } = useUIStore();
  
  const mentions = getBacklinks(targetPath);

  if (mentions.length === 0) return null;

  const handleNavigate = (path: string) => {
    setActiveFile(path);
    setActivePanel('editor');
  };

  return (
    <div className={styles.backlinks}>
      <div className={styles.header}>
        <LinkIcon size={14} />
        <h3>Mencionado em... <span>({mentions.length})</span></h3>
      </div>
      
      <div className={styles.list}>
        {mentions.map(entity => (
          <div 
            key={entity.path} 
            className={styles.item}
            onClick={() => handleNavigate(entity.path)}
          >
            <div className={styles.icon}>
              {entity.type === 'character' && <User size={14} />}
              {entity.type === 'location' && <MapPin size={14} />}
              {!entity.type && <FileText size={14} />}
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{entity.name}</span>
              <p className={styles.excerpt}>{entity.excerpt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
