import React, { useState, useEffect } from 'react';
import { useReferenceStore, Metadata } from '../store/referenceStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { readFile, writeFile } from '@/tauri-bridge';
import styles from './ReferenceSidebar.module.scss';
import { X, User, MapPin, Tag, Plus, Save } from 'lucide-react';

export default function ReferenceSidebar() {
  const { pinnedNotes, unpinNote, metadata, updateMetadata } = useReferenceStore();
  const { rootPath } = useWorkspaceStore();

  if (pinnedNotes.length === 0) {
    return (
      <div className={styles.empty}>
        <Tag size={32} />
        <p>Nenhuma referência fixada.</p>
        <span>Fixe uma nota para visualizá-la aqui.</span>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <header className={styles.header}>
        <h3>Referências</h3>
      </header>
      
      <div className={styles.content}>
        {pinnedNotes.map((path) => (
          <ReferenceCard key={path} path={path} />
        ))}
      </div>
    </div>
  );
}

function ReferenceCard({ path }: { path: string }) {
  const { unpinNote, updateMetadata, metadata } = useReferenceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localMeta, setLocalMeta] = useState<Metadata>(metadata[path] || {});
  const name = path.split(/[/\\]/).pop()?.replace('.txt', '') || 'Nota';

  useEffect(() => {
    // Tenta carregar metadados do arquivo (YAML frontmatter simplificado)
    readFile(path).then(content => {
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const lines = match[1].split('\n');
        const meta: Metadata = {};
        lines.forEach(line => {
          const [key, ...val] = line.split(':');
          if (key && val) meta[key.trim()] = val.join(':').trim();
        });
        updateMetadata(path, meta);
        setLocalMeta(meta);
      }
    });
  }, [path]);

  const handleSave = async () => {
    const currentContent = await readFile(path);
    const metaString = `---\n${Object.entries(localMeta).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---`;
    
    let newContent = '';
    if (currentContent.startsWith('---')) {
      newContent = currentContent.replace(/^---\n[\s\S]*?\n---/, metaString);
    } else {
      newContent = `${metaString}\n\n${currentContent}`;
    }

    await writeFile(path, newContent);
    updateMetadata(path, localMeta);
    setIsEditing(false);
  };

  const addField = () => {
    const key = prompt('Nome do campo:');
    if (key) setLocalMeta({ ...localMeta, [key]: '' });
  };

  return (
    <div className={styles.card}>
      <header className={styles.card__header}>
        <div className={styles.card__title}>
          <User size={14} />
          <span>{name}</span>
        </div>
        <div className={styles.card__actions}>
          <button onClick={() => setIsEditing(!isEditing)}><Edit3 size={12} /></button>
          <button onClick={() => unpinNote(path)}><X size={12} /></button>
        </div>
      </header>

      <div className={styles.card__body}>
        {Object.entries(localMeta).map(([key, value]) => (
          <div key={key} className={styles.field}>
            <label>{key}</label>
            {isEditing ? (
              <input 
                value={value} 
                onChange={(e) => setLocalMeta({ ...localMeta, [key]: e.target.value })}
              />
            ) : (
              <span>{value || '---'}</span>
            )}
          </div>
        ))}
        
        {isEditing && (
          <div className={styles.card__editActions}>
            <button className={styles.btnIcon} onClick={addField}><Plus size={14} /> Campo</button>
            <button className={styles.btnPrimary} onClick={handleSave}><Save size={14} /> Salvar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Icons placeholders for compilation
const Edit3 = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
