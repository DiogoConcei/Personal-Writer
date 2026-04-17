import styles from './MetadataPreview.module.scss';
import { Metadata } from '@/features/editor/store/metadataParser';
import { convertFileSrc } from '@tauri-apps/api/core';
import { User, ChevronRight, Info } from 'lucide-react';

interface MetadataPreviewProps {
  metadata: Metadata;
  rootPath: string | null;
  noteName: string;
}

export function MetadataPreview({ metadata, rootPath, noteName }: MetadataPreviewProps) {
  const renderVisualIcon = () => {
    const icon = metadata.icon;
    if (!icon) return <div className={styles.placeholderIcon}><User size={64} strokeWidth={1} /></div>;

    const isPath = icon.includes('/') || icon.includes('\\') || icon.includes('.');
    if (isPath && rootPath) {
      const relativePart = icon.replace('./', '');
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
      return <img src={convertFileSrc(fullPath)} className={styles.imageIcon} alt="Portrait" />;
    }
    return <span className={styles.emojiIcon}>{icon}</span>;
  };

  const getTypeLabel = () => {
    switch (metadata.type) {
      case 'character': return 'Personagem';
      case 'location': return 'Localização';
      case 'session': return 'Sessão';
      default: return 'Documento';
    }
  };

  if (!metadata.type && !metadata.fields) return null;

  return (
    <div className={styles.profile}>
      <div className={styles.hero}>
        <div className={styles.portraitWrapper}>
          {renderVisualIcon()}
        </div>

        <div className={styles.mainInfo}>
          <div className={styles.badgeRow}>
            <span className={styles.typeTag}>
              {metadata.type === 'character' && <User size={12} />}
              {getTypeLabel()}
            </span>
            <ChevronRight size={14} className={styles.separator} />
            <span className={styles.statusTag}>Ativo</span>
          </div>
          <h1 className={styles.name}>{noteName}</h1>
          {metadata.fields?.summary && (
            <div 
              className={styles.summary} 
              dangerouslySetInnerHTML={{ __html: metadata.fields.summary }}
            />
          )}
        </div>
      </div>

      {metadata.fields && Object.keys(metadata.fields).filter(k => k !== 'summary').length > 0 && (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <Info size={16} />
            <h2>Informações e Atributos</h2>
          </div>

          <div className={styles.grid}>
            {Object.entries(metadata.fields)
              .filter(([key]) => key !== 'summary')
              .map(([key, value]) => (
                <div key={key} className={styles.field}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.label}>{key}</span>
                  </div>
                  <div className={styles.inputArea}>
                    <div className={styles.value}>
                      {String(value)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
