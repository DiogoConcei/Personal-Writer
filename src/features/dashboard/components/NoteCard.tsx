import { useState, useEffect } from 'react';
import { FileNode, readFile } from '@/tauri-bridge';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import styles from './NoteCard.module.scss';
import { FileText, Clock, User, MapPin } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface NoteCardProps {
  note: FileNode;
}

interface NoteMetadata {
  type?: string;
  icon?: string;
  fields?: Record<string, any>;
}

export default function NoteCard({ note }: NoteCardProps) {
  const [preview, setPreview] = useState('');
  const [metadata, setMetadata] = useState<NoteMetadata | null>(null);
  const { setActiveFile, rootPath } = useWorkspaceStore();
  const { setActivePanel } = useUIStore();

  useEffect(() => {
    readFile(note.path).then(content => {
      let yamlStr = '';
      let cleanContent = content;

      // 1. Tentar extrair do formato HTML (data-content)
      const htmlYamlMatch = content.match(/data-content="([\s\S]*?)"/);
      if (htmlYamlMatch) {
        // O conteúdo dentro do atributo HTML está escapado (ex: &quot;)
        // mas para o nosso parser simples de regex, as aspas internas e quebras de linha costumam vir brutas ou como \n
        yamlStr = htmlYamlMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        cleanContent = content.replace(/<div data-type="metadata-header"[\s\S]*?<\/div>/, '');
      } else {
        // 2. Tentar extrair do formato Markdown puro
        const mdYamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (mdYamlMatch) {
          yamlStr = mdYamlMatch[1];
          cleanContent = content.replace(mdYamlMatch[0], '');
        }
      }
      
      if (yamlStr) {
        const meta: NoteMetadata = {};
        
        // Parser robusto de YAML para tipo e ícone
        const typeMatch = yamlStr.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
        const iconMatch = yamlStr.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);
        
        if (typeMatch) meta.type = typeMatch[1].trim();
        if (iconMatch) meta.icon = iconMatch[1].trim();
        
        // Extração de fields (pega os primeiros 3 para o card)
        const fieldsMatch = yamlStr.match(/fields:\r?\n([\s\S]*?)(?=\r?\n[a-z]|$)/i);
        if (fieldsMatch) {
          const fields: Record<string, string> = {};
          const lines = fieldsMatch[1].split('\n');
          lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
              const k = parts[0].trim();
              const v = parts.slice(1).join(':').trim().replace(/["']/g, '');
              if (k) fields[k] = v;
            }
          });
          meta.fields = fields;
        }
        
        setMetadata(meta);
      }

      // 2. Gerar Preview de texto (remove tags HTML e caracteres MD)
      const plainText = cleanContent
        .replace(/<[^>]*>/g, ' ') // Substitui tags HTML por espaço
        .replace(/[#*`[\]]/g, '')
        .trim();
      setPreview(plainText.substring(0, 100) + (plainText.length > 100 ? '...' : ''));
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

  const renderIcon = () => {
    if (!metadata?.icon) return <FileText size={24} className={styles.card__icon} />;
    
    if (metadata.icon.includes('/') || metadata.icon.includes('\\') || metadata.icon.includes('.')) {
      let iconSrc = metadata.icon;
      if (iconSrc.startsWith('./') && rootPath) {
        const relativePart = iconSrc.replace('./', '');
        const fullPath = `${rootPath}\\${relativePart.replace(/\//g, '\\')}`;
        iconSrc = convertFileSrc(fullPath);
      }
      return <img src={iconSrc} className={styles.card__imageIcon} alt="Icon" />;
    }

    return <span className={styles.card__emojiIcon}>{metadata.icon}</span>;
  };

  return (
    <div className={`${styles.card} ${metadata?.type ? styles[`card--${metadata.type}`] : ''}`} onClick={handleOpen}>
      <div className={styles.card__visual}>
        {renderIcon()}
      </div>

      <div className={styles.card__content}>
        <h3 className={styles.card__title}>{note.name.replace(/\.md$/, '')}</h3>
        
        {metadata?.fields && Object.keys(metadata.fields).length > 0 && (
          <div className={styles.card__fields}>
            {Object.entries(metadata.fields).slice(0, 3).map(([key, value]) => (
              <div key={key} className={styles.field}>
                <span className={styles.field__label}>{key}:</span>
                <span className={styles.field__value}>{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <p className={styles.card__preview}>
          {preview || 'Sem descrição...'}
        </p>
      </div>
      
      <div className={styles.card__footer}>
        <div className={styles.card__type}>
          {metadata?.type === 'character' && <User size={10} />}
          {metadata?.type === 'location' && <MapPin size={10} />}
          <span>
            {metadata?.type === 'character' ? 'Personagem' : 
             metadata?.type === 'location' ? 'Localização' : 
             metadata?.type === 'session' ? 'Sessão' : 'Nota'}
          </span>
        </div>
        <div className={styles.card__date}>
          <Clock size={10} />
          <span>{formatDate(note.modified_at)}</span>
        </div>
      </div>
    </div>
  );
}
