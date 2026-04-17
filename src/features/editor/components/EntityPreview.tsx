import { Entity } from '@/features/universe/store/universeStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { User, MapPin, FileText } from 'lucide-react';
import styles from './EntityPreview.module.scss';

interface EntityPreviewProps {
  entity: Entity;
  position: { x: number; y: number };
}

export function EntityPreview({ entity, position }: EntityPreviewProps) {
  const { rootPath } = useWorkspaceStore();

  const getImageUrl = (icon?: string) => {
    if (!icon) return null;
    if (icon.includes('/') || icon.includes('\\') || icon.includes('.')) {
      if (icon.startsWith('./') && rootPath) {
        const relativePart = icon.replace('./', '');
        const separator = rootPath.includes('\\') ? '\\' : '/';
        const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
        return convertFileSrc(fullPath);
      }
      return icon;
    }
    return null;
  };

  const imageUrl = getImageUrl(entity.icon);
  const isEmoji = entity.icon && !imageUrl;

  return (
    <div 
      className={styles.preview} 
      style={{ 
        '--preview-y': `${position.y + 15}px`, 
        '--preview-x': `${position.x + 15}px` 
      } as React.CSSProperties}
    >
      <div className={styles.card}>
        <div className={styles.visual}>
          {imageUrl ? (
            <img src={imageUrl} alt={entity.name} />
          ) : (
            <div className={styles.placeholder}>
              {isEmoji ? <span>{entity.icon}</span> : <FileText size={32} />}
            </div>
          )}
        </div>
        
        <div className={styles.content}>
          <div className={styles.header}>
             {entity.type === 'character' && <User size={12} className={styles.typeIcon} />}
             {entity.type === 'location' && <MapPin size={12} className={styles.typeIcon} />}
             <span className={styles.type}>{entity.type === 'character' ? 'Personagem' : entity.type === 'location' ? 'Localização' : 'Nota'}</span>
          </div>
          <h3 className={styles.name}>{entity.name}</h3>
          <p className={styles.excerpt}>{entity.excerpt}</p>
          
          {entity.fields && Object.keys(entity.fields).length > 0 && (
            <div className={styles.fields}>
              {Object.entries(entity.fields)
                .filter(([k]) => k !== 'summary')
                .slice(0, 3)
                .map(([k, v]) => (
                  <div key={k} className={styles.field}>
                    <span className={styles.label}>{k}:</span>
                    <span className={styles.value}>{String(v)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
