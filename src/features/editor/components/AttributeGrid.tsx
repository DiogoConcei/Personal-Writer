import styles from './AttributeGrid.module.scss';
import { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { Metadata } from '@/features/editor/store/editorStore';
import Modal from '@/shared/components/Modal/Modal';

interface AttributeGridProps {
  metadata: Metadata;
  onUpdate: (newData: Metadata) => void;
}

export function AttributeGrid({ metadata, onUpdate }: AttributeGridProps) {
  const [editingField, setEditingField] = useState<{ 
    isNew: boolean; 
    oldName?: string; 
    name: string; 
    type: 'text' | 'number' | 'select'; 
    options: string 
  } | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    const newData = { ...metadata };
    if (!newData.fields) newData.fields = {};
    const config = metadata.config?.[key];
    newData.fields[key] = config?.type === 'number' ? Number(value) : value;
    onUpdate(newData);
  };

  const removeField = (key: string) => {
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

    if (isNew) newData.fields[name] = type === 'number' ? 0 : '';

    newData.config[name] = { 
      type, 
      options: type === 'select' ? options.split(',').map(s => s.trim()).filter(Boolean) : [] 
    };

    onUpdate(newData);
    setEditingField(null);
  };

  return (
    <div className={styles.grid}>
      {metadata.fields && Object.entries(metadata.fields)
        .filter(([key]) => key !== 'summary' && key !== 'Status')
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
                  <select value={value as string} onChange={(e) => handleFieldChange(key, e.target.value)}>
                    <option value="" disabled>Selecionar...</option>
                    {config?.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={type === 'number' ? 'number' : 'text'}
                    value={value as string | number}
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
