import { useState, useEffect, useRef } from 'react';
import styles from './CharacterHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { EditorMetadata } from '@/shared/types';
import {
  User, Edit3, Sparkles, ChevronRight, Info
} from 'lucide-react';
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import Modal from '@/shared/components/Modal/Modal/Modal';
import { AttributeGrid } from '../../Metadata/AttributeGrid/AttributeGrid';
import { resolveAssetPath } from '@/tauri-bridge';
import { Backlinks } from '../../Insights/Backlinks/Backlinks';
import { SummaryEditor } from '../../Metadata/SummaryEditor/SummaryEditor';

interface CharacterHeaderProps {
  metadata?: EditorMetadata;
  readOnly?: boolean;
}

export function CharacterHeader({ metadata: propMetadata, readOnly }: CharacterHeaderProps) {
  const { rootPath, activeFile } = useWorkspaceStore();
  const { metadata: storeMetadata, setMetadata, save } = useEditorStore();

  const metadata = propMetadata || storeMetadata;

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showEmojiPrompt, setShowEmojiPrompt] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Nota';

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartEditing = () => {
    if (readOnly) return;
    setEditedName(noteName || '');
    setIsEditingName(true);
  };

  const handleRename = async () => {
    if (!activeFile || !editedName || editedName === noteName) {
      setIsEditingName(false);
      return;
    }

    const { renameItem } = useWorkspaceStore.getState();
    await renameItem(activeFile, editedName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const updateMetadata = (newData: EditorMetadata) => {
    if (readOnly) return;
    setMetadata(newData);

    if (activeFile) {
      save(activeFile, rootPath || undefined);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    if (readOnly) return;
    const newData = { ...metadata };
    if (!newData.fields) newData.fields = {};
    newData.fields[key] = value;
    updateMetadata(newData);
  };

  const renderVisualIcon = () => {
    const icon = metadata.icon;
    if (!icon) return <div className={styles.placeholderIcon}><User size={64} strokeWidth={1} /></div>;

    const isPath = icon.includes('/') || icon.includes('\\') || icon.includes('.');
    if (isPath) {
      return <img src={resolveAssetPath(icon, rootPath) || undefined} className={styles.imageIcon} alt="Portrait" />;
    }
    return <span className={styles.emojiIcon}>{icon}</span>;
  };

  return (
    <div className={`${styles.profile} ${readOnly ? styles['profile--readonly'] : ''}`}>
      <div className={styles.hero}>
        <div className={styles.portraitWrapper} onClick={() => !readOnly && setShowIconPicker(true)}>
          {renderVisualIcon()}
          {!readOnly && <div className={styles.portraitOverlay}><Edit3 size={24} /></div>}
        </div>

        <div className={styles.mainInfo}>
          <div className={styles.badgeRow}>
            <span className={styles.typeTag}><User size={12} /> Personagem</span>
            <ChevronRight size={14} className={styles.separator} />
            <span
              className={`${styles.statusTag} ${metadata.fields?.Status === 'Inativo' ? styles['statusTag--inactive'] : ''} ${readOnly ? styles['statusTag--readonly'] : ''}`}
              onClick={() => !readOnly && handleFieldChange('Status', metadata.fields?.Status === 'Inativo' ? 'Ativo' : 'Inativo')}
              title={readOnly ? "" : "Clique para alternar status"}
            >
              {metadata.fields?.Status || 'Ativo'}
            </span>
          </div>

          {isEditingName ? (
            <input
              ref={nameInputRef}
              className={styles.nameInput}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h1
              className={`${styles.name} ${!readOnly ? styles['name--editable'] : ''}`}
              onClick={handleStartEditing}
              title={readOnly ? "" : "Clique para renomear"}
            >
              {noteName}
            </h1>
          )}

          <SummaryEditor
            value={metadata.fields?.summary || ''}
            onChange={(html) => !readOnly && handleFieldChange('summary', html)}
            placeholder={readOnly ? "" : "Clique para adicionar um resumo..."}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <Info size={16} />
          <h2>Informações e Atributos</h2>
        </div>

        <AttributeGrid metadata={metadata} onUpdate={updateMetadata} readOnly={readOnly} />

        {!readOnly && activeFile && <Backlinks targetPath={activeFile} />}
      </div>

      {showIconPicker && (
        <Modal isOpen={true} onClose={() => setShowIconPicker(false)} title="Escolher Retrato" size="lg">
          <div className={styles.modalActions}>
             <button onClick={() => setShowEmojiPrompt(true)} className={styles.secondaryBtn}>
                <Sparkles size={16} /> Usar Emoji
              </button>
          </div>
          <ImageGallery onSelect={(src) => { updateMetadata({ ...metadata, icon: src }); setShowIconPicker(false); }} onClose={() => setShowIconPicker(false)} />
        </Modal>
      )}

      {showEmojiPrompt && (
        <Modal isOpen={true} onClose={() => setShowEmojiPrompt(false)} title="Inserir Emoji">
          <div className={styles.emojiInputWrapper}>
            <input autoFocus value={emojiInput} onChange={(e) => setEmojiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (updateMetadata({ ...metadata, icon: emojiInput }), setShowEmojiPrompt(false), setShowIconPicker(false))} />
            <button onClick={() => { updateMetadata({ ...metadata, icon: emojiInput }); setShowEmojiPrompt(false); setShowIconPicker(false); }} className={styles.primaryBtn}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
