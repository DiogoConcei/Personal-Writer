import { useState } from 'react';
import styles from './MetadataHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore, Metadata } from '@/features/editor/store/editorStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { 
  Plus, Trash2, User, 
  Edit3, Sparkles, Settings, 
  ChevronRight, Info
} from 'lucide-react';
import ImageGallery from '@/features/editor/components/ImageGallery/ImageGallery';
import Modal from '@/shared/components/Modal/Modal';

export function MetadataHeader() {
  const { rootPath, activeFile } = useWorkspaceStore();
  const { metadata, setMetadata } = useEditorStore();
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const [editingField, setEditingField] = useState<{ 
    isNew: boolean; 
    oldName?: string; 
    name: string; 
    type: 'text' | 'number' | 'select'; 
    options: string 
  } | null>(null);
  
  const [showEmojiPrompt, setShowEmojiPrompt] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Nota';

  const updateMetadata = (newData: Metadata) => {
    setMetadata(newData);
  };

  const handleFieldChange = (key: string, value: any) => {
    const newData = { ...metadata };
    if (!newData.fields) newData.fields = {};
    const config = metadata.config?.[key];
    newData.fields[key] = config?.type === 'number' ? Number(value) : value;
    updateMetadata(newData);
  };

  const removeField = (key: string) => {
    const newData = { ...metadata };
    if (newData.fields) delete newData.fields[key];
    if (newData.config) delete newData.config[key];
    updateMetadata(newData);
  };

  const saveFieldConfig = () => {
    if (!editingField || !editingField.name.trim()) return;
    const newData = { ...metadata };
    if (!newData.fields) newData.fields = {};
    if (!newData.config) newData.config = {};

    const { isNew, oldName, name, type, options } = editingField;

    if (!isNew && oldName && oldName !== name) {
      newData.fields[name] = newData.fields[oldName];
      delete newData.fields[oldName];
      if (newData.config[oldName]) {
        newData.config[name] = newData.config[oldName];
        delete newData.config[oldName];
      }
    }

    if (isNew) newData.fields[name] = type === 'number' ? 0 : '';

    newData.config[name] = { 
      type, 
      options: type === 'select' ? options.split(',').map(s => s.trim()).filter(Boolean) : [] 
    };

    updateMetadata(newData);
    setEditingField(null);
  };

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
        <div className={styles.portraitWrapper} onClick={() => setShowIconPicker(true)}>
          {renderVisualIcon()}
          <div className={styles.portraitOverlay}><Edit3 size={24} /></div>
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
          <textarea 
            className={styles.summaryInput}
            value={metadata.fields?.summary || ''} 
            onChange={(e) => {
              handleFieldChange('summary', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onFocus={(e) => {
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

        <div className={styles.grid}>
          {metadata.fields && Object.entries(metadata.fields)
            .filter(([key]) => key !== 'summary') // Ignorar o summary na grade principal
            .map(([key, value]) => {
            const config = metadata.config?.[key];
            const type = config?.type || (typeof value === 'number' ? 'number' : 'text');
            
            return (
              <div key={key} className={styles.field}>
                <div className={styles.fieldHeader}>
                  <span className={styles.label}>{key}</span>
                  <div className={styles.actions}>
                    <button onClick={() => setEditingField({ 
                      isNew: false, oldName: key, name: key, 
                      type: type as any, options: config?.options?.join(', ') || '' 
                    })}><Settings size={12} /></button>
                    <button onClick={() => removeField(key)}><Trash2 size={12} /></button>
                  </div>
                </div>
                
                <div className={styles.inputArea}>
                  {type === 'select' ? (
                    <select value={value} onChange={(e) => handleFieldChange(key, e.target.value)}>
                      <option value="" disabled>Selecionar...</option>
                      {config?.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      type={type === 'number' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      placeholder="..."
                    />
                  )}
                </div>
              </div>
            );
          })}
          
          <button className={styles.addBtn} onClick={() => setEditingField({ isNew: true, name: '', type: 'text', options: '' })}>
            <Plus size={20} />
            <span>Adicionar Atributo</span>
          </button>
        </div>
      </div>

      {/* Modais mantidos para funcionalidade */}
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

      {editingField && (
        <Modal isOpen={true} onClose={() => setEditingField(null)} title={editingField.isNew ? "Novo Atributo" : "Configurar Atributo"}>
          <div className={styles.fieldForm}>
            <div className={styles.formGroup}>
              <label>Nome</label>
              <input autoFocus value={editingField.name} onChange={(e) => setEditingField({ ...editingField, name: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo</label>
              <select value={editingField.type} onChange={(e) => setEditingField({ ...editingField, type: e.target.value as any })}>
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="select">Lista (Dropdown)</option>
              </select>
            </div>
            {editingField.type === 'select' && (
              <div className={styles.formGroup}>
                <label>Opções (separadas por vírgula)</label>
                <input placeholder="Ex: Guerreiro, Mago" value={editingField.options} onChange={(e) => setEditingField({ ...editingField, options: e.target.value })} />
              </div>
            )}
            <div className={styles.formActions}>
              <button onClick={() => setEditingField(null)} className={styles.textBtn}>Cancelar</button>
              <button onClick={saveFieldConfig} className={styles.primaryBtn}>Salvar Atributo</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
