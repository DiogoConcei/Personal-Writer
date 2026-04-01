import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './ImageNode.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { Maximize2, AlignLeft, AlignRight, AlignCenter, StretchVertical, ImageOff } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

export default function ImageNode({ node, updateAttributes, selected }: NodeViewProps) {
  const { rootPath } = useWorkspaceStore();
  const [isResizing, setIsResizing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  let src = node.attrs.src;
  if (src.startsWith('./')) {
    const relativePart = src.replace('./', '');
    const separator = rootPath?.includes('\\') ? '\\' : '/';
    const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
    src = convertFileSrc(fullPath);
  }

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
    >
      <span 
        className={styles.imageContainer}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        {hasError ? (
          <span className={styles.errorPlaceholder} style={{ width: node.attrs.width }}>
            <ImageOff size={20} />
          </span>
        ) : (
          <img 
            ref={imgRef}
            src={src} 
            alt={node.attrs.alt} 
            style={{ width: node.attrs.width, height: 'auto', display: 'inherit' }}
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
          <img src={src} alt={node.attrs.alt} onClick={(e) => e.stopPropagation()} />
          <button className={styles.fullscreenClose} onClick={() => setIsFullscreen(false)}>×</button>
        </span>
      )}
    </NodeViewWrapper>
  );
}
