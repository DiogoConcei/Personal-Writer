import styles from './AttributeGrid.module.scss';
import { useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, GripVertical } from 'lucide-react';
import { EditorMetadata, FieldConfig } from '@/shared/types';
import Modal from '@/shared/components/Modal/Modal/Modal';
import { useDragAndDrop } from '@/shared/hooks/useDragAndDrop/useDragAndDrop';

interface AttributeGridProps {
  metadata: EditorMetadata;
  onUpdate: (newData: EditorMetadata) => void;
  readOnly?: boolean;
}

export function AttributeGrid({ metadata, onUpdate, readOnly }: AttributeGridProps) {
  const [editingField, setEditingField] = useState<{ 
    isNew: boolean; 
    oldName?: string; 
    name: string; 
    type: 'text' | 'number' | 'single-select' | 'multi-select'; 
    options: string 
  } | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const {
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
  } = useDragAndDrop<string>({
    onDrop: (draggedKey, _targetType, targetKey) => {
      if (draggedKey === targetKey) return;

      const keys = Object.keys(metadata.fields || {});
      const oldIndex = keys.indexOf(draggedKey);
      const newIndex = keys.indexOf(targetKey);

      if (oldIndex === -1 || newIndex === -1) return;

      const newKeys = [...keys];
      newKeys.splice(oldIndex, 1);
      newKeys.splice(newIndex, 0, draggedKey);

      const newData = { ...metadata };
      const newFields: Record<string, any> = {};
      const newConfig: Record<string, FieldConfig> = {};

      newKeys.forEach(k => {
        newFields[k] = metadata.fields![k];
        if (metadata.config?.[k]) {
          newConfig[k] = metadata.config[k];
        }
      });

      newData.fields = newFields;
      newData.config = newConfig;
      onUpdate(newData);
    },
    isValidTarget: (_, type) => type === 'attribute'
  });

  const handleFieldChange = (key: string, value: any) => {
    if (readOnly) return;
    const newData = { ...metadata };
    if (!newData.fields) newData.fields = {};
    const config = metadata.config?.[key];
    
    if (config?.type === 'number') {
      const numVal = value === '' ? 0 : Number(value);
      newData.fields[key] = isNaN(numVal) ? 0 : numVal;
    } else {
      newData.fields[key] = value;
    }
    
    onUpdate(newData);
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Bloqueia caracteres que não são números, backspace, delete, setas ou tab
    if (
      !/[0-9]/.test(e.key) && 
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  const toggleMultiSelectOption = (key: string, option: string) => {
    const currentValues = (metadata.fields?.[key] as string[]) || [];
    let newValues: string[];
    
    if (currentValues.includes(option)) {
      newValues = currentValues.filter(v => v !== option);
    } else {
      newValues = [...currentValues, option];
    }
    
    handleFieldChange(key, newValues);
  };

  const removeField = (key: string) => {
    if (readOnly) return;
    const newData = { ...metadata };
    if (newData.fields) delete newData.fields[key];
    if (newData.config) delete newData.config[key];
    onUpdate(newData);
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

    if (isNew) {
      if (type === 'number') newData.fields[name] = 0;
      else if (type === 'multi-select') newData.fields[name] = [];
      else newData.fields[name] = '';
    }

    newData.config[name] = { 
      type, 
      options: (type === 'single-select' || type === 'multi-select') 
        ? options.split('|').map(s => s.trim()).filter(Boolean) 
        : [] 
    };

    onUpdate(newData);
    setEditingField(null);
  };

  const addConfigOption = (val: string) => {
    if (!editingField || !val.trim()) return;
    const currentOptions = editingField.options ? editingField.options.split('|') : [];
    if (currentOptions.includes(val.trim())) return;
    
    setEditingField({
      ...editingField,
      options: [...currentOptions, val.trim()].join('|')
    });
  };

  const removeConfigOption = (val: string) => {
    if (!editingField) return;
    const currentOptions = editingField.options.split('|');
    setEditingField({
      ...editingField,
      options: currentOptions.filter(o => o !== val).join('|')
    });
  };

  return (
    <div className={`${styles.grid} ${readOnly ? styles['grid--readonly'] : ''}`}>
      {metadata.fields && Object.entries(metadata.fields)
        .filter(([key]) => key !== 'summary' && key !== 'Status' && key !== 'order')
        .map(([key, value]) => {
          const config = metadata.config?.[key];
          const type = config?.type || (typeof value === 'number' ? 'number' : (Array.isArray(value) ? 'multi-select' : 'text'));
          const isBeingDragged = draggedItem === key;
          const isDropTarget = dropTarget?.id === key;

          return (
            <div 
              key={key} 
              className={`
                ${styles.field} 
                ${isBeingDragged ? styles.dragging : ''} 
                ${isDropTarget ? styles.dropTarget : ''}
              `}
              data-drag-id={key}
              data-drag-type="attribute"
            >
              <div className={styles.fieldHeader}>
                <div className={styles.labelGroup}>
                  {!readOnly && (
                    <GripVertical 
                      size={12} 
                      className={styles.dragHandle} 
                      onMouseDown={(e) => handleMouseDown(e, key)}
                    />
                  )}
                  <span className={styles.label}>{key}</span>
                </div>
                {!readOnly && (
                  <div className={styles.actions}>
                    <button onClick={() => setEditingField({ 
                      isNew: false, oldName: key, name: key, 
                      type: type as any, options: config?.options?.join('|') || '' 
                    })}><SettingsIcon size={12} /></button>
                    <button onClick={() => removeField(key)}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
              
              <div className={styles.inputArea}>
                {type === 'single-select' ? (
                  <select 
                    value={value as string} 
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readOnly}
                  >
                    <option value="" disabled>Selecionar...</option>
                    {config?.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : type === 'multi-select' ? (
                  <div className={styles.multiSelectContainer}>
                    <div className={styles.tagContainer}>
                      {Array.isArray(value) && value.map(val => (
                        <span key={val} className={styles.tag}>
                          {val}
                          {!readOnly && (
                            <button onClick={() => toggleMultiSelectOption(key, val)} className={styles.removeTag}>
                              <Plus size={10} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                          )}
                        </span>
                      ))}
                      {!readOnly && (
                        <button 
                          className={styles.addTagBtn}
                          onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    
                    {activeDropdown === key && config?.options && (
                      <div className={styles.dropdownMenu}>
                        {config.options
                          .filter(opt => !((value as string[]) || []).includes(opt))
                          .map(opt => (
                            <button 
                              key={opt} 
                              onClick={() => {
                                toggleMultiSelectOption(key, opt);
                                setActiveDropdown(null);
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        {config.options.filter(opt => !((value as string[]) || []).includes(opt)).length === 0 && (
                          <div className={styles.noOptions}>Todas as opções selecionadas</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input 
                    type="text"
                    inputMode={type === 'number' ? 'numeric' : 'text'}
                    value={value as string | number}
                    onKeyDown={type === 'number' ? handleNumberKeyDown : undefined}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder="..."
                    readOnly={readOnly}
                  />
                )}
              </div>
            </div>
          );
      })}

      {isDragging && draggedItem && (
        <div 
          className={styles.dragGhost}
          style={{ 
            left: dragPosition.x, 
            top: dragPosition.y 
          }}
        >
          <GripVertical size={12} />
          <span>{draggedItem}</span>
        </div>
      )}
      
      {!readOnly && (
        <button className={styles.addBtn} onClick={() => setEditingField({ isNew: true, name: '', type: 'text', options: '' })}>
          <Plus size={20} />
          <span>Adicionar Atributo</span>
        </button>
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
                <option value="single-select">Seleção Única (Dropdown)</option>
                <option value="multi-select">Seleção Múltipla (Tags)</option>
              </select>
            </div>
            {(editingField.type === 'single-select' || editingField.type === 'multi-select') && (
              <div className={styles.formGroup}>
                <label>Configurar Opções</label>
                <div className={styles.configTagInputWrapper}>
                  <input 
                    placeholder="Digite uma opção e aperte Enter..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addConfigOption((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                {editingField.options.split('|').filter(Boolean).length > 0 && (
                  <div className={styles.configTagList}>
                    {editingField.options.split('|').filter(Boolean).map(opt => (
                      <span key={opt} className={styles.configTag}>
                        {opt}
                        <button onClick={() => removeConfigOption(opt)}>
                          <Plus size={10} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
