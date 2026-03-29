import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { WikiLink } from '../../extensions/WikiLink/WikiLink';
import { CustomImage } from '../../extensions/Image/Image';
import { MetadataHeader } from '../../extensions/MetadataHeader/MetadataHeader';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { listSnapshots, readSnapshot, SnapshotInfo, writeFile, createSnapshot, deleteSnapshot } from '@/tauri-bridge';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';
import styles from './VersionHistory.module.scss';
import { History, RotateCcw, Clock, Eye, X, Trash2 } from 'lucide-react';

interface VersionHistoryProps {
  onClose: () => void;
  editor: any;
}

export default function VersionHistory({ onClose, editor }: VersionHistoryProps) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { setContent, content: currentContent } = useEditorStore();
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  // Editor para Preview (Read Only)
  const previewEditor = useEditor({
    extensions: [
      StarterKit,
      WikiLink.configure({
        onLinkClick: () => {}, // Desabilitado no preview
        checkFileExists: (noteName: string) => {
          const checkRecursive = (nodeList: any[]): boolean => {
            return nodeList.some(node => {
              if (node.is_dir) return checkRecursive(node.children || []);
              return node.name.replace(/\.md$/, '') === noteName;
            });
          };
          return checkRecursive(useWorkspaceStore.getState().files);
        }
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      MetadataHeader,
    ],
    content: '',
    editable: false,
    editorProps: {
      attributes: {
        class: styles.prosePreview,
      }
    }
  }, []);

  useEffect(() => {
    if (activeFile && rootPath) {
      loadSnapshots();
    }
  }, [activeFile, rootPath]);

  const loadSnapshots = async () => {
    if (activeFile && rootPath) {
      const list = await listSnapshots(activeFile, rootPath);
      setSnapshots(list);
    }
  };

  const handlePreview = async (id: string) => {
    if (!activeFile || !rootPath || !previewEditor) return;
    const content = await readSnapshot(activeFile, rootPath, id);
    setPreviewContent(content);
    setSelectedId(id);
    previewEditor.commands.setContent(content);
  };

  const handleRestore = () => {
    if (!activeFile || !previewContent) return;
    setIsConfirming(true);
  };

  const handleDeleteSnapshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSnapshotToDelete(id);
  };

  const confirmDeleteSnapshot = async () => {
    if (!activeFile || !rootPath || !snapshotToDelete) return;
    try {
      await deleteSnapshot(activeFile, rootPath, snapshotToDelete);
      if (selectedId === snapshotToDelete) {
        setPreviewContent(null);
        setSelectedId(null);
        if (previewEditor) previewEditor.commands.setContent('');
      }
      await loadSnapshots();
    } catch (error) {
      console.error('Erro ao excluir snapshot:', error);
    } finally {
      setSnapshotToDelete(null);
    }
  };

  const confirmRestore = async () => {
    if (!activeFile || !previewContent || !rootPath) return;
    
    try {
      // 1. Snapshot de Segurança: Salva o estado ATUAL antes de restaurar
      await createSnapshot(activeFile, rootPath, currentContent || '');
      
      // 2. Restaura a versão selecionada
      await writeFile(activeFile, previewContent);
      setContent(previewContent);
      editor?.commands.setContent(previewContent);
      onClose();
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
    }
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
                  <button 
                    className={styles.item__delete} 
                    onClick={(e) => handleDeleteSnapshot(e, s.id)}
                    title="Excluir Versão"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </aside>

          <main className={styles.preview}>
            {previewContent !== null ? (
              <>
                <div className={styles.preview__content}>
                  <EditorContent editor={previewEditor} />
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

      <ConfirmModal 
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={confirmRestore}
        title="Restaurar Versão"
        message="Deseja restaurar esta versão? Um snapshot do seu conteúdo atual será criado automaticamente para que você não perca seu trabalho."
        confirmLabel="Restaurar Versão"
      />

      <ConfirmModal 
        isOpen={!!snapshotToDelete}
        onClose={() => setSnapshotToDelete(null)}
        onConfirm={confirmDeleteSnapshot}
        title="Excluir Versão"
        message="Tem certeza que deseja excluir permanentemente esta versão do histórico? Esta ação não pode ser desfeita."
        confirmLabel="Excluir Versão"
        variant="danger"
      />
    </div>
  );
}
