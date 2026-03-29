import React, { useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './MetadataHeaderNode.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Image as ImageIcon, Plus, Trash2, User, MapPin, Hash, Type, Edit3, Sparkles } from 'lucide-react';
import ImageGallery from '@/features/editor/components/ImageGallery/ImageGallery';

interface MetadataData {
  type?: string;
  icon?: string;
  fields?: Record<string, any>;
}

export default function MetadataHeaderNode({ node, updateAttributes }: NodeViewProps) {
  const { rootPath } = useWorkspaceStore();
  const [data, setData] = useState<MetadataData>(node.attrs.data || {});
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  useEffect(() => {
    setData(node.attrs.data || {});
  }, [node.attrs.data]);

  const updateYAML = (newData: MetadataData) => {
    setData(newData);
    
    let yaml = '---\n';
    if (newData.type) yaml += `type: ${newData.type}\n`;
    if (newData.icon) yaml += `icon: "${newData.icon}"\n`;
    if (newData.fields) {
      yaml += `fields:\n`;
      Object.entries(newData.fields).forEach(([k, v]) => {
        const formattedValue = typeof v === 'string' ? `"${v}"` : v;
        yaml += `  ${k}: ${formattedValue}\n`;
      });
    }
    yaml += '---';
    
    updateAttributes({ 
      data: newData,
      content: yaml 
    });
  };

  const handleFieldChange = (key: string, value: any) => {
    const newData = { ...data };
    if (!newData.fields) newData.fields = {};
    newData.fields[key] = value;
    updateYAML(newData);
  };

  const addField = () => {
    const key = window.prompt('Nome do novo campo (ex: HP, Origem, Idade):');
    if (key && (!data.fields || !data.fields[key])) {
      handleFieldChange(key, "");
    }
  };

  const removeField = (key: string) => {
    const newData = { ...data };
    if (newData.fields) {
      delete newData.fields[key];
      updateYAML(newData);
    }
  };

  const handleIconSelect = (src: string) => {
    updateYAML({ ...data, icon: src });
    setShowIconPicker(false);
  };

  const handleEmojiPrompt = () => {
    const emoji = window.prompt('Digite um emoji:');
    if (emoji) {
      updateYAML({ ...data, icon: emoji });
    }
    setShowIconPicker(false);
  };

  const renderVisualIcon = () => {
    const icon = data.icon;
    if (!icon) {
      return <ImageIcon size={32} className={styles.placeholderIcon} />;
    }

    const isPath = icon.includes('/') || icon.includes('\\') || icon.includes('.');
    
    if (isPath) {
      let iconSrc = icon;
      if (iconSrc.startsWith('./') && rootPath) {
        const relativePart = iconSrc.replace('./', '');
        const fullPath = `${rootPath}\\${relativePart.replace(/\//g, '\\')}`;
        iconSrc = convertFileSrc(fullPath);
      }
      return <img src={iconSrc} className={styles.imageIcon} alt="Avatar" />;
    }

    return <span className={styles.emojiIcon}>{icon}</span>;
  };

  const getTitle = () => {
    switch (data.type) {
      case 'character': return 'Ficha de Personagem';
      case 'location': return 'Registro de Local';
      case 'session': return 'Diário de Sessão';
      default: return 'Detalhes da Nota';
    }
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case 'character': return 'Personagem';
      case 'location': return 'Localização';
      case 'session': return 'Sessão';
      default: return 'Nota';
    }
  };

  return (
    <NodeViewWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} onClick={() => setShowIconPicker(true)} title="Alterar Ícone ou Emoji">
          {renderVisualIcon()}
          <div className={styles.iconOverlay}>
            <Edit3 size={24} />
          </div>
        </div>
        
        <div className={styles.info}>
          <div className={styles.typeBadge}>
            {data.type === 'character' && <User size={12} />}
            {data.type === 'location' && <MapPin size={12} />}
            {data.type === 'session' && <Sparkles size={12} />}
            <span>{getTypeLabel()}</span>
          </div>
          <h1 className={styles.title}>{getTitle()}</h1>
        </div>
      </div>

      <div className={styles.fieldsGrid}>
        {data.fields && Object.entries(data.fields).map(([key, value]) => (
          <div key={key} className={styles.fieldCard}>
            <div className={styles.fieldCard__header}>
              <span className={styles.fieldCard__label}>{key}</span>
              <button className={styles.fieldCard__delete} onClick={() => removeField(key)} title="Remover campo">
                <Trash2 size={12} />
              </button>
            </div>
            <div className={styles.fieldCard__inputWrapper}>
              {typeof value === 'number' ? <Hash size={14} /> : <Type size={14} />}
              <input 
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
                className={styles.fieldCard__input}
                placeholder="..."
              />
            </div>
          </div>
        ))}
        
        <button className={styles.addFieldBtn} onClick={addField}>
          <Plus size={18} />
          <span>Novo Campo</span>
        </button>
      </div>
      
      {showIconPicker && (
        <>
          <ImageGallery 
            onSelect={handleIconSelect}
            onClose={() => setShowIconPicker(false)}
          />
          <div className={styles.emojiPrompt}>
            <button onClick={handleEmojiPrompt} className={styles.addFieldBtn} style={{ flexDirection: 'row', minHeight: 'auto', padding: '8px 16px', borderStyle: 'solid' }}>
              <Sparkles size={14} />
              <span>Usar Emoji</span>
            </button>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}
