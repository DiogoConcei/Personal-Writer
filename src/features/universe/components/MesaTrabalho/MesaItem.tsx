import React, { useState, useRef, useEffect } from 'react';
import { useMesaTrabalhoStore } from '../../store/moodBoardStore';
import { MesaItem as IMesaItem, MesaItemProps } from '@/shared/types';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { X, Tag, Check, Unlink, User, ChevronLeft, ChevronRight, Plus, Maximize2 } from 'lucide-react';
import styles from './MesaTrabalho.module.scss';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal/ConfirmModal';
import { useMesaItemResize } from '../../hooks/useMesaItemResize';
import { useCanvasText } from '@/shared/hooks/useCanvasText';

const DEFAULT_CATEGORIES = ['Personagens', 'Itens', 'Figurantes'];

const getCategoryColor = (category?: string) => {
  if (!category) return 'transparent';
  const cat = category.toLowerCase();
  if (cat === 'personagens') return '#a855f7'; // Amethyst
  if (cat === 'itens') return '#22c55e';      // Green
  if (cat === 'figurantes') return '#eab308';  // Yellow
  return '#3b82f6';                            // Blue for others
};

export const MesaItem: React.FC<MesaItemProps> = ({ 
  item, 
  zoom = 1,
  onClick, 
  onAddPhoto, 
  isConnectingSource,
  isGroupingMode,
  onConfirmGroup,
  onCancelGroup
}) => {
  const { rootPath } = useWorkspaceStore();
  const { 
    updateItem, 
    removeItem, 
    bringToFront, 
    toggleSelection, 
    selectedItems,
    groups,
    updateGroup,
    mergeIntoGroup,
    ungroupItems,
    attachItemToCharacter,
    toggleDetailsId,
    items,
    boardMode,
    connections
  } = useMesaTrabalhoStore();

  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showUngroupConfirm, setShowUngroupConfirm] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hook de Escrita Unificado
  const { 
    isEditing: isEditingText, 
    editableRef, 
    startEditing, 
    stopEditing, 
    handleKeyDown: handleTextKeyDown 
  } = useCanvasText({
    initialText: item.text || '',
    onSave: (newText) => updateItem(item.id, { text: newText }),
    isEnabled: !isGroupingMode && !onClick
  });

  const itemRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const itemStartPos = useRef({ x: 0, y: 0 });
  const groupStartPos = useRef({ x: 0, y: 0 });

  // Hook de Redimensionamento (ADR-018)
  const { isResizing, handleResizeStart } = useMesaItemResize({
    item,
    updateItem,
    itemRef
  });

  const isSelected = selectedItems.includes(item.id);
  const isInGroup = !!item.groupId;
  const isConnected = connections.some(c => c.from === item.id || c.to === item.id);

  const allImages = [item.path, ...(item.extraPaths || [])];
  const currentPath = allImages[currentImageIndex] || item.path;

  const categoryColor = getCategoryColor(item.category);
  const isCharacter = item.category?.toLowerCase() === 'personagens';
  const isItem = item.category?.toLowerCase() === 'itens';

  const isPolaroid = isCharacter && boardMode === 'planning';
  const isCircleAvatar = isCharacter && boardMode === 'free';

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Se estiver editando texto, não arrasta
    if (isEditingText) return;

    e.stopPropagation();

    if (onClick) {
      onClick();
      return;
    }

    if (isGroupingMode) {
      toggleSelection(item.id, true);
      return;
    }

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
      const dx = (e.clientX - dragStartPos.current.x) / zoom;
      const dy = (e.clientY - dragStartPos.current.y) / zoom;

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

      if (!isInGroup) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elements.find(el => 
          el.classList.contains(styles.boardItem) && 
          el.getAttribute('data-item-id') &&
          el.getAttribute('data-item-id') !== item.id
        );

        if (targetElement) {
          const targetId = targetElement.getAttribute('data-item-id')!;
          const targetItem = items.find(i => i.id === targetId);

          if (targetItem) {
            const targetIsCharacter = targetItem.category?.toLowerCase() === 'personagens';
            const targetIsItem = targetItem.category?.toLowerCase() === 'itens';

            if ((isItem && targetIsCharacter) || (isCharacter && targetIsItem)) {
              if (isItem) {
                attachItemToCharacter(item.id, targetId);
              } else {
                attachItemToCharacter(targetId, item.id);
              }
            } else {
              mergeIntoGroup(item.id, targetId);
            }
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, item.id, item.groupId, isInGroup, rootPath, updateItem, updateGroup, mergeIntoGroup, attachItemToCharacter, items, zoom]);

  const handleUngroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.groupId) {
      setShowUngroupConfirm(true);
    }
  };

  const setCategory = (cat: string | undefined) => {
    updateItem(item.id, { category: cat });
    setShowCategoryMenu(false);
  };

  return (
    <>
      <div 
        ref={itemRef}
        className={`
          ${styles.boardItem} 
          ${isDragging ? styles['boardItem--dragging'] : ''} 
          ${isCircleAvatar ? styles['boardItem--character'] : ''}
          ${isPolaroid ? styles['boardItem--polaroid'] : ''}
          ${isSelected ? styles['boardItem--selected'] : ''}
          ${isInGroup ? styles['boardItem--grouped'] : ''}
          ${isConnectingSource ? styles['boardItem--connecting'] : ''}
          ${item.type === 'text' ? styles['boardItem--text'] : ''}
          ${isResizing ? styles['boardItem--resizing'] : ''}
        `}
        data-item-id={item.id}
        style={{
          '--x': isInGroup ? '0' : `${item.x}px`,
          '--y': isInGroup ? '0' : `${item.y}px`,
          '--scale': item.scale,
          '--rotation': `${item.rotation}deg`,
          '--z-index': item.zIndex,
          '--category-color': categoryColor,
          border: !isCharacter && item.category && item.type !== 'text' ? `2px solid ${categoryColor}` : undefined,
          position: isInGroup ? 'relative' : 'absolute',
          backgroundColor: item.type === 'text' ? (item.color || 'transparent') : undefined,
          fontSize: item.type === 'text' ? (item.fontSize ? `${item.fontSize}px` : '1rem') : undefined
        } as React.CSSProperties}
        onMouseDown={handleMouseDown}
      >
        {isSelected && !isInGroup && !isDragging && !isGroupingMode && (
          <div className={styles.resizeHandles}>
            <div className={`${styles.resizeHandle} ${styles.tl}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.resizeHandle} ${styles.tr}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.resizeHandle} ${styles.bl}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.resizeHandle} ${styles.br}`} onMouseDown={handleResizeStart} />
          </div>
        )}

        {isConnected && (
          <div className={`
            ${styles.pushpin} 
            ${item.category?.toLowerCase() === 'personagens' ? styles['pushpin--blue'] : ''}
          `} />
        )}
        {item.category && !isPolaroid && item.type !== 'text' && (
          <div className={styles.categoryBadge} style={{ backgroundColor: categoryColor }}>
            {isCharacter && item.customName ? item.customName : item.category}
          </div>
        )}

        {item.type === 'text' ? (
          <div 
            ref={editableRef}
            className={styles.textItemContent}
            contentEditable={isEditingText && !isGroupingMode}
            suppressContentEditableWarning
            onBlur={stopEditing}
            onKeyDown={handleTextKeyDown}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
            onMouseDown={(e) => {
              if (isEditingText) e.stopPropagation();
            }}
          >
            {item.text}
          </div>
        ) : (
          <>
            <img 
              src={currentPath ? resolveAssetPath(currentPath, rootPath) : undefined} 
              alt="Mood item" 
              draggable={false}
              className={`${isCharacter ? styles.characterImage : ''} ${isItem ? styles.itemImage : ''}`}
              style={isCircleAvatar ? { border: `3px solid ${categoryColor}` } : {}}
            />

            {allImages.length > 1 && (
              <div className={styles.galleryNav}>
                <button onClick={handlePrevImage} className={styles.navBtn}><ChevronLeft size={16} /></button>
                <span className={styles.navInfo}>{currentImageIndex + 1}/{allImages.length}</span>
                <button onClick={handleNextImage} className={styles.navBtn}><ChevronRight size={16} /></button>
              </div>
            )}
          </>
        )}

        {isCharacter && item.customName && !item.category && !isPolaroid && (
          <div className={styles.characterNameLabel}>
            {item.customName}
          </div>
        )}

        {isPolaroid && item.customName && (
          <div className={styles.polaroidLabel}>
            {item.customName}
          </div>
        )}
        
        {isGroupingMode && isSelected ? (
          <div className={styles.itemActions} onMouseDown={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onConfirmGroup?.(); }} 
              className={`${styles.actionBtn} ${styles.confirmGroupBtn}`} 
              title="Confirmar Agrupamento"
            >
              <Check size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onCancelGroup?.(); }} 
              className={`${styles.actionBtn} ${styles.cancelGroupBtn}`} 
              title="Cancelar"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className={styles.itemActions} style={{ opacity: isResizing ? 0 : undefined, pointerEvents: isResizing ? 'none' : undefined }} onMouseDown={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCategoryMenu(!showCategoryMenu); }} 
              className={styles.actionBtn} 
              title="Categorizar"
            >
              <Tag size={12} />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onAddPhoto?.(); }} 
              className={styles.actionBtn} 
              title="Adicionar Foto"
            >
              <Plus size={12} />
            </button>
            
            {isInGroup && (
              <button onClick={handleUngroup} className={styles.actionBtn} title="Desagrupar Grupo">
                <Unlink size={12} />
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); updateItem(item.id, { scale: 1 }); }} 
              className={styles.actionBtn} 
              title="Resetar Tamanho"
            >
              <Maximize2 size={12} />
            </button>

            <button onClick={() => removeItem(item.id)} className={styles.actionBtn} title="Remover"><X size={12} /></button>
            
            {isCharacter && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleDetailsId(item.id); }} 
                className={styles.actionBtn} 
                title="Detalhes do Personagem"
              >
                <User size={12} />
              </button>
            )}

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
        )}
      </div>

      <ConfirmModal
        isOpen={showUngroupConfirm}
        onClose={() => setShowUngroupConfirm(false)}
        onConfirm={() => {
          if (item.groupId) ungroupItems(item.groupId);
          setShowUngroupConfirm(false);
        }}
        title="Desfazer Grupo"
        message="Deseja desfazer este grupo inteiro? Os itens permanecerão na mesa, mas não estarão mais agrupados."
        confirmLabel="Desfazer Grupo"
        variant="danger"
      />
    </>
  );
};
