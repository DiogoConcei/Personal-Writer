import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import styles from './EditorRuler.module.scss';

export const EditorRuler: React.FC = () => {
  const { metadata, setMargins, save } = useEditorStore();
  const { activeFile, rootPath } = useWorkspaceStore();
  const margins = metadata.margins || { left: 80, right: 80, top: 40, bottom: 40 };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingLeft && !isDraggingRight) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (isDraggingLeft) {
        const newLeft = Math.max(20, Math.min(x, rect.width / 2 - 50));
        setMargins({ ...margins, left: newLeft });
      } else if (isDraggingRight) {
        const newRight = Math.max(20, Math.min(rect.width - x, rect.width / 2 - 50));
        setMargins({ ...margins, right: newRight });
      }
    };

    const handleMouseUp = () => {
      if ((isDraggingLeft || isDraggingRight) && activeFile && rootPath) {
        save(activeFile, rootPath);
      }
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, margins, setMargins]);

  return (
    <div className={styles.rulerContainer} ref={containerRef}>
      <div className={styles.ruler}>
        {/* Área ativa entre as margens */}
        <div 
          className={styles.rulerActiveArea} 
          style={{ 
            left: `${margins.left}px`, 
            right: `${margins.right}px` 
          }} 
        />
        
        {/* Alça esquerda */}
        <div 
          className={`${styles.marginHandle} ${styles.leftHandle}`}
          style={{ left: `${margins.left}px` }}
          onMouseDown={handleMouseDownLeft}
        />

        {/* Alça direita */}
        <div 
          className={`${styles.marginHandle} ${styles.rightHandle}`}
          style={{ right: `${margins.right}px` }}
          onMouseDown={handleMouseDownRight}
        />
      </div>
    </div>
  );
};
