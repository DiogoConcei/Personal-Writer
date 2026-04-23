import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './ImageNode.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { Maximize2, AlignLeft, AlignRight, AlignCenter, StretchVertical, ImageOff } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

export default function ImageNode({ node, updateAttributes, selected, getPos, editor }: NodeViewProps) {
  const { rootPath } = useWorkspaceStore();
  const { setDragInfo } = useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  // Efeito para resolver o caminho da imagem (suporta caminhos relativos e nomes de arquivo estilo Obsidian)
  useEffect(() => {
    const resolve = async () => {
      let currentSrc = node.attrs.src;
      if (!currentSrc) return;

      // 1. Caminho Externo (http)
      if (currentSrc.startsWith('http')) {
        setResolvedSrc(currentSrc);
        return;
      }

      // 2. Caminho Relativo Padrão (./)
      if (currentSrc.startsWith('./')) {
        const relativePart = currentSrc.replace('./', '');
        const separator = rootPath?.includes('\\') ? '\\' : '/';
        const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
        setResolvedSrc(convertFileSrc(fullPath));
        return;
      }

      // 3. Caminho Absoluto
      const isAbsolute = /^[a-zA-Z]:[\\/]/.test(currentSrc) || currentSrc.startsWith('/');
      if (isAbsolute) {
        setResolvedSrc(convertFileSrc(currentSrc));
        return;
      }

      // 4. Nome de Arquivo Solto (Padrão Obsidian ![[imagem.png]])
      // Buscamos em todo o workspace se o nome do arquivo bate
      if (rootPath) {
        try {
          const { scanWorkspaceImages } = await import('@/tauri-bridge/fs');
          const allImages = await scanWorkspaceImages(rootPath);
          
          // Tenta encontrar uma imagem cujo nome ou caminho final coincida com o src
          const found = allImages.find(img => 
            img.name === currentSrc || 
            img.path.endsWith('/' + currentSrc) || 
            img.path.endsWith('\\' + currentSrc)
          );

          if (found) {
            setResolvedSrc(convertFileSrc(found.full_path));
            setHasError(false);
          } else {
            setHasError(true);
          }
        } catch (err) {
          console.error('Erro ao resolver imagem Obsidian:', err);
          setHasError(true);
        }
      }
    };

    resolve();
  }, [node.attrs.src, rootPath]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignora se for resize ou botões da toolbar
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, .handle')) return;
    
    e.preventDefault();
    const pos = getPos();

    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
    
    setDragInfo({
      sourcePath: node.attrs.src, // Mantemos o src como referência
      sourceName: 'Imagem',
      sourceNodePos: pos,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      isDragging: false,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const onResizeStart = (direction: 'tl' | 'tr' | 'bl' | 'br', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);

    const startX = event.clientX;
    const startWidth = imgRef.current?.clientWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      let diff = 0;

      if (direction === 'tr' || direction === 'br') {
        diff = currentX - startX;
      } else {
        diff = startX - currentX;
      }
      
      const newWidth = Math.max(40, startWidth + diff);
      updateAttributes({ 
        width: `${newWidth}px`, 
        height: 'auto'
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleAction = (attr: string, value: string) => {
    updateAttributes({ [attr]: value });
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  return (
    <NodeViewWrapper 
      as="span"
      className={`
        ${styles.wrapper} 
        ${styles[`wrapper--layout-${node.attrs.layout}`]}
        ${selected ? styles['wrapper--selected'] : ''}
      `}
      onMouseDown={handleMouseDown}
    >
      <span 
        className={styles.imageContainer}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
        style={{ '--image-width': node.attrs.width } as React.CSSProperties}
      >
        {hasError ? (
          <span className={styles.errorPlaceholder}>
            <ImageOff size={20} />
            <span className={styles.errorText}>{node.attrs.src}</span>
          </span>
        ) : (
          <img 
            ref={imgRef}
            src={resolvedSrc} 
            alt={node.attrs.alt} 
            className={styles.image}
            onDoubleClick={() => setIsFullscreen(true)}
            onError={() => setHasError(true)}
            onLoad={() => setHasError(false)}
          />
        )}

        {selected && !isResizing && !hasError && (
          <>
            <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => onResizeStart('tl', e)} />
            <div className={`${styles.handle} ${styles['handle--tr']}`} onMouseDown={(e) => onResizeStart('tr', e)} />
            <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => onResizeStart('bl', e)} />
            <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => onResizeStart('br', e)} />
          </>
        )}

        {(showToolbar || selected) && !isResizing && (
          <span className={styles.toolbar}>
            <button 
              onClick={() => handleAction('layout', 'inline')} 
              className={node.attrs.layout === 'inline' ? styles.active : ''}
              title="Na linha"
            >
              <StretchVertical size={14} />
            </button>
            <button 
              onClick={() => handleAction('layout', 'wrap-left')} 
              className={node.attrs.layout === 'wrap-left' ? styles.active : ''}
              title="Texto à direita (Alinhar à Esquerda)"
            >
              <AlignLeft size={14} />
            </button>
            <button 
              onClick={() => handleAction('layout', 'center')} 
              className={node.attrs.layout === 'center' ? styles.active : ''}
              title="Centralizado"
            >
              <AlignCenter size={14} />
            </button>
            <button 
              onClick={() => handleAction('layout', 'wrap-right')} 
              className={node.attrs.layout === 'wrap-right' ? styles.active : ''}
              title="Texto à esquerda (Alinhar à Direita)"
            >
              <AlignRight size={14} />
            </button>
            <div className={styles.toolbar__divider} />
            <button onClick={() => setIsFullscreen(true)} title="Tela Cheia">
              <Maximize2 size={14} />
            </button>
          </span>
        )}
      </span>

      {isFullscreen && (
        <span className={styles.fullscreenOverlay} onClick={() => setIsFullscreen(false)}>
          <img src={resolvedSrc} alt={node.attrs.alt} onClick={(e) => e.stopPropagation()} />
          <button className={styles.fullscreenClose} onClick={() => setIsFullscreen(false)}>×</button>
        </span>
      )}
    </NodeViewWrapper>
  );
}
