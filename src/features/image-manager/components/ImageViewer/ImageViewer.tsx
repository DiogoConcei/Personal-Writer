import { convertFileSrc } from '@tauri-apps/api/core';
import styles from './ImageViewer.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { deleteItem, renameItem } from '@/tauri-bridge';
import DeleteModal from '@/features/workspace/components/DeleteModal/DeleteModal';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import { useZoom } from '@/shared/hooks/useZoom/useZoom';
import { useState, useRef, useEffect } from 'react';

interface ImageViewerProps {
  path: string;
  onBack?: () => void;
}

export default function ImageViewer({ path, onBack }: ImageViewerProps) {
  const { setActiveFile, refreshFiles } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { zoom, setZoom, zoomIn: handleZoomIn, zoomOut: handleZoomOut } = useZoom();
  const [rotation, setRotation] = useState(0);
  const [isFitToScreen, setIsFitToScreen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tempName, setTempName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileName = path.split(/[\\/]/).pop() || '';
  const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
  const nameWithoutExt = fileName.replace(extension, '');

  const imgSrc = convertFileSrc(path) || undefined;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFit = () => {
    setIsFitToScreen(!isFitToScreen);
    setZoom(1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar entrar em modo tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteItem(path);
      addNotification('Imagem excluída com sucesso', 'success');
      setActiveFile(null);
      await refreshFiles();
      if (onBack) onBack();
    } catch (err) {
      console.error('Erro ao excluir imagem:', err);
      addNotification('Erro ao excluir imagem', 'error');
    }
  };

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tempName.trim() && tempName !== nameWithoutExt) {
      try {
        const parentDir = path.substring(0, path.lastIndexOf(path.includes('\\') ? '\\' : '/'));
        const separator = path.includes('\\') ? '\\' : '/';
        const newPath = `${parentDir}${separator}${tempName.trim()}${extension}`;

        await renameItem(path, newPath);
        addNotification('Imagem renomeada', 'success');
        setActiveFile(newPath);
        await refreshFiles();
      } catch (err) {
        console.error('Erro ao renomear imagem:', err);
        addNotification('Erro ao renomear imagem', 'error');
      }
    }
    setIsEditingName(false);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles['container--fullscreen'] : ''}`}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbar__info}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} title="Voltar para a Galeria">
              <ArrowLeft size={16} />
            </button>
          )}
          {isEditingName ? (
            <form className={styles.renameForm} onSubmit={handleRenameSubmit}>
              <input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Escape' && setIsEditingName(false)}
              />
              <button type="submit"><Check size={14} /></button>
              <button type="button" onClick={() => setIsEditingName(false)}><X size={14} /></button>
            </form>
          ) : (
            <div className={styles.nameDisplay} onClick={() => { setTempName(nameWithoutExt); setIsEditingName(true); }}>
              <span>{fileName}</span>
              <Edit3 size={12} className={styles.editIcon} />
            </div>
          )}
        </div>

        <div className={styles.toolbar__actions}>
          <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={18} /></button>
          <span className={styles.toolbar__zoom}>{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={18} /></button>
          <button onClick={handleRotate} title="Girar"><RotateCw size={18} /></button>
          <button onClick={toggleFit} title={isFitToScreen ? "Tamanho Real" : "Ajustar à Tela"}>
            {isFitToScreen ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button onClick={toggleFullscreen} title="Tela Cheia">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <div className={styles.separator} />
          <button onClick={handleDelete} className={styles.deleteBtn} title="Excluir Imagem">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className={styles.viewer}>
        <div
          className={styles.imageWrapper}
          style={{
            '--rotation': `${rotation}deg`,
            '--zoom': zoom
          } as React.CSSProperties}
        >
          <img
            src={imgSrc}
            alt="Visualização"
            className={isFitToScreen ? styles.imageFit : styles.imageOriginal}
          />
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={confirmDelete}
        itemName={fileName}
        isDir={false}
      />
    </div>
  );
}
