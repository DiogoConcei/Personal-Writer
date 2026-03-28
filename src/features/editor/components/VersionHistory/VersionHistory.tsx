import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { listSnapshots, readSnapshot, SnapshotInfo, writeFile } from '@/tauri-bridge';
import styles from './VersionHistory.module.scss';
import { History, RotateCcw, Clock, Eye, X } from 'lucide-react';

interface VersionHistoryProps {
  onClose: () => void;
  editor: any;
}

export default function VersionHistory({ onClose, editor }: VersionHistoryProps) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { setContent } = useEditorStore();
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeFile && rootPath) {
      listSnapshots(activeFile, rootPath).then(setSnapshots);
    }
  }, [activeFile, rootPath]);

  const handlePreview = async (id: string) => {
    if (!activeFile || !rootPath) return;
    const content = await readSnapshot(activeFile, rootPath, id);
    setPreviewContent(content);
    setSelectedId(id);
  };

  const handleRestore = async () => {
    if (!activeFile || !previewContent || !confirm('Restaurar esta versão? Alterações atuais não salvas serão perdidas.')) return;
    
    await writeFile(activeFile, previewContent);
    setContent(previewContent);
    editor?.commands.setContent(previewContent);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.title}>
            <History size={18} />
            <span>Histórico de Versões</span>
          </div>
          <button onClick={onClose} className={styles.btnClose}><X size={18} /></button>
        </header>

        <div className={styles.body}>
          <aside className={styles.list}>
            {snapshots.length === 0 ? (
              <p className={styles.empty}>Nenhuma versão salva ainda.</p>
            ) : (
              snapshots.map((s) => (
                <div 
                  key={s.id} 
                  className={`${styles.item} ${selectedId === s.id ? styles['item--active'] : ''}`}
                  onClick={() => handlePreview(s.id)}
                >
                  <Clock size={14} />
                  <div className={styles.item__info}>
                    <span className={styles.item__date}>{formatDate(s.timestamp)}</span>
                    <span className={styles.item__id}>ID: {s.id}</span>
                  </div>
                </div>
              ))
            )}
          </aside>

          <main className={styles.preview}>
            {previewContent !== null ? (
              <>
                <div className={styles.preview__content}>
                  <pre>{previewContent}</pre>
                </div>
                <footer className={styles.preview__footer}>
                  <button className={styles.btnRestore} onClick={handleRestore}>
                    <RotateCcw size={14} /> Restaurar esta versão
                  </button>
                </footer>
              </>
            ) : (
              <div className={styles.preview__empty}>
                <Eye size={32} />
                <p>Selecione uma versão para visualizar</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
