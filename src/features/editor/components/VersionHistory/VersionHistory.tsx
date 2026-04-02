import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { 
  listSnapshots, 
  readSnapshot, 
  SnapshotInfo, 
  createSnapshot, 
  deleteSnapshot,
  toggleSnapshotLock 
} from '@/tauri-bridge';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';
import styles from './VersionHistory.module.scss';
import { 
  History, 
  RotateCcw, 
  X, 
  Trash2, 
  Lock, 
  Unlock, 
  FileClock,
  AlertTriangle
} from 'lucide-react';

interface VersionHistoryProps {
  onClose: () => void;
  editor: any;
}

/**
 * NOTA DE DESENVOLVIMENTO: 
 * O Preview foi removido temporariamente por problemas de renderização e escala.
 * REVISAR O PREVIEW OBRIGATORIAMENTE na próxima iteração de UX.
 */
export default function VersionHistory({ onClose, editor }: VersionHistoryProps) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { markdownContent: currentContent, loadContent } = useEditorStore();
  
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotInfo | null>(null);
  
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : '';

  useEffect(() => {
    if (activeFile && rootPath) loadSnapshots();
  }, [activeFile, rootPath]);

  const loadSnapshots = async () => {
    if (activeFile && rootPath) {
      setLoading(true);
      const list = await listSnapshots(activeFile, rootPath);
      setSnapshots(list);
      setLoading(false);
    }
  };

  const handleToggleLock = async (e: React.MouseEvent, snapshot: SnapshotInfo) => {
    e.stopPropagation();
    if (!activeFile || !rootPath) return;
    
    try {
      await toggleSnapshotLock(activeFile, rootPath, snapshot.id);
      await loadSnapshots();
    } catch (error) {
      console.error('Erro ao alternar trava:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, snapshot: SnapshotInfo) => {
    e.stopPropagation();
    if (snapshot.is_locked) return;
    setSnapshotToDelete(snapshot);
  };

  const confirmDelete = async () => {
    if (!activeFile || !rootPath || !snapshotToDelete) return;
    try {
      await deleteSnapshot(activeFile, rootPath, snapshotToDelete.id);
      if (selectedSnapshot?.id === snapshotToDelete.id) {
        setSelectedSnapshot(null);
      }
      await loadSnapshots();
    } catch (error) {
      console.error('Erro ao excluir snapshot:', error);
    } finally {
      setSnapshotToDelete(null);
    }
  };

  const confirmRestore = async () => {
    if (!activeFile || !rootPath || !selectedSnapshot) return;

    try {
      // 1. Backup do estado atual
      await createSnapshot(activeFile, rootPath, currentContent || '');
      
      // 2. Carrega o conteúdo do snapshot selecionado
      const fullContent = await readSnapshot(activeFile, rootPath, selectedSnapshot.id);
      
      // 3. Persiste no arquivo real
      const { writeFile } = await import('@/tauri-bridge');
      await writeFile(activeFile, fullContent);
      
      // 4. Recarrega a store e o editor
      await loadContent(activeFile);
      if (editor) {
        const { parseMarkdownMetadata } = await import('@/features/editor/store/metadataParser');
        const { markdown } = parseMarkdownMetadata(fullContent);
        editor.commands.setContent(markdown);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      full: date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
    return `Há ${Math.floor(diff / 86400)} d`;
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.panel} ${styles['panel--simple']}`}>
        <header className={styles.header}>
          <div className={styles.title}>
            <div className={styles.iconBox}><History size={20} /></div>
            <div className={styles.titleText}>
              <h1>Histórico de Versões</h1>
              <span>Selecione uma versão de <strong>{noteName}</strong> para restaurar</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.btnClose}><X size={20} /></button>
        </header>

        <div className={styles.body}>
          <div className={styles.listFull}>
            <div className={styles.listHeader}>
              <FileClock size={14} />
              <span>{snapshots.length} versões disponíveis</span>
            </div>
            
            <div className={styles.scrollArea}>
              {loading ? (
                <div className={styles.empty}>Carregando histórico...</div>
              ) : snapshots.length === 0 ? (
                <div className={styles.empty}>Nenhuma versão salva ainda.</div>
              ) : (
                snapshots.map((s) => {
                  const date = formatDate(s.timestamp);
                  const isSelected = selectedSnapshot?.id === s.id;
                  return (
                    <div 
                      key={s.id} 
                      className={`
                        ${styles.item} 
                        ${isSelected ? styles['item--active'] : ''}
                        ${s.is_locked ? styles['item--locked'] : ''}
                      `}
                      onClick={() => setSelectedSnapshot(s)}
                    >
                      <div className={styles.item__main}>
                        <div className={styles.item__indicator} />
                        <div className={styles.item__info}>
                          <span className={styles.item__date}>{date.full}</span>
                          <span className={styles.item__relative}>{date.relative}</span>
                        </div>
                      </div>

                      <div className={styles.item__actions}>
                        <button 
                          className={`${styles.actionBtn} ${s.is_locked ? styles['actionBtn--locked'] : ''}`}
                          onClick={(e) => handleToggleLock(e, s)}
                          title={s.is_locked ? "Descongelar versão" : "Congelar versão (milestone)"}
                        >
                          {s.is_locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                        {!s.is_locked && (
                          <button 
                            className={styles.actionBtn} 
                            onClick={(e) => handleDeleteClick(e, s)}
                            title="Excluir versão"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedSnapshot && (
              <div className={styles.simpleFooter}>
                <div className={styles.warning}>
                  <AlertTriangle size={14} />
                  <span>O preview está desabilitado. Revise os dados antes de restaurar.</span>
                </div>
                <button className={styles.btnRestore} onClick={() => setIsConfirmingRestore(true)}>
                  <RotateCcw size={16} /> Restaurar versão selecionada
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isConfirmingRestore}
        onClose={() => setIsConfirmingRestore(false)}
        onConfirm={confirmRestore}
        title="Restaurar Versão"
        message={`Deseja restaurar a versão de ${selectedSnapshot ? formatDate(selectedSnapshot.timestamp).full : ''}? O conteúdo atual será substituído.`}
        confirmLabel="Confirmar Restauração"
      />

      <ConfirmModal 
        isOpen={!!snapshotToDelete}
        onClose={() => setSnapshotToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Versão"
        message="Deseja excluir permanentemente esta versão do histórico?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
