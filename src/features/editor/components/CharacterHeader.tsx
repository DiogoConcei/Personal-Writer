import { useState } from 'react';
import styles from './CharacterHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Metadata } from '@/features/editor/store/metadataParser';
import { 
  User, Edit3, Sparkles, ChevronRight, Info
} from 'lucide-react';
import ImageGallery from '@/features/editor/components/ImageGallery/ImageGallery';
import Modal from '@/shared/components/Modal/Modal';
import { AttributeGrid } from './AttributeGrid';
import { resolveAssetPath } from '@/tauri-bridge';

import { Backlinks } from './Backlinks';

export function CharacterHeader() {
  const { rootPath, activeFile } = useWorkspaceStore();
  const { metadata, setMetadata, save } = useEditorStore();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showEmojiPrompt, setShowEmojiPrompt] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Nota';

  const updateMetadata = (newData: Metadata) => {
    setMetadata(newData);
    // Forçar salvamento no disco para persistir mudanças de cabeçalho (icon/fields)
    if (activeFile) {
      save(activeFile, rootPath || undefined);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
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
      return <img src={resolveAssetPath(icon, rootPath)} className={styles.imageIcon} alt="Portrait" />;
    }
    return <span className={styles.emojiIcon}>{icon}</span>;
  };

  return (
    <div className={styles.profile}>
      <div className={styles.hero}>
        <div className={styles.portraitWrapper} onClick={() => setShowIconPicker(true)}>
          {renderVisualIcon()}
          <div className={styles.portraitOverlay}><Edit3 size={24} /></div>
        </div>

        <div className={styles.mainInfo}>
          <div className={styles.badgeRow}>
            <span className={styles.typeTag}><User size={12} /> Personagem</span>
            <ChevronRight size={14} className={styles.separator} />
            <span 
              className={`${styles.statusTag} ${metadata.fields?.Status === 'Inativo' ? styles['statusTag--inactive'] : ''}`}
              onClick={() => handleFieldChange('Status', metadata.fields?.Status === 'Inativo' ? 'Ativo' : 'Inativo')}
              title="Clique para alternar status"
            >
              {metadata.fields?.Status || 'Ativo'}
            </span>
          </div>
          <h1 className={styles.name}>{noteName}</h1>
          <textarea 
            className={styles.summaryInput}
            value={metadata.fields?.summary || ''} 
            onChange={(e) => {
              handleFieldChange('summary', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="Clique para adicionar um resumo..."
            rows={1}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <Info size={16} />
          <h2>Informações e Atributos</h2>
        </div>

        <AttributeGrid metadata={metadata} onUpdate={updateMetadata} />
        
        {activeFile && <Backlinks targetPath={activeFile} />}
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

