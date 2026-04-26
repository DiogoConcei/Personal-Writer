import React, { useState, useRef, useEffect } from 'react';
import { MoodBoardItem as IMoodBoardItem, useMoodBoardStore } from '../../store/moodBoardStore';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { X, Maximize2, RotateCw } from 'lucide-react';
import styles from './MoodBoard.module.scss';

interface Props {
  item: IMoodBoardItem;
}

export const MoodBoardItem: React.FC<Props> = ({ item }) => {
  const { rootPath } = useWorkspaceStore();
  const { updateItem, removeItem, bringToFront, saveBoard } = useMoodBoardStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const itemStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringToFront(item.id);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    itemStartPos.current = { x: item.x, y: item.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      updateItem(item.id, {
        x: itemStartPos.current.x + dx,
        y: itemStartPos.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rootPath) saveBoard(rootPath);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, item.id, rootPath, updateItem, saveBoard]);

  const handleScale = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScale = item.scale === 1 ? 1.5 : item.scale === 1.5 ? 0.5 : 1;
    updateItem(item.id, { scale: newScale });
    if (rootPath) saveBoard(rootPath);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(item.id, { rotation: (item.rotation + 45) % 360 });
    if (rootPath) saveBoard(rootPath);
  };

  return (
    <div 
      className={`${styles.boardItem} ${isDragging ? styles['boardItem--dragging'] : ''}`}
      style={{
        '--x': `${item.x}px`,
        '--y': `${item.y}px`,
        '--scale': item.scale,
        '--rotation': `${item.rotation}deg`,
        '--z-index': item.zIndex
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={resolveAssetPath(item.path, rootPath) || undefined} 
        alt="Mood item" 
        draggable={false}
      />
      
      <div className={styles.itemActions}>
        <button onClick={() => removeItem(item.id)} className={styles.actionBtn} title="Remover"><X size={12} /></button>
        <button onClick={handleScale} className={styles.actionBtn} title="Escala"><Maximize2 size={12} /></button>
        <button onClick={handleRotate} className={styles.actionBtn} title="Girar"><RotateCw size={12} /></button>
      </div>
    </div>
  );
};
