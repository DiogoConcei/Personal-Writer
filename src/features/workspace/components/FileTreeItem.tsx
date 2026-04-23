import React, { useState, useRef, useEffect } from 'react';
import { FileNode } from '@/tauri-bridge';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore } from '@/store/uiStore';
import DeleteModal from './DeleteModal';
import styles from './FileTreeItem.module.scss';
import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FileImage,
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

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const PDF_EXTENSIONS = ['.pdf'];

export default function FileTreeItem({ node, depth }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState<'file' | 'dir' | null>(null);
  const [tempName, setTempName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [virtualChildren, setVirtualChildren] = useState<FileNode[]>([]);

  const rootPath = useWorkspaceStore(s => s.rootPath);
  const activeFile = useWorkspaceStore(s => s.activeFile);
  const {
    setActiveFile,
    deleteItem,
    renameItem,
    createFile,
    createDirectory,
    fetchChildren
  } = useWorkspaceStore();

  const isDragTarget = useUIStore(s => s.dragInfo.targetPath === node.path && node.is_dir && !node.isVirtual);
  const isDraggingThis = useUIStore(s => s.dragInfo.sourcePath === node.path);
  const { setDragInfo } = useUIStore();

  const [hasVirtualImages, setHasVirtualImages] = useState(node.hasVirtualImages || false);
  const [virtualImagesPath, setVirtualImagesPath] = useState<string | null>(node.virtualImagesPath || null);

  const isPinned = useReferenceStore(s => s.pinnedNotes.includes(node.path));
  const { pinNote, unpinNote, setActivePdf } = useReferenceStore();

  const { setActivePanel, toggleRightSidebar, isRightSidebarVisible } = useUIStore();

  const isEditableFile = node.name.endsWith('.md');
  const isImageFile = IMAGE_EXTENSIONS.some(ext => node.name.toLowerCase().endsWith(ext));
  const isPdfFile = PDF_EXTENSIONS.some(ext => node.name.toLowerCase().endsWith(ext));
  const isSelectable = isEditableFile || isImageFile || isPdfFile;
  const isActive = activeFile === node.path;

  const children = node.children || [];

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
      if (!isOpen) {
        if (node.isVirtual) {
          try {
            const { listDirectory } = await import('@/tauri-bridge');
            const items = await listDirectory(node.path);
            setVirtualChildren(items.filter(n => !n.name.startsWith('.')).sort((a, b) => {
              if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
              return a.is_dir ? -1 : 1;
            }));
          } catch (err) {
            console.error('Erro ao carregar pasta virtual:', err);
          }
        } else {
          await loadSubItems();
        }
      }
      setIsOpen(!isOpen);
    } else if (isPdfFile) {
      setActivePdf(node.path);
      if (!isRightSidebarVisible) toggleRightSidebar();
    } else if (isSelectable) {
      setActiveFile(node.path);
      setActivePanel('editor');
    }
  };

  const loadSubItems = async () => {
    try {
      await fetchChildren(node.path);

      if (node.is_dir && node.name !== 'assets' && node.name !== '.snapshots' && !node.isVirtual && rootPath) {
        const normalize = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
        const normRoot = normalize(rootPath);
        const normNode = normalize(node.path);
        const separator = rootPath.includes('\\') ? '\\' : '/';

        if (normNode.startsWith(normRoot)) {
          let relativePath = normNode.substring(normRoot.length);
          if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

          const nativeRelativePath = relativePath.replace(/\//g, separator);
          const nodeAssetsPath = nativeRelativePath
            ? `${rootPath}${separator}assets${separator}${nativeRelativePath}`
            : `${rootPath}${separator}assets`;

          try {
            const { listDirectory } = await import('@/tauri-bridge');
            const assetsContent = await listDirectory(nodeAssetsPath);
            const hasImages = assetsContent.some(file =>
              IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
            );

            if (hasImages) {
              setHasVirtualImages(true);
              setVirtualImagesPath(nodeAssetsPath);
            } else {
              setHasVirtualImages(false);
            }
          } catch (e) {
            setHasVirtualImages(false);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao expandir pasta:', error);
    }
  };

  const handleAction = (e: React.MouseEvent, action: 'delete' | 'rename' | 'new-file' | 'new-dir' | 'pin') => {
    e.stopPropagation();
    switch (action) {
      case 'delete':
        setIsDeleting(true);
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
    }
    setIsCreating(null);
    setSelectedTemplate('');
    setTempName('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {

    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, select') || node.isVirtual) return;

    setDragInfo({
      sourcePath: node.path,
      sourceName: node.name,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      isDragging: false,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const getIcon = () => {
    if (node.is_dir) return isOpen ? ChevronDown : ChevronRight;
    if (isEditableFile || isPdfFile) return FileText;
    if (isImageFile) return FileImage;
    return FileQuestion;
  };

  const Icon = getIcon();
  const FolderIcon = node.is_dir ? Folder : null;

  return (
    <div className={styles.wrapper} style={{ '--depth': depth } as React.CSSProperties}>
      {isEditing ? (
        <form
          className={styles.editForm}
          onSubmit={handleRenameSubmit}
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
            ${!node.is_dir && !isSelectable ? styles['item--disabled'] : ''}
            ${node.isVirtual ? styles['item--virtual'] : ''}
            ${isDragTarget ? styles['item--dragover'] : ''}
            ${isDraggingThis ? styles['item--dragging-source'] : ''}
          `}
          onClick={handleToggle}
          onMouseDown={handleMouseDown}

          data-path={node.path}
          data-is-dir={node.is_dir && !node.isVirtual ? "true" : "false"}
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
            {node.is_dir ? node.name : node.name.replace(/\.(md|pdf)$/, '')}
          </span>

          <div className={styles.actions}>
            {!node.isVirtual && (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {node.is_dir && isOpen && (
        <div className={styles.children}>
          {hasVirtualImages && (
            <FileTreeItem
              node={{
                name: 'Imagens',
                path: virtualImagesPath!,
                is_dir: true,
                isVirtual: true,
                modified_at: Date.now()
              }}
              depth={depth + 1}
            />
          )}
          {isCreating && (
            <form
              className={styles.editFormContainer}
              onSubmit={handleCreateSubmit}
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
          {node.isVirtual ? (
            virtualChildren.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))
          ) : children.length > 0 ? (
            children.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))
          ) : !isCreating && (
            <div
              className={styles.item__empty}
            >
              (vazio)
            </div>
          )}
        </div>
      )}

      <DeleteModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={() => deleteItem(node.path)}
        itemName={node.name}
        isDir={node.is_dir}
      />
    </div>
  );
}
