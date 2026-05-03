import React, { useState, useRef, useEffect } from 'react';
import { useMoodBoardStore } from '../../store/moodBoardStore';
import { MoodBoardItem as IMoodBoardItem } from '@/shared/types';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { X, Maximize2, RotateCw, Tag, Check, Unlink } from 'lucide-react';
import styles from './MoodBoard.module.scss';

interface Props {
  item: IMoodBoardItem;
}

const DEFAULT_CATEGORIES = ['Personagens', 'Itens', 'Figurantes'];

const getCategoryColor = (category?: string) => {
  if (!category) return 'transparent';
  const cat = category.toLowerCase();
  if (cat === 'personagens') return '#a855f7'; // Amethyst
  if (cat === 'itens') return '#22c55e';      // Green
  if (cat === 'figurantes') return '#eab308';  // Yellow
  return '#3b82f6';                            // Blue for others
};

export const MoodBoardItem: React.FC<Props> = ({ item }) => {
  const { rootPath } = useWorkspaceStore();
  const { 
    updateItem, 
    removeItem, 
    bringToFront, 
    saveBoard, 
    toggleSelection, 
    selectedItems,
    groups,
    updateGroup,
    mergeIntoGroup,
    ungroupItems
  } = useMoodBoardStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const itemStartPos = useRef({ x: 0, y: 0 });
  const groupStartPos = useRef({ x: 0, y: 0 });

  const isSelected = selectedItems.includes(item.id);
  const isInGroup = !!item.groupId;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Seleção com Shift ou Ctrl
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleSelection(item.id, true);
      return;
    }

    if (isInGroup) {
      const group = groups.find(g => g.id === item.groupId);
      if (group) {
        groupStartPos.current = { x: group.x, y: group.y };
        bringToFront(group.id);
      }
    } else {
      bringToFront(item.id);
    }

    toggleSelection(item.id, false);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    itemStartPos.current = { x: item.x, y: item.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      if (isInGroup) {
        updateGroup(item.groupId!, {
          x: groupStartPos.current.x + dx,
          y: groupStartPos.current.y + dy
        });
      } else {
        updateItem(item.id, {
          x: itemStartPos.current.x + dx,
          y: itemStartPos.current.y + dy
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      
      // Detecção de colisão para agrupamento automático ao soltar
      if (!isInGroup) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elements.find(el => 
          el.classList.contains(styles.boardItem) && 
          el.getAttribute('data-item-id') &&
          el.getAttribute('data-item-id') !== item.id
        );

        if (targetElement) {
          const targetId = targetElement.getAttribute('data-item-id')!;
          mergeIntoGroup(item.id, targetId);
        }
      }

      if (rootPath) saveBoard(rootPath);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, item.id, item.groupId, isInGroup, rootPath, updateItem, updateGroup, saveBoard, mergeIntoGroup]);

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

  const handleUngroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.groupId) {
      if (window.confirm("Deseja desfazer este grupo inteiro?")) {
        ungroupItems(item.groupId);
        if (rootPath) saveBoard(rootPath);
      }
    }
  };

  const setCategory = (cat: string | undefined) => {
    updateItem(item.id, { category: cat });
    setShowCategoryMenu(false);
    if (rootPath) saveBoard(rootPath);
  };

  const categoryColor = getCategoryColor(item.category);
  const isCharacter = item.category?.toLowerCase() === 'personagens';

  return (
    <div 
      className={`
        ${styles.boardItem} 
        ${isDragging ? styles['boardItem--dragging'] : ''} 
        ${isCharacter ? styles['boardItem--character'] : ''}
        ${isSelected ? styles['boardItem--selected'] : ''}
        ${isInGroup ? styles['boardItem--grouped'] : ''}
      `}
      data-item-id={item.id}
      style={{
        '--x': isInGroup ? '0' : `${item.x}px`,
        '--y': isInGroup ? '0' : `${item.y}px`,
        '--scale': item.scale,
        '--rotation': `${item.rotation}deg`,
        '--z-index': item.zIndex,
        '--category-color': categoryColor,
        border: !isCharacter && item.category ? `2px solid ${categoryColor}` : undefined,
        position: isInGroup ? 'relative' : 'absolute'
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      {item.category && (
        <div className={styles.categoryBadge} style={{ backgroundColor: categoryColor }}>
          {item.category}
        </div>
      )}

      <img 
        src={resolveAssetPath(item.path, rootPath) || undefined} 
        alt="Mood item" 
        draggable={false}
        className={isCharacter ? styles.characterImage : ''}
        style={isCharacter ? { border: `3px solid ${categoryColor}` } : {}}
      />
      
      <div className={styles.itemActions}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowCategoryMenu(!showCategoryMenu); }} 
          className={styles.actionBtn} 
          title="Categorizar"
        >
          <Tag size={12} />
        </button>
        
        {isInGroup && (
          <button onClick={handleUngroup} className={styles.actionBtn} title="Desagrupar Grupo">
            <Unlink size={12} />
          </button>
        )}

        <button onClick={() => removeItem(item.id)} className={styles.actionBtn} title="Remover"><X size={12} /></button>
        <button onClick={handleScale} className={styles.actionBtn} title="Escala"><Maximize2 size={12} /></button>
        <button onClick={handleRotate} className={styles.actionBtn} title="Girar"><RotateCw size={12} /></button>

        {showCategoryMenu && (
          <div className={styles.categoryMenu} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.menuHeader}>Categorizar</div>
            {DEFAULT_CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                className={`${styles.menuItem} ${item.category === cat ? styles.active : ''}`}
              >
                {cat} {item.category === cat && <Check size={12} />}
              </button>
            ))}
            <div className={styles.menuDivider} />
            <div className={styles.customInput}>
              <input 
                type="text" 
                placeholder="Personalizada..." 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCategory.trim()) {
                    setCategory(customCategory.trim());
                    setCustomCategory('');
                  }
                }}
              />
              <button onClick={() => { if (customCategory.trim()) { setCategory(customCategory.trim()); setCustomCategory(''); } }}>
                <Check size={14} />
              </button>
            </div>
            {item.category && (
              <button onClick={() => setCategory(undefined)} className={styles.clearBtn}>
                Limpar Categoria
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
