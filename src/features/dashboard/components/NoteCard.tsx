import { FileText, Clock, User, MapPin } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { Entity } from '@/features/universe/store/universeStore';
import styles from './NoteCard.module.scss';

interface NoteCardProps {
  entity: Entity;
}

export default function NoteCard({ entity }: NoteCardProps) {
  const { setActiveFile, rootPath } = useWorkspaceStore();
  const { setActivePanel } = useUIStore();

  const handleOpen = () => {
    setActiveFile(entity.path);
    setActivePanel('editor');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  };

  const renderIcon = () => {
    // Fallback de Ícone:
    // 1. Se for localização e tiver imagens, usa a primeira
    // 2. Se tiver icon definido, usa ele (emoji ou caminho)
    // 3. Se tiver uma imagem no corpo do texto (previewImage)
    // 4. Fallback genérico por tipo
    
    let iconToRender = entity.icon;
    
    if (entity.type === 'location' && entity.images && entity.images.length > 0) {
      iconToRender = entity.images[0];
    }

    if (!iconToRender && entity.previewImage) {
      iconToRender = entity.previewImage;
    }

    if (!iconToRender) {
      if (entity.type === 'character') return <User size={24} className={styles.card__icon} />;
      if (entity.type === 'location') return <MapPin size={24} className={styles.card__icon} />;
      return <FileText size={24} className={styles.card__icon} />;
    }
    
    if (iconToRender.includes('/') || iconToRender.includes('\\') || iconToRender.includes('.')) {
      let iconSrc = iconToRender;
      if (iconSrc.startsWith('./') && rootPath) {
        const relativePart = iconSrc.replace('./', '');
        const separator = rootPath.includes('\\') ? '\\' : '/';
        const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
        iconSrc = convertFileSrc(fullPath);
      }
      return <img src={iconSrc} className={styles.card__imageIcon} alt="Preview" />;
    }

    return <span className={styles.card__emojiIcon}>{iconToRender}</span>;
  };

  return (
    <div className={`${styles.card} ${entity.type ? styles[`card--${entity.type}`] : ''}`} onClick={handleOpen}>
      <div className={styles.card__visual}>
        {renderIcon()}
      </div>

      <div className={styles.card__content}>
        <h3 className={styles.card__title}>{entity.name}</h3>
        
        {entity.fields && Object.keys(entity.fields).length > 0 && (
          <div className={styles.card__fields}>
            {Object.entries(entity.fields)
              .filter(([key]) => key !== 'summary')
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key} className={styles.field}>
                  <span className={styles.field__label}>{key}:</span>
                  <span className={styles.field__value}>{String(value)}</span>
                </div>
            ))}
          </div>
        )}

        <p className={styles.card__preview}>
          {entity.excerpt || 'Sem descrição...'}
        </p>
      </div>
      
      <div className={styles.card__footer}>
        <div className={styles.card__type}>
          {entity.type === 'character' && <User size={10} />}
          {entity.type === 'location' && <MapPin size={10} />}
          <span>
            {entity.type === 'character' ? 'Personagem' : 
             entity.type === 'location' ? 'Localização' : 
             entity.type === 'session' ? 'Sessão' : 'Nota'}
          </span>
        </div>
        <div className={styles.card__date}>
          <Clock size={10} />
          <span>{formatDate(entity.lastModified)}</span>
        </div>
      </div>
    </div>
  );
}

