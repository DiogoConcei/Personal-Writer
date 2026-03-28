import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import FileTreeItem from './FileTreeItem';
import styles from './FileTree.module.scss';
import { FolderOpen, RefreshCw, FilePlus, FolderPlus, X, Check } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';

export default function FileTree() {
  const { files, rootPath, setRootPath, refreshFiles, isLoading, createFile, createDirectory } = useWorkspaceStore();
  const [showInput, setShowInput] = useState<'file' | 'dir' | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleOpenWorkspace = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Selecionar Pasta do Workspace'
    });

    if (selected && typeof selected === 'string') {
      await setRootPath(selected);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName.trim()) return;

    if (showInput === 'file') {
      const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
      await createFile(newName, undefined, template?.content);
    } else {
      await createDirectory(newName);
    }

    setNewName('');
    setSelectedTemplate('');
    setShowInput(null);
  };

  const cancelInput = () => {
    setNewName('');
    setSelectedTemplate('');
    setShowInput(null);
  };

  if (!rootPath) {
    return (
      <div className={styles.empty}>
        <FolderOpen size={48} className={styles.empty__icon} />
        <p>Nenhum workspace aberto</p>
        <button className={styles.empty__button} onClick={handleOpenWorkspace}>
          Abrir Pasta
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tree}>
      <header className={styles.tree__header}>
        <span className={styles.tree__title}>Arquivos</span>
        <div className={styles.tree__actions}>
          <button 
            className={styles.tree__action} 
            onClick={() => setShowInput('file')}
            title="Nova Nota (.md)"
          >
            <FilePlus size={14} />
          </button>
          <button 
            className={styles.tree__action} 
            onClick={() => setShowInput('dir')}
            title="Nova Pasta"
          >
            <FolderPlus size={14} />
          </button>
          <button 
            className={styles.tree__action} 
            onClick={refreshFiles}
            disabled={isLoading}
            title="Atualizar"
          >
            <RefreshCw size={14} className={isLoading ? styles.spinning : ''} />
          </button>
        </div>
      </header>
      
      <div className={styles.tree__content}>
        {showInput && (
          <form className={styles.tree__inputForm} onSubmit={handleSubmit}>
            <div className={styles.tree__inputWrapper}>
              <input
                autoFocus
                className={styles.tree__input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && cancelInput()}
                placeholder={showInput === 'file' ? 'Nome da nota...' : 'Nome da pasta...'}
              />
              
              {showInput === 'file' && (
                <div className={styles.tree__selectWrapper}>
                  <label>Modelo (Template)</label>
                  <select 
                    className={styles.tree__select}
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Nota em Branco</option>
                    {DEFAULT_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.tree__inputActions}>
                <button type="button" className={styles.tree__btnCancel} onClick={cancelInput}>Cancelar</button>
                <button type="submit" className={styles.tree__btnConfirm}>Criar</button>
              </div>
            </div>
          </form>
        )}

        {files.map((file) => (
          <FileTreeItem key={file.path} node={file} depth={0} />
        ))}
      </div>
    </div>
  );
}
