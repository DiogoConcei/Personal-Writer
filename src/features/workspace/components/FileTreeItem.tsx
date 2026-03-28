import React, { useState, useRef, useEffect } from 'react';
import { FileNode, listDirectory } from '@/tauri-bridge';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore } from '@/store/uiStore';
import styles from './FileTreeItem.module.scss';
import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  FileQuestion, 
  Trash2, 
  Edit3, 
  FilePlus, 
  FolderPlus,
  Pin,
  Check,
  X
} from 'lucide-react';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
}

export default function FileTreeItem({ node, depth }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState<'file' | 'dir' | null>(null);
  const [tempName, setTempName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const { 
    activeFile, 
    setActiveFile, 
    deleteItem, 
    renameItem, 
    createFile, 
    createDirectory 
  } = useWorkspaceStore();

  const { pinNote, pinnedNotes, unpinNote } = useReferenceStore();
  const { toggleRightSidebar, isRightSidebarVisible } = useUIStore();

  const isEditableFile = node.name.endsWith('.md');
  const isActive = activeFile === node.path;
  const isPinned = pinnedNotes.includes(node.path);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing || isCreating) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, isCreating]);

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (node.is_dir) {
      if (!isOpen && children.length === 0) {
        await loadSubItems();
      }
      setIsOpen(!isOpen);
    } else if (isEditableFile) {
      setActiveFile(node.path);
    }
  };

  const loadSubItems = async () => {
    try {
      const result = await listDirectory(node.path);
      const sorted = result.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
      setChildren(sorted);
    } catch (error) {
      console.error('Erro ao expandir pasta:', error);
    }
  };

  const handleAction = (e: React.MouseEvent, action: 'delete' | 'rename' | 'new-file' | 'new-dir' | 'pin') => {
    e.stopPropagation();
    switch (action) {
      case 'delete':
        if (confirm(`Excluir permanentemente "${node.name}"?`)) {
          deleteItem(node.path);
        }
        break;
      case 'rename':
        setTempName(node.is_dir ? node.name : node.name.replace(/\.md$/, ''));
        setIsEditing(true);
        break;
      case 'new-file':
        setIsOpen(true);
        setIsCreating('file');
        setTempName('');
        break;
      case 'new-dir':
        setIsOpen(true);
        setIsCreating('dir');
        setTempName('');
        break;
      case 'pin':
        if (isPinned) {
          unpinNote(node.path);
        } else {
          pinNote(node.path);
          if (!isRightSidebarVisible) toggleRightSidebar();
        }
        break;
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && tempName !== node.name) {
      await renameItem(node.path, tempName.trim());
    }
    setIsEditing(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      if (isCreating === 'file') {
        const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
        await createFile(tempName.trim(), node.path, template?.content);
      } else {
        await createDirectory(tempName.trim(), node.path);
      }
      await loadSubItems();
    }
    setIsCreating(null);
    setSelectedTemplate('');
    setTempName('');
  };

  const Icon = node.is_dir 
    ? (isOpen ? ChevronDown : ChevronRight) 
    : (isEditableFile ? FileText : FileQuestion);

  const FolderIcon = node.is_dir ? Folder : null;

  return (
    <div className={styles.wrapper}>
      {isEditing ? (
        <form 
          className={styles.editForm} 
          onSubmit={handleRenameSubmit} 
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <input
            ref={inputRef}
            className={styles.editInput}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsEditing(false)}
          />
        </form>
      ) : (
        <div 
          className={`
            ${styles.item} 
            ${isActive ? styles['item--active'] : ''}
            ${!node.is_dir && !isEditableFile ? styles['item--disabled'] : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={handleToggle}
        >
          <span className={styles.item__arrow}>
            <Icon size={14} />
          </span>
          
          {FolderIcon && (
            <span className={styles.item__folder}>
              <FolderIcon size={14} />
            </span>
          )}
          
          <span className={styles.item__name} title={node.name}>
            {node.is_dir ? node.name : node.name.replace(/\.md$/, '')}
          </span>

          <div className={styles.actions}>
            {isEditableFile && (
              <button 
                onClick={(e) => handleAction(e, 'pin')} 
                title={isPinned ? "Desafixar" : "Fixar na Referência"}
                className={isPinned ? styles.actions__pinned : ''}
              >
                <Pin size={12} />
              </button>
            )}
            {node.is_dir && (
              <>
                <button onClick={(e) => handleAction(e, 'new-file')} title="Nova Nota"><FilePlus size={12} /></button>
                <button onClick={(e) => handleAction(e, 'new-dir')} title="Nova Pasta"><FolderPlus size={12} /></button>
              </>
            )}
            <button onClick={(e) => handleAction(e, 'rename')} title="Renomear"><Edit3 size={12} /></button>
            <button onClick={(e) => handleAction(e, 'delete')} className={styles.actions__delete} title="Excluir"><Trash2 size={12} /></button>
          </div>
        </div>
      )}

      {node.is_dir && isOpen && (
        <div className={styles.children}>
          {isCreating && (
            <form 
              className={styles.editFormContainer} 
              onSubmit={handleCreateSubmit} 
              style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
            >
              <div className={styles.editInputWrapper}>
                <input
                  ref={inputRef}
                  className={styles.editInput}
                  value={tempName}
                  placeholder={isCreating === 'file' ? "Nome da nota..." : "Nome da pasta..."}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsCreating(null)}
                />
                {isCreating === 'file' && (
                  <select 
                    className={styles.editSelect}
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Sem Template</option>
                    {DEFAULT_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                <div className={styles.editActions}>
                  <button type="submit" className={styles.btnConfirm}><Check size={12} /></button>
                  <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(null)}><X size={12} /></button>
                </div>
              </div>
            </form>
          )}
          {children.length > 0 ? (
            children.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))
          ) : !isCreating && (
            <div 
              className={styles.item__empty} 
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
            >
              (vazio)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
