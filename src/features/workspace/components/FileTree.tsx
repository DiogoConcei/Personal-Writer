import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import FileTreeItem from './FileTreeItem';
import styles from './FileTree.module.scss';
import { FolderOpen, RefreshCw, FilePlus, FolderPlus, FileText, Folder as FolderIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';

export default function FileTree() {
  const { 
    files, 
    rootPath, 
    setRootPath, 
    refreshFiles, 
    isLoading, 
    createFile, 
    createDirectory,
    moveItem 
  } = useWorkspaceStore();
  
  const { dragInfo, setDragInfo, resetDrag } = useUIStore();
  const [showInput, setShowInput] = useState<'file' | 'dir' | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // --- Custom Global Drag Logic ---
  useEffect(() => {
    if (!dragInfo.sourcePath) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { startX, startY, startTime, isDragging, sourcePath } = useUIStore.getState().dragInfo;
      
      if (!sourcePath) return;

      // Se ainda não é drag, verificar threshold
      if (!isDragging) {
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);
        const deltaTime = Date.now() - startTime;

        if (deltaX > 5 || deltaY > 5 || deltaTime > 150) {
          setDragInfo({ isDragging: true });
        } else {
          // Ainda não atingiu o threshold, apenas atualiza posição para caso venha a atingir
          setDragInfo({ currentX: e.clientX, currentY: e.clientY });
          return;
        }
      }

      // Identificar o que está sob o mouse
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const targetItem = element?.closest('[data-path]') as HTMLElement;
      
      let targetPath: string | null = null;
      
      if (targetItem) {
        const isDir = targetItem.getAttribute('data-is-dir') === "true";
        if (isDir) {
          targetPath = targetItem.getAttribute('data-path');
        }
      }

      setDragInfo({
        currentX: e.clientX,
        currentY: e.clientY,
        targetPath: targetPath
      });
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const { sourcePath, targetPath, isDragging } = useUIStore.getState().dragInfo;
      
      // SÓ executa o move se o threshold de drag foi atingido
      if (isDragging && sourcePath) {
        // Tenta encontrar a raiz se soltar no container mas não em um item específico
        const treeElement = document.querySelector(`.${styles.tree}`);
        const rect = treeElement?.getBoundingClientRect();
        const isInTree = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

        const finalTarget = targetPath || (isInTree ? rootPath : null);

        if (sourcePath && finalTarget) {
          // Normalização OBRIGATÓRIA antes da comparação
          const normalize = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '');
          const normSource = normalize(sourcePath);
          const normTarget = normalize(finalTarget);

          if (normSource !== normTarget && !normTarget.startsWith(normSource + '/')) {
            await moveItem(sourcePath, finalTarget);
          }
        }
      }
      resetDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo.sourcePath, rootPath, moveItem, resetDrag, setDragInfo]);

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
          <button className={styles.tree__action} onClick={() => setShowInput('file')} title="Nova Nota"><FilePlus size={14} /></button>
          <button className={styles.tree__action} onClick={() => setShowInput('dir')} title="Nova Pasta"><FolderPlus size={14} /></button>
          <button className={styles.tree__action} onClick={refreshFiles} disabled={isLoading} title="Atualizar"><RefreshCw size={14} className={isLoading ? styles.spinning : ''} /></button>
        </div>
      </header>
      
      <div className={styles.tree__content}>
        {showInput && (
          <form className={styles.tree__inputForm} onSubmit={handleSubmit}>
            <div className={styles.tree__inputWrapper}>
              <input autoFocus className={styles.tree__input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome..." />
              <div className={styles.tree__inputActions}>
                <button type="button" className={styles.tree__btnCancel} onClick={() => setShowInput(null)}>Cancelar</button>
                <button type="submit" className={styles.tree__btnConfirm}>Criar</button>
              </div>
            </div>
          </form>
        )}

        {files.map((file) => (
          <FileTreeItem key={file.path} node={file} depth={0} />
        ))}
      </div>

      {/* Ghost Element (Elemento que segue o mouse) */}
      {dragInfo.sourcePath && (
        <div 
          className={styles.ghost}
          style={{ 
            left: dragInfo.currentX + 10, 
            top: dragInfo.currentY + 10 
          }}
        >
          {dragInfo.sourceName?.endsWith('.md') ? <FileText size={14} /> : <FolderIcon size={14} />}
          <span>{dragInfo.sourceName?.replace(/\.md$/, '')}</span>
        </div>
      )}
    </div>
  );
}
