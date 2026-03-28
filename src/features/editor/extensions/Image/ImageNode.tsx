import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './ImageNode.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { Maximize2, AlignLeft, AlignCenter, AlignRight, PanelLeft, PanelRight, StretchVertical } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

export default function ImageNode({ node, updateAttributes, selected }: NodeViewProps) {
  const { rootPath } = useWorkspaceStore();
  const [isResizing, setIsResizing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Converte o caminho relativo para um caminho de recurso Tauri
  const src = node.attrs.src.startsWith('./') 
    ? convertFileSrc(`${rootPath}/${node.attrs.src.replace('./', '')}`)
    : node.attrs.src;

  const onResize = (direction: 'left' | 'right', event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);

    const startX = event.clientX;
    const startWidth = imgRef.current?.clientWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diff = direction === 'right' ? currentX - startX : startX - currentX;
      const newWidth = Math.max(50, startWidth + diff);
      updateAttributes({ width: `${newWidth}px` });
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

  return (
    <NodeViewWrapper 
      className={`
        ${styles.wrapper} 
        ${styles[`wrapper--align-${node.attrs.align}`]} 
        ${styles[`wrapper--float-${node.attrs.float}`]}
        ${selected ? styles['wrapper--selected'] : ''}
      `}
    >
      <div 
        className={styles.imageContainer}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        <img 
          ref={imgRef}
          src={src} 
          alt={node.attrs.alt} 
          style={{ width: node.attrs.width, height: node.attrs.height }}
        />

        {selected && !isResizing && (
          <>
            <div className={`${styles.handle} ${styles['handle--right']}`} onMouseDown={(e) => onResize('right', e)} />
            <div className={`${styles.handle} ${styles['handle--left']}`} onMouseDown={(e) => onResize('left', e)} />
          </>
        )}

        {showToolbar && (
          <div className={styles.toolbar}>
            <div className={styles.toolbar__group}>
              <button onClick={() => handleAction('align', 'left')} className={node.attrs.align === 'left' ? styles.active : ''}><AlignLeft size={14} /></button>
              <button onClick={() => handleAction('align', 'center')} className={node.attrs.align === 'center' ? styles.active : ''}><AlignCenter size={14} /></button>
              <button onClick={() => handleAction('align', 'right')} className={node.attrs.align === 'right' ? styles.active : ''}><AlignRight size={14} /></button>
            </div>
            <div className={styles.toolbar__divider} />
            <div className={styles.toolbar__group}>
              <button onClick={() => handleAction('float', 'left')} className={node.attrs.float === 'left' ? styles.active : ''}><PanelLeft size={14} /></button>
              <button onClick={() => handleAction('float', 'none')} className={node.attrs.float === 'none' ? styles.active : ''}><StretchVertical size={14} /></button>
              <button onClick={() => handleAction('float', 'right')} className={node.attrs.float === 'right' ? styles.active : ''}><PanelRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
