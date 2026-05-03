import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { WikiLink } from "../../../extensions/WikiLink/WikiLink";
import { CustomImage } from "../../../extensions/Image/Image";
import { CustomCodeBlock } from "../../../extensions/CodeBlock/CodeBlock";
import { PdfLink } from "../../../extensions/PdfLink/PdfLink";
import { FontSize } from "../../../extensions/FontSize";
import { Markdown } from "tiptap-markdown";
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import {
  listSnapshots,
  readSnapshot,
  SnapshotInfo,
  createSnapshot,
  deleteSnapshot,
  toggleSnapshotLock
} from '@/tauri-bridge';
import { parseMarkdownMetadata, stringifyYAML } from "../../../store/metadataParser";
import { EditorMetadata } from '@/shared/types';
import { MetadataHeader } from "../../Headers/MetadataHeader/MetadataHeader";
import ConfirmModal from '@/shared/components/Modal/ConfirmModal/ConfirmModal';
import styles from './VersionHistory.module.scss';
import editorStyles from "../../Core/Editor/Editor.module.scss";
import {
  History,
  RotateCcw,
  X,
  Trash2,
  Lock,
  Unlock,
  FileClock,
  Eye,
  Loader2,
  Save,
  CheckSquare,
  Square,
  Check
} from 'lucide-react';

interface VersionHistoryProps {
  onClose: () => void;
  editor: any;
}

export default function VersionHistory({ onClose, editor: mainEditor }: VersionHistoryProps) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { markdownContent: currentContent, loadContent, typography, metadata: currentMetadata } = useEditorStore();

  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotInfo | null>(null);
  const [previewMetadata, setPreviewMetadata] = useState<EditorMetadata | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotInfo | null>(null);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : '';

  const previewEditor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CustomCodeBlock,
      Markdown.configure({
        html: true,
        tightLists: true,
        linkify: true,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      WikiLink.configure({
        onLinkClick: () => {},
      } as any),
      CustomImage.configure({ inline: true, allowBase64: true }),
      PdfLink,
    ],
    content: '',
    editable: false,
    editorProps: {
      attributes: {
        class: `${editorStyles.prose} ${styles.previewProse}`,
        spellcheck: 'false'
      },
    },
  });

  useEffect(() => {
    if (activeFile && rootPath) loadSnapshots();
  }, [activeFile, rootPath]);

  useEffect(() => {
    async function loadPreview() {
      if (selectedSnapshot && activeFile && rootPath && previewEditor) {
        setLoadingPreview(true);
        try {
          const content = await readSnapshot(activeFile, rootPath, selectedSnapshot.id);
          const { metadata, markdown } = parseMarkdownMetadata(content);
          setPreviewMetadata(metadata);
          previewEditor.commands.setContent(markdown);
        } catch (e) {
          console.error('Erro ao carregar preview:', e);
          setPreviewMetadata(null);
          previewEditor.commands.setContent('<p>Erro ao carregar conteúdo do snapshot.</p>');
        } finally {
          setLoadingPreview(false);
        }
      }
    }
    loadPreview();
  }, [selectedSnapshot, activeFile, rootPath, previewEditor]);

  const loadSnapshots = async () => {
    if (activeFile && rootPath) {
      setLoadingList(true);
      const list = await listSnapshots(activeFile, rootPath);
      setSnapshots(list);
      setLoadingList(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    if (!activeFile || !rootPath) return;
    setIsSaving(true);
    try {
      const yaml = stringifyYAML(currentMetadata);
      const fullContent = yaml ? `${yaml}\n\n${currentContent}` : currentContent;

      await createSnapshot(activeFile, rootPath, fullContent);
      await loadSnapshots();
    } catch (e) {
      console.error('Erro ao criar snapshot manual:', e);
    } finally {
      setIsSaving(false);
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

  const handleItemClick = (snapshot: SnapshotInfo) => {
    if (isSelectionMode) {
      if (snapshot.is_locked) return;
      setSelectedSnapshotIds(prev => 
        prev.includes(snapshot.id) 
          ? prev.filter(id => id !== snapshot.id) 
          : [...prev, snapshot.id]
      );
    } else {
      setSelectedSnapshot(snapshot);
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
        previewEditor?.commands.clearContent();
      }
      await loadSnapshots();
    } catch (error) {
      console.error('Erro ao excluir snapshot:', error);
    } finally {
      setSnapshotToDelete(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (!activeFile || !rootPath || selectedSnapshotIds.length === 0) return;
    try {
      setLoadingList(true);
      for (const id of selectedSnapshotIds) {
        await deleteSnapshot(activeFile, rootPath, id);
        if (selectedSnapshot?.id === id) {
          setSelectedSnapshot(null);
          previewEditor?.commands.clearContent();
        }
      }
      await loadSnapshots();
      setSelectedSnapshotIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Erro ao excluir snapshots em massa:', error);
    } finally {
      setIsConfirmingBulkDelete(false);
      setLoadingList(false);
    }
  };

  const confirmRestore = async () => {
    if (!activeFile || !rootPath || !selectedSnapshot) return;
    try {
      await createSnapshot(activeFile, rootPath, currentContent || '');
      const fullContent = await readSnapshot(activeFile, rootPath, selectedSnapshot.id);
      const { writeFile } = await import('@/tauri-bridge');
      await writeFile(activeFile, fullContent);
      await loadContent(activeFile);
      if (mainEditor) {
        const { markdown } = parseMarkdownMetadata(fullContent);
        mainEditor.commands.setContent(markdown);
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
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `Há ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return `Há ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.title}>
            <div className={styles.iconBox}><History size={20} /></div>
            <div className={styles.titleText}>
              <h1>Histórico de Versões</h1>
              <span>Explorando versões de <strong>{noteName}</strong></span>
            </div>
          </div>
          <button onClick={onClose} className={styles.btnClose}><X size={20} /></button>
        </header>

        <div className={styles.body}>
          <aside className={styles.listSide}>
            <div className={styles.listHeader}>
              <div className={styles.listHeader__info}>
                <FileClock size={14} />
                <span>{snapshots.length} versões</span>
              </div>
              
              <div className={styles.selectionActions}>
                <button 
                  className={`${styles.btnMultiSelect} ${isSelectionMode ? styles['btnMultiSelect--active'] : ''}`}
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedSnapshotIds([]);
                  }}
                  title="Seleção Múltipla"
                >
                  {isSelectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>

                {isSelectionMode && selectedSnapshotIds.length > 0 && (
                  <button 
                    className={styles.btnBulkDelete}
                    onClick={() => setIsConfirmingBulkDelete(true)}
                  >
                    <Trash2 size={14} />
                    <span>({selectedSnapshotIds.length})</span>
                  </button>
                )}

                <button
                  className={styles.btnSaveNow}
                  onClick={handleCreateManualSnapshot}
                  disabled={isSaving || isSelectionMode}
                  title="Criar novo snapshot do estado atual"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Salvar agora</span>
                </button>
              </div>
            </div>

            <div className={styles.scrollArea}>
              {loadingList ? (
                <div className={styles.empty}>Carregando...</div>
              ) : snapshots.length === 0 ? (
                <div className={styles.empty}>Sem histórico.</div>
              ) : (
                snapshots.map((s) => {
                  const date = formatDate(s.timestamp);
                  const isSelected = selectedSnapshot?.id === s.id;
                  const isChecked = selectedSnapshotIds.includes(s.id);
                  
                  return (
                    <div
                      key={s.id}
                      className={`
                        ${styles.item}
                        ${isSelected ? styles['item--active'] : ''}
                        ${s.is_locked ? styles['item--locked'] : ''}
                      `}
                      onClick={() => handleItemClick(s)}
                    >
                      <div className={styles.item__main}>
                        {isSelectionMode && !s.is_locked && (
                          <div className={`${styles.checkbox} ${isChecked ? styles['checkbox--checked'] : ''}`}>
                            <Check size={10} />
                          </div>
                        )}
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
                          title={s.is_locked ? "Descongelar" : "Congelar"}
                        >
                          {s.is_locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                        {!s.is_locked && !isSelectionMode && (
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => handleDeleteClick(e, s)}
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

            {selectedSnapshot && !isSelectionMode && (
              <div className={styles.footer}>
                <button className={styles.btnRestore} onClick={() => setIsConfirmingRestore(true)}>
                  <RotateCcw size={16} /> Restaurar esta versão
                </button>
              </div>
            )}
          </aside>

          <main className={styles.previewArea}>
            {selectedSnapshot ? (
              <>
                <header className={styles.previewHeader}>
                  <div className={styles.versionInfo}>
                    <span>Visualizando versão de</span>
                    <strong>{formatDate(selectedSnapshot.timestamp).full}</strong>
                  </div>
                </header>

                <div className={`${styles.previewScroll} ${styles[`previewScroll--${typography}`]}`}>
                  {loadingPreview && (
                    <div className={styles.previewLoading}>
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  )}
                  {previewMetadata && <MetadataHeader metadata={previewMetadata} readOnly={true} />}
                  <EditorContent editor={previewEditor} />
                </div>
              </>
            ) : (
              <div className={styles.previewPlaceholder}>
                <Eye size={48} />
                <p>Selecione uma versão para visualizar o conteúdo</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmingRestore}
        onClose={() => setIsConfirmingRestore(false)}
        onConfirm={confirmRestore}
        title="Restaurar Versão"
        message="Deseja restaurar esta versão? O conteúdo atual será salvo como uma nova versão antes da restauração."
        confirmLabel="Restaurar agora"
      />

      <ConfirmModal
        isOpen={!!snapshotToDelete}
        onClose={() => setSnapshotToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Versão"
        message="Esta ação é irreversível."
        confirmLabel="Excluir"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isConfirmingBulkDelete}
        onClose={() => setIsConfirmingBulkDelete(false)}
        onConfirm={confirmBulkDelete}
        title="Excluir Várias Versões"
        message={`Deseja excluir as ${selectedSnapshotIds.length} versões selecionadas? Esta ação é irreversível.`}
        confirmLabel={`Excluir ${selectedSnapshotIds.length} versões`}
        variant="danger"
      />
    </div>
  );
}
